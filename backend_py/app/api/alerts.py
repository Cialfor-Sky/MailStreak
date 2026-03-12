from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.db.repository import list_alerts, insert_alert, insert_role_action_log
from app.utils.dependencies import RoleChecker
import uuid

router = APIRouter()
allow_ops_admin = RoleChecker(["SUPER_ADMIN", "ADMIN"])


class AlertRequest(BaseModel):
    scanId: str | None = None
    severity: str
    threatType: str
    description: str
    emailId: str | None = None
    riskScore: int | None = None
    classification: str | None = None
    isPinned: bool | None = False
    timestamp: str | None = None


@router.get("")
@router.get("/")
def get_alerts(limit: int = Query(50), severity: str | None = None, user=Depends(allow_ops_admin)):
    return {"alerts": list_alerts(limit=limit, severity=severity)}


@router.post("/")
def create_alert(payload: AlertRequest, user=Depends(allow_ops_admin)):
    if not payload.severity or not payload.threatType or not payload.description:
        raise HTTPException(status_code=400, detail="severity, threatType and description are required")

    alert_id = str(uuid.uuid4())
    insert_alert({
        "id": alert_id,
        "scan_id": payload.scanId,
        "severity": payload.severity,
        "threat_type": payload.threatType,
        "description": payload.description,
        "email_id": payload.emailId,
        "risk_score": payload.riskScore,
        "classification": payload.classification,
        "is_pinned": payload.isPinned,
        "timestamp": payload.timestamp,
    })

    insert_role_action_log(
        actor=user,
        action="ALERT_CREATED",
        resource_type="alert",
        resource_id=alert_id,
        details={"severity": payload.severity, "threatType": payload.threatType},
    )

    return {"status": "created"}