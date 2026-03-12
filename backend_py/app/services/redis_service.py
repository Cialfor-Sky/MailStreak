import time
from collections import defaultdict, deque

from app.core.config import settings

try:
    import redis as redis_lib
except Exception:  # pragma: no cover
    redis_lib = None


_memory_buckets = defaultdict(deque)
_redis_client = None


def get_redis_client():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    if not settings.redis_url or redis_lib is None:
        return None
    try:
        _redis_client = redis_lib.from_url(settings.redis_url, decode_responses=True)
        _redis_client.ping()
        return _redis_client
    except Exception:
        _redis_client = None
        return None


def check_rate_limit(key: str, limit: int, window_seconds: int = 60):
    now = int(time.time())
    client = get_redis_client()
    if client:
        bucket_key = f"rate:{key}:{now // window_seconds}"
        count = client.incr(bucket_key)
        if count == 1:
            client.expire(bucket_key, window_seconds + 2)
        return count <= limit, max(0, limit - count)

    # In-memory fallback for local/dev
    bucket = _memory_buckets[key]
    while bucket and now - bucket[0] >= window_seconds:
        bucket.popleft()
    if len(bucket) >= limit:
        return False, 0
    bucket.append(now)
    return True, limit - len(bucket)
