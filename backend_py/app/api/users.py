from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.security import list_users_db, create_user, update_user_role, get_user_by_id
from app.db.repository import insert_role_action_log, insert_audit_log
from app.utils.dependencies import get_current_user

router = APIRouter()


class UserCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str
    role: str
    password: str = Field(min_length=8)


class UserRoleUpdateRequest(BaseModel):
    role: str


def _allowed_create_roles(actor_role: str):
    if actor_role == "SUPER_ADMIN":
        return {"ADMIN", "USER"}
    if actor_role == "ADMIN":
        return {"USER"}
    return set()


def _actor_org(user: dict):
    actor = get_user_by_id(user.get("sub"))
    if not actor:
        return settings.default_org_id
    return actor.get("organization_id") or settings.default_org_id


def _assert_can_view_target(actor, target):
    actor_role = actor.get("role")
    if actor_role == "SUPER_ADMIN":
        return
    if actor_role == "ADMIN" and target.get("role") == "USER":
        return
    if actor.get("sub") == target.get("id"):
        return
    raise HTTPException(status_code=403, detail="Not permitted")


@router.get("/me")
def me(user=Depends(get_current_user)):
    target = get_user_by_id(user.get("sub"))
    if target:
        return target
    return {
        "id": user.get("sub"),
        "name": user.get("name") or user.get("email", "").split("@")[0],
        "email": user.get("email"),
        "role": user.get("role"),
    }


@router.get("")
@router.get("/")
def list_users(q: str | None = Query(None), user=Depends(get_current_user)):
    actor_role = user.get("role")
    org_id = _actor_org(user)
    if actor_role == "SUPER_ADMIN":
        users = [u for u in list_users_db(q=q, organization_id=org_id) if u.get("role") in {"ADMIN", "USER"}]
    elif actor_role == "ADMIN":
        users = list_users_db(role="USER", q=q, organization_id=org_id)
    else:
        raise HTTPException(status_code=403, detail="Not permitted")

    insert_role_action_log(
        actor=user,
        action="USER_LIST_VIEWED",
        resource_type="user",
        details={"visibleCount": len(users)},
    )
    return {"users": users}


@router.post("")
@router.post("/")
def create_user_endpoint(payload: UserCreateRequest, user=Depends(get_current_user)):
    requested_role = payload.role.upper().strip()
    allowed = _allowed_create_roles(user.get("role"))
    if requested_role not in allowed:
        raise HTTPException(status_code=403, detail="Not permitted to create this role")

    try:
        user_id = create_user(
            name=payload.name,
            email=payload.email,
            role=requested_role,
            password=payload.password,
            organization_id=_actor_org(user),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    insert_role_action_log(
        actor=user,
        action="USER_CREATED",
        resource_type="user",
        resource_id=user_id,
        details={"role": requested_role, "email": payload.email.lower().strip()},
    )
    insert_audit_log(
        action="USER_CREATED",
        actor=user,
        resource_type="user",
        resource_id=user_id,
        details={"role": requested_role},
    )

    created = get_user_by_id(user_id)
    return {"status": "created", "user": created}


@router.patch("/{user_id}/role")
def update_user_role_endpoint(user_id: str, payload: UserRoleUpdateRequest, user=Depends(get_current_user)):
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    _assert_can_view_target(user, target)
    actor_org = _actor_org(user)
    target_org = target.get("organization_id") or settings.default_org_id
    if actor_org != target_org:
        raise HTTPException(status_code=403, detail="Cross-organization access denied")

    actor_role = user.get("role")
    next_role = payload.role.upper().strip()

    if actor_role == "SUPER_ADMIN":
        if user.get("sub") == user_id and next_role != "SUPER_ADMIN":
            raise HTTPException(status_code=400, detail="Cannot demote self")
        if next_role not in {"SUPER_ADMIN", "ADMIN", "USER"}:
            raise HTTPException(status_code=400, detail="Invalid role")
    elif actor_role == "ADMIN":
        if target.get("role") != "USER" or next_role != "USER":
            raise HTTPException(status_code=403, detail="Admin can only manage USER accounts")
    else:
        raise HTTPException(status_code=403, detail="Not permitted")

    update_user_role(user_id, next_role)
    insert_role_action_log(
        actor=user,
        action="USER_ROLE_CHANGED",
        resource_type="user",
        resource_id=user_id,
        details={"from": target.get("role"), "to": next_role},
    )
    insert_audit_log(
        action="USER_ROLE_CHANGED",
        actor=user,
        resource_type="user",
        resource_id=user_id,
        details={"from": target.get("role"), "to": next_role},
    )

    updated = get_user_by_id(user_id)
    return {"status": "updated", "user": updated}
