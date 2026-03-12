from fastapi import APIRouter, Depends
from app.utils.dependencies import get_current_user, RoleChecker
from app.services.analytics_service import get_dashboard_data, get_executive_data

router = APIRouter()
allow_super_admin = RoleChecker(["SUPER_ADMIN"])
allow_ops_admin = RoleChecker(["SUPER_ADMIN", "ADMIN"])

@router.get("")
def get_analytics(user=Depends(allow_ops_admin)):
    return get_dashboard_data()

@router.get("/executive")
def get_executive_analytics(user=Depends(allow_super_admin)):
    return get_executive_data()
