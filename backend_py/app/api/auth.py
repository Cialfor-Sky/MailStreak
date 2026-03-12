from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.core.security import verify_credentials, create_access_token, change_password
from app.utils.dependencies import get_current_user
from app.db.repository import insert_role_action_log, insert_audit_log

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    oldPassword: str = Field(min_length=6)
    newPassword: str = Field(min_length=8)
    confirmPassword: str = Field(min_length=8)


@router.post("/login")
def login(payload: LoginRequest):
    user = verify_credentials(payload.email, payload.password)
    if not user:
        insert_audit_log(
            action="LOGIN_FAILED",
            actor={"email": payload.email, "role": "UNKNOWN"},
            resource_type="auth",
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
        user["id"],
        user["email"],
        user["role"],
        user.get("name"),
        user.get("organization_id"),
    )
    insert_audit_log(
        action="LOGIN_SUCCESS",
        actor={"id": user["id"], "email": user["email"], "role": user["role"]},
        resource_type="auth",
        resource_id=user["id"],
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/change-password")
def change_user_password(payload: ChangePasswordRequest, user=Depends(get_current_user)):
    if payload.newPassword != payload.confirmPassword:
        raise HTTPException(status_code=400, detail="New password and confirmation do not match")
    if payload.oldPassword == payload.newPassword:
        raise HTTPException(status_code=400, detail="New password must be different from old password")

    try:
        change_password(user.get("sub"), payload.oldPassword, payload.newPassword)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    insert_role_action_log(
        actor=user,
        action="PASSWORD_CHANGED",
        resource_type="user",
        resource_id=user.get("sub"),
    )
    insert_audit_log(
        action="PASSWORD_CHANGED",
        actor=user,
        resource_type="user",
        resource_id=user.get("sub"),
    )
    return {"status": "updated"}
