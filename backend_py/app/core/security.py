import hashlib
import hmac
import re
import uuid
from datetime import datetime, timedelta

from jose import jwt

from app.core.config import settings
from app.db.database import get_connection

# Passwords are hashed with pbkdf2_hmac sha512 and mailstreak_admin_salt_v1
STATIC_USERS = {
    "supadmin@mailstreak.com": {
        "hash": "865dcf7b3287eb8299b6f61019a4d8c37513bf97814ae096f830d2ae6d3fe35517254e4ff72196abcfa0b1f33d2432fcf2d4ca5c155a2e25e309de9e04ab9df4",
        "role": "SUPER_ADMIN",
        "id": "sup-001",
        "name": "Super Admin",
    },
    "admin@mailstreak.com": {
        "hash": "3dfed6bd5b3dcd142e93b5bc444b3e07e6ddae7ab022be694aa19920e4f78d811b6960ae5e1823e47db4dbddcdfcc2bf73617100d2847f9e4b6e2d7e047b5818",
        "role": "ADMIN",
        "id": "adm-001",
        "name": "Admin",
    },
    "user1@mailstreak.com": {
        "hash": "8483db36245ce612c5de9022f11ab9bfb35b230f39949516d7fa8abd99c75b7f6d8a9e18221e6e8dc24356dc6ebded6b35f31350fd45e121f43e84be29ff1b32",
        "role": "USER",
        "id": "usr-001",
        "name": "User 1",
    },
    "user2@mailstreak.com": {
        "hash": "c3788ede96d1fba688542e2d7bc8a7a0bdea133aa4b167a0a60709e8f77d40a1a4676d98a14b9577ce52738c8d1de837504bb55765b2fd8f4e04b8d54f481c90",
        "role": "USER",
        "id": "usr-002",
        "name": "User 2",
    },
}

ADMIN_PASSWORD_SALT = "mailstreak_admin_salt_v1"
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha512",
        password.encode("utf-8"),
        ADMIN_PASSWORD_SALT.encode("utf-8"),
        120000,
    ).hex()


def _get_user_by_email(email: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE lower(email) = ?", (email.lower(),)).fetchone()
    if not row:
        return None
    return dict(row)


def seed_static_users():
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    for email, user_info in STATIC_USERS.items():
        row = conn.execute("SELECT id FROM users WHERE lower(email) = ?", (email.lower(),)).fetchone()
        if row:
            continue
        conn.execute(
            """
            INSERT INTO users (id, name, email, role, organization_id, password_hash, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
            """,
            (
                user_info["id"],
                user_info.get("name") or email.split("@")[0],
                email,
                user_info["role"],
                settings.default_org_id,
                user_info["hash"],
                now,
                now,
            ),
        )
    conn.commit()


def verify_credentials(email: str, password: str):
    email_clean = email.strip().lower()
    row = _get_user_by_email(email_clean)

    if not row:
        user_info = STATIC_USERS.get(email_clean)
        if not user_info:
            return None
        candidate = hash_password(password.strip())
        if not hmac.compare_digest(candidate, user_info["hash"]):
            return None
        return {
            "email": email_clean,
            "role": user_info["role"],
            "id": user_info["id"],
            "name": user_info.get("name") or email_clean.split("@")[0],
            "organization_id": settings.default_org_id,
        }

    if not row.get("is_active"):
        return None

    candidate = hash_password(password.strip())
    if hmac.compare_digest(candidate, row["password_hash"]):
        return {
            "email": row["email"],
            "role": row["role"],
            "id": row["id"],
            "name": row.get("name") or row["email"].split("@")[0],
            "organization_id": row.get("organization_id") or settings.default_org_id,
        }
    return None


def _valid_email(email: str) -> bool:
    return bool(re.match(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$", email or ""))


def _strong_password(password: str) -> bool:
    if not password or len(password) < 8:
        return False
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(not c.isalnum() for c in password)
    return has_upper and has_lower and has_digit and has_special


def create_user(name: str, email: str, role: str, password: str, organization_id: str):
    conn = get_connection()
    email_clean = email.strip().lower()
    if not _valid_email(email_clean):
        raise ValueError("Invalid email format")
    if not _strong_password(password):
        raise ValueError("Password must include uppercase, lowercase, digit, and special character")
    existing = conn.execute("SELECT id FROM users WHERE lower(email) = ?", (email_clean,)).fetchone()
    if existing:
        raise ValueError("User with this email already exists")

    now = datetime.utcnow().isoformat()
    user_id = str(uuid.uuid4())
    conn.execute(
        """
        INSERT INTO users (id, name, email, role, organization_id, password_hash, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        """,
        (
            user_id,
            name.strip(),
            email_clean,
            role,
            organization_id or settings.default_org_id,
            hash_password(password),
            now,
            now,
        ),
    )
    conn.commit()
    return user_id


def update_user_role(user_id: str, role: str):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute("UPDATE users SET role = ?, updated_at = ? WHERE id = ?", (role, now, user_id))
    conn.commit()


def change_password(user_id: str, old_password: str, new_password: str):
    conn = get_connection()
    row = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        raise ValueError("User not found")

    old_hash = hash_password(old_password.strip())
    if not hmac.compare_digest(old_hash, row["password_hash"]):
        raise ValueError("Old password is incorrect")

    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
        (hash_password(new_password.strip()), now, user_id),
    )
    conn.commit()


def verify_user_password(user_id: str, password: str) -> bool:
    conn = get_connection()
    row = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        return False
    candidate = hash_password(password.strip())
    return hmac.compare_digest(candidate, row["password_hash"])


def list_users_db(role: str | None = None, q: str | None = None, organization_id: str | None = None):
    conn = get_connection()
    params = []
    where = ["is_active = 1"]
    if organization_id:
        where.append("COALESCE(organization_id, ?) = ?")
        params.extend([settings.default_org_id, organization_id])
    if role:
        where.append("role = ?")
        params.append(role)
    if q:
        where.append("(lower(name) LIKE ? OR lower(email) LIKE ?)")
        search = f"%{q.strip().lower()}%"
        params.extend([search, search])

    query = "SELECT id, name, email, role, organization_id, is_active, created_at, updated_at FROM users"
    if where:
        query += " WHERE " + " AND ".join(where)
    query += " ORDER BY datetime(created_at) DESC"

    rows = conn.execute(query, params).fetchall()

    return [dict(r) for r in rows]


def get_user_by_id(user_id: str):
    conn = get_connection()
    row = conn.execute("SELECT id, name, email, role, organization_id, is_active, deleted_at, created_at, updated_at FROM users WHERE id = ?", (user_id,)).fetchone()
    return dict(row) if row else None


def soft_delete_user_account(user_id: str):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE users SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?",
        (now, now, user_id),
    )
    conn.commit()


def create_access_token(subject: str, email: str, role: str, name: str | None = None, organization_id: str | None = None) -> str:
    expire = datetime.utcnow() + timedelta(hours=8)
    payload = {
        "sub": subject,
        "email": email,
        "role": role,
        "name": name,
        "organization_id": organization_id,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str):
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
