from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.utils.dependencies import RoleChecker
from app.db.repository import insert_incident, list_incidents, get_incident, update_incident, insert_role_action_log

router = APIRouter()
allow_ops_admin = RoleChecker(["SUPER_ADMIN", "ADMIN"])


class IncidentCreateRequest(BaseModel):
    title: str
    description: str | None = None
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    scanId: str | None = None
    assignedTo: str | None = None


class IncidentUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] | None = None
    status: Literal["OPEN", "IN_PROGRESS", "CLOSED"] | None = None
    assignedTo: str | None = None


@router.get("")
@router.get("/")
def get_incident_list(
    limit: int = Query(100),
    status: str | None = Query(None),
    user=Depends(allow_ops_admin),
):
    return {"incidents": list_incidents(limit=limit, status=status)}


@router.post("")
@router.post("/")
def create_incident(payload: IncidentCreateRequest, user=Depends(allow_ops_admin)):
    if not payload.title:
        raise HTTPException(status_code=400, detail="title is required")

    incident = {
        "title": payload.title,
        "description": payload.description,
        "severity": payload.severity,
        "status": "OPEN",
        "scan_id": payload.scanId,
        "created_by_user_id": user.get("sub"),
        "created_by_email": user.get("email"),
        "assigned_to": payload.assignedTo,
    }
    insert_incident(incident)

    insert_role_action_log(
        actor=user,
        action="INCIDENT_CREATED",
        resource_type="incident",
        details={"title": payload.title, "severity": payload.severity},
    )

    return {"status": "created"}


@router.patch("/{incident_id}")
def patch_incident(incident_id: str, payload: IncidentUpdateRequest, user=Depends(allow_ops_admin)):
    existing = get_incident(incident_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Incident not found")

    ok = update_incident(
        incident_id=incident_id,
        title=payload.title,
        description=payload.description,
        severity=payload.severity,
        status=payload.status,
        assigned_to=payload.assignedTo,
    )
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to update incident")

    insert_role_action_log(
        actor=user,
        action="INCIDENT_UPDATED",
        resource_type="incident",
        resource_id=incident_id,
        details={
            "status": payload.status,
            "severity": payload.severity,
            "assignedTo": payload.assignedTo,
        },
    )

    return {"status": "updated"}


@router.post("/{incident_id}/close")
def close_incident(incident_id: str, user=Depends(allow_ops_admin)):
    existing = get_incident(incident_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Incident not found")

    ok = update_incident(incident_id=incident_id, status="CLOSED")
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to close incident")

    insert_role_action_log(
        actor=user,
        action="INCIDENT_CLOSED",
        resource_type="incident",
        resource_id=incident_id,
    )

    return {"status": "closed"}