from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.security import create_user, get_user_by_id, list_users_db, soft_delete_user_account
from app.db.repository import insert_audit_log
from app.utils.dependencies import get_current_user

router = APIRouter()


class UserCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str
    role: str
    password: str = Field(min_length=8, max_length=128)


def _actor_record(user: dict):
    actor = get_user_by_id(user.get("sub"))
    if not actor or not actor.get("is_active"):
        raise HTTPException(status_code=401, detail="Invalid user context")
    actor["organization_id"] = actor.get("organization_id") or settings.default_org_id
    return actor


def _audit_denied(actor: dict, action: str, details: dict):
    insert_audit_log(
        action=action,
        actor={"sub": actor.get("id"), "email": actor.get("email"), "role": actor.get("role")},
        resource_type="user_management",
        details=details,
    )


def _allowed_create_roles(actor_role: str):
    if actor_role == "SUPER_ADMIN":
        return {"ADMIN", "USER"}
    if actor_role == "ADMIN":
        return {"USER"}
    return set()


@router.get("")
@router.get("/")
def list_users_endpoint(q: str | None = Query(None), user=Depends(get_current_user)):
    actor = _actor_record(user)
    role = actor.get("role")
    org_id = actor.get("organization_id")

    if role == "SUPER_ADMIN":
        users = [u for u in list_users_db(q=q, organization_id=org_id) if u.get("role") in {"ADMIN", "USER"}]
    elif role == "ADMIN":
        users = list_users_db(role="USER", q=q, organization_id=org_id)
    else:
        _audit_denied(actor, "USER_LIST_DENIED", {"reason": "role_not_allowed"})
        raise HTTPException(status_code=403, detail="Not permitted")

    insert_audit_log(
        action="USER_LIST_VIEWED",
        actor={"sub": actor.get("id"), "email": actor.get("email"), "role": role},
        resource_type="user",
        details={"organizationId": org_id, "visibleCount": len(users)},
    )
    return {"users": users}


@router.post("")
@router.post("/")
def create_user_endpoint(payload: UserCreateRequest, user=Depends(get_current_user)):
    actor = _actor_record(user)
    role = actor.get("role")
    org_id = actor.get("organization_id")
    target_role = (payload.role or "").upper().strip()
    allowed = _allowed_create_roles(role)
    if target_role not in allowed:
        _audit_denied(
            actor,
            "USER_CREATE_DENIED",
            {"reason": "role_not_allowed", "targetRole": target_role},
        )
        raise HTTPException(status_code=403, detail="Not permitted to create this role")

    try:
        user_id = create_user(
            name=payload.name,
            email=payload.email,
            role=target_role,
            password=payload.password,
            organization_id=org_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    insert_audit_log(
        action="USER_CREATED",
        actor={"sub": actor.get("id"), "email": actor.get("email"), "role": role},
        resource_type="user",
        resource_id=user_id,
        details={
            "createdBy": actor.get("id"),
            "createdRole": role,
            "targetRole": target_role,
            "organizationId": org_id,
        },
    )
    return {"status": "created", "user": get_user_by_id(user_id)}


@router.delete("/{user_id}")
def delete_user_endpoint(user_id: str, user=Depends(get_current_user)):
    actor = _actor_record(user)
    role = actor.get("role")
    actor_id = actor.get("id")
    org_id = actor.get("organization_id")

    target = get_user_by_id(user_id)
    if not target or not target.get("is_active"):
        raise HTTPException(status_code=404, detail="User not found")
    target_org = target.get("organization_id") or settings.default_org_id
    target_role = target.get("role")

    if target_org != org_id:
        _audit_denied(actor, "USER_DELETE_DENIED", {"reason": "cross_organization", "targetUserId": user_id})
        raise HTTPException(status_code=403, detail="Cross-organization access denied")

    if actor_id == user_id:
        _audit_denied(actor, "USER_DELETE_DENIED", {"reason": "self_delete_blocked"})
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    if role == "SUPER_ADMIN":
        if target_role not in {"ADMIN", "USER"}:
            _audit_denied(actor, "USER_DELETE_DENIED", {"reason": "cannot_delete_super_admin"})
            raise HTTPException(status_code=403, detail="SUPER_ADMIN can remove only ADMIN/USER")
    elif role == "ADMIN":
        if target_role != "USER":
            _audit_denied(actor, "USER_DELETE_DENIED", {"reason": "admin_target_not_user", "targetRole": target_role})
            raise HTTPException(status_code=403, detail="ADMIN can remove only USER")
    else:
        _audit_denied(actor, "USER_DELETE_DENIED", {"reason": "role_not_allowed"})
        raise HTTPException(status_code=403, detail="Not permitted")

    soft_delete_user_account(user_id)
    insert_audit_log(
        action="USER_SOFT_DELETED",
        actor={"sub": actor.get("id"), "email": actor.get("email"), "role": role},
        resource_type="user",
        resource_id=user_id,
        details={"targetRole": target_role, "organizationId": org_id},
    )
    return {"status": "deleted", "userId": user_id}
