import hashlib
import hmac
import json
from datetime import datetime, timedelta

import requests

from app.core.config import settings
from app.db.repository import (
    create_webhook_delivery_attempt,
    list_pending_webhook_deliveries,
    list_webhooks,
    update_webhook_delivery_attempt,
)


def _sign_payload(secret_hash: str, payload: dict):
    payload_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return hmac.new(secret_hash.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()


def queue_webhook_event(event_type: str, payload: dict, organization_id: str | None = None):
    for hook in list_webhooks(organization_id=organization_id):
        if not hook.get("is_active"):
            continue
        events = json.loads(hook.get("subscribed_events_json") or "[]")
        if event_type not in events:
            continue
        create_webhook_delivery_attempt(hook["id"], event_type, payload)


def process_webhook_retries():
    deliveries = list_pending_webhook_deliveries(limit=100)
    max_retries = max(1, int(settings.webhook_max_retries))
    hooks_by_id = {h["id"]: h for h in list_webhooks()}

    for delivery in deliveries:
        hook = hooks_by_id.get(delivery["webhook_id"])
        if not hook:
            update_webhook_delivery_attempt(delivery["id"], "FAILED", delivery["attempt"] + 1, error_message="Webhook not found")
            continue

        payload = json.loads(delivery["payload_json"])
        signature = _sign_payload(hook["secret_hash"], payload)
        attempt_num = int(delivery.get("attempt") or 0) + 1
        try:
            response = requests.post(
                hook["endpoint_url"],
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-MailStreak-Signature": signature,
                    "X-MailStreak-Event": delivery["event_type"],
                },
                timeout=6,
            )
            if 200 <= response.status_code < 300:
                update_webhook_delivery_attempt(delivery["id"], "DELIVERED", attempt_num, response_code=response.status_code)
            else:
                if attempt_num >= max_retries:
                    update_webhook_delivery_attempt(delivery["id"], "FAILED", attempt_num, response_code=response.status_code, error_message=response.text[:500])
                else:
                    next_retry = (datetime.utcnow() + timedelta(minutes=attempt_num)).isoformat()
                    update_webhook_delivery_attempt(delivery["id"], "RETRY", attempt_num, response_code=response.status_code, error_message=response.text[:500], next_retry_at=next_retry)
        except Exception as exc:
            if attempt_num >= max_retries:
                update_webhook_delivery_attempt(delivery["id"], "FAILED", attempt_num, error_message=str(exc))
            else:
                next_retry = (datetime.utcnow() + timedelta(minutes=attempt_num)).isoformat()
                update_webhook_delivery_attempt(delivery["id"], "RETRY", attempt_num, error_message=str(exc), next_retry_at=next_retry)
