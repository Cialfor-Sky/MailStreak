from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.security import verify_user_password, get_user_by_id
from app.db.repository import (
    create_gdpr_request,
    get_user_scan_history,
    get_user_training_submissions,
    get_user_whitelist_actions,
    anonymize_user_data,
    insert_audit_log,
    soft_delete_user,
)
from app.utils.dependencies import get_current_user

router = APIRouter()


class GdprDeleteRequest(BaseModel):
    action: str = Field(pattern="^(DELETE_ACCOUNT|ANONYMIZE_DATA)$")
    password: str = Field(min_length=6)
    confirmAction: str


@router.get("/export")
def export_my_data(user=Depends(get_current_user)):
    user_id = user.get("sub")
    profile = get_user_by_id(user_id)
    payload = {
        "exportedAt": datetime.utcnow().isoformat(),
        "userProfile": profile,
        "scanHistory": get_user_scan_history(user_id),
        "whitelistActions": get_user_whitelist_actions(user_id),
        "trainingSubmissions": get_user_training_submissions(user_id),
    }
    insert_audit_log(
        action="GDPR_EXPORT_REQUESTED",
        actor=user,
        resource_type="user",
        resource_id=user_id,
    )
    headers = {"Content-Disposition": f'attachment; filename="gdpr-export-{user_id}.json"'}
    return Response(
        content=__import__("json").dumps(payload, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers=headers,
    )


@router.post("/delete-request")
def request_delete_or_anonymize(payload: GdprDeleteRequest, user=Depends(get_current_user)):
    user_id = user.get("sub")
    if payload.action != payload.confirmAction:
        raise HTTPException(status_code=400, detail="Confirmation mismatch")

    if not verify_user_password(user_id, payload.password):
        raise HTTPException(status_code=401, detail="Password verification failed")

    soft_delete_user(user_id)

    if payload.action == "ANONYMIZE_DATA":
        anonymize_user_data(user_id)
        req_id = create_gdpr_request(user_id, user.get("email"), payload.action, "COMPLETED", None)
        insert_audit_log(
            action="GDPR_ANONYMIZATION_COMPLETED",
            actor=user,
            resource_type="user",
            resource_id=user_id,
            details={"requestId": req_id},
        )
        return {"status": "completed", "requestId": req_id}

    scheduled_for = (datetime.utcnow() + timedelta(days=settings.gdpr_hard_delete_delay_days)).isoformat()
    req_id = create_gdpr_request(user_id, user.get("email"), payload.action, "SCHEDULED", scheduled_for)
    insert_audit_log(
        action="GDPR_DELETE_REQUESTED",
        actor=user,
        resource_type="user",
        resource_id=user_id,
        details={"requestId": req_id, "scheduledFor": scheduled_for},
    )
    return {"status": "scheduled", "requestId": req_id, "scheduledFor": scheduled_for}
