from fastapi import APIRouter, Depends, Query
from app.utils.dependencies import get_current_user
from app.db.repository import list_emails, count_emails

router = APIRouter()


@router.get("")
def get_emails(limit: int = Query(50), offset: int = Query(0), user=Depends(get_current_user)):
    submitted_by_user_id = user.get("sub") if user.get("role") == "USER" else None
    return {"emails": list_emails(limit=limit, offset=offset, submitted_by_user_id=submitted_by_user_id)}


@router.get("/count")
def get_email_count(user=Depends(get_current_user)):
    submitted_by_user_id = user.get("sub") if user.get("role") == "USER" else None
    return {"count": count_emails(submitted_by_user_id=submitted_by_user_id)}