from fastapi import Header, HTTPException, Depends
from app.core.security import decode_token
from jose import JWTError, ExpiredSignatureError


def decode_user(token: str):
    try:
        payload = decode_token(token)
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Authentication token has expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")


def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token")

    token = authorization.replace("Bearer ", "")
    return decode_user(token)


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: dict = Depends(get_current_user)):
        if user.get("role") not in self.allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Operation not permitted for role: {user.get('role')}"
            )
        return user


def is_super_admin(user: dict) -> bool:
    return user.get("role") == "SUPER_ADMIN"
