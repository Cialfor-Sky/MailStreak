import hashlib
import secrets

from fastapi import Header, HTTPException

from app.db.repository import get_api_key_record, touch_api_key_usage
from app.services.redis_service import check_rate_limit


def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def generate_api_key():
    token = secrets.token_urlsafe(36)
    raw = f"msk_{token}"
    return raw[:12], raw


def authenticate_api_key(x_api_key: str = Header(None)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing API key")

    record = get_api_key_record(hash_api_key(x_api_key))
    if not record:
        raise HTTPException(status_code=401, detail="Invalid API key")

    allowed, _remaining = check_rate_limit(
        key=f"apikey:{record['id']}",
        limit=int(record.get("rate_limit_per_minute") or 60),
        window_seconds=60,
    )
    if not allowed:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    touch_api_key_usage(record["id"])
    return record
