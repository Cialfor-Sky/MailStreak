import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.db.repository import (
    create_api_key,
    create_webhook,
    get_counts,
    get_classification_distribution,
    get_latest_kpis,
    insert_audit_log,
    list_alerts,
    list_api_keys,
    list_emails,
)
from app.services.api_key_service import authenticate_api_key, generate_api_key, hash_api_key
from app.services.redis_service import get_redis_client
from app.services.scan_service import start_scan, get_scan_status
from app.utils.dependencies import get_current_user, RoleChecker

router = APIRouter()
allow_super_admin = RoleChecker(["SUPER_ADMIN"])
allow_ops_admin = RoleChecker(["SUPER_ADMIN", "ADMIN"])


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    organizationId: str | None = None
    tier: str = "standard"
    rateLimitPerMinute: int = Field(default=60, ge=10, le=5000)


class WebhookCreateRequest(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    endpointUrl: str
    subscribedEvents: list[str]
    secret: str = Field(min_length=12)
    organizationId: str | None = None


class PublicScanRequest(BaseModel):
    subject: str = ""
    content: str = Field(min_length=5)
    metadata: dict | None = None


@router.post("/api-keys")
def create_api_key_endpoint(payload: ApiKeyCreateRequest, user=Depends(allow_super_admin)):
    prefix, raw_key = generate_api_key()
    key_id = create_api_key(
        key_prefix=prefix,
        key_hash=hash_api_key(raw_key),
        name=payload.name,
        organization_id=payload.organizationId,
        owner_user_id=user.get("sub"),
        tier=payload.tier,
        rate_limit_per_minute=payload.rateLimitPerMinute,
    )
    insert_audit_log(
        action="API_KEY_CREATED",
        actor=user,
        resource_type="api_key",
        resource_id=key_id,
        details={"name": payload.name, "organizationId": payload.organizationId},
    )
    return {"id": key_id, "apiKey": raw_key, "prefix": prefix}


@router.get("/api-keys")
def list_api_keys_endpoint(user=Depends(allow_super_admin)):
    return {"apiKeys": list_api_keys()}


@router.post("/webhooks")
def create_webhook_endpoint(payload: WebhookCreateRequest, user=Depends(allow_ops_admin)):
    webhook_id = create_webhook(
        organization_id=payload.organizationId,
        name=payload.name,
        endpoint_url=payload.endpointUrl,
        secret_hash=hash_api_key(payload.secret),
        subscribed_events_json=json.dumps(payload.subscribedEvents),
        created_by_user_id=user.get("sub"),
    )
    insert_audit_log(
        action="WEBHOOK_CREATED",
        actor=user,
        resource_type="webhook",
        resource_id=webhook_id,
        details={"events": payload.subscribedEvents},
    )
    return {"status": "created", "webhookId": webhook_id}


@router.get("/threat-results")
def public_threat_results(api_key=Depends(authenticate_api_key)):
    rows = list_emails(limit=200, offset=0)
    insert_audit_log(
        action="PUBLIC_API_THREAT_RESULTS_QUERIED",
        resource_type="api_key",
        resource_id=api_key["id"],
    )
    return {"results": rows}


@router.post("/scan")
async def public_scan_submit(payload: PublicScanRequest, api_key=Depends(authenticate_api_key)):
    metadata = payload.metadata if isinstance(payload.metadata, dict) else {}
    metadata["organization_id"] = api_key.get("organization_id")
    metadata["submission_type"] = "api_submitted"
    scan_id = await start_scan(payload.subject, payload.content, metadata)
    insert_audit_log(
        action="PUBLIC_API_SCAN_SUBMITTED",
        resource_type="api_key",
        resource_id=api_key["id"],
        details={"scanId": scan_id},
    )
    return {"scan_id": scan_id, "status": "queued"}


@router.get("/scan/{scan_id}")
def public_scan_status(scan_id: str, api_key=Depends(authenticate_api_key)):
    status = get_scan_status(scan_id)
    if not status:
        raise HTTPException(status_code=404, detail="Scan not found")
    return status


@router.get("/whitelist")
def public_whitelist_summary(api_key=Depends(authenticate_api_key)):
    return {"summary": {"status": "available"}}


@router.get("/compliance-summary")
def public_compliance_summary(api_key=Depends(authenticate_api_key)):
    cache_key = f"public:compliance_summary:{api_key['id']}"
    client = get_redis_client()
    if client:
        cached = client.get(cache_key)
        if cached:
            return json.loads(cached)

    payload = {
        "generatedAt": datetime.utcnow().isoformat(),
        "counts": get_counts(),
        "classificationDistribution": get_classification_distribution(),
        "kpis": get_latest_kpis(),
    }
    insert_audit_log(
        action="PUBLIC_API_COMPLIANCE_SUMMARY_QUERIED",
        resource_type="api_key",
        resource_id=api_key["id"],
    )
    if client:
        client.setex(cache_key, 30, json.dumps(payload))
    return payload
