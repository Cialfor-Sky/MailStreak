from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.services.scan_service import start_scan, get_scan_status, get_channel
from app.db.repository import (
    get_scan,
    list_user_scan_reviews,
    get_user_scan_review,
    list_admin_notifications,
    mark_admin_notification_read,
    insert_training_dataset_entry,
    insert_role_action_log,
    mark_review_decision,
    reclassify_email_as_clean,
    insert_whitelist_request,
    list_whitelist_requests,
    get_whitelist_request,
    update_whitelist_request_status,
    insert_safe_email,
    list_safe_emails,
    reclassify_matching_emails_as_safe,
    get_safe_email_by_id,
    insert_audit_log,
)
from app.utils.dependencies import get_current_user, decode_user, RoleChecker
from app.heuristics.engine import run_heuristics
from app.ml.model import predict_email
from app.utils.header_parser import parse_email_headers
from app.services.webhook_service import queue_webhook_event

router = APIRouter()
allow_ops_admin = RoleChecker(["SUPER_ADMIN", "ADMIN"])
allow_admin_only = RoleChecker(["ADMIN"])


class ScanRequest(BaseModel):
    email_content: str
    subject: str | None = None
    metadata: dict | None = None


class ReviewDecisionRequest(BaseModel):
    decision: Literal["APPROVE_FOR_TRAINING", "REJECT", "FALSE_POSITIVE"]
    admin_notes: str | None = None


class NotificationReadRequest(BaseModel):
    notification_id: str


class WhitelistRequestCreate(BaseModel):
    scanId: str | None = None
    emailId: str | None = None
    sender: str | None = None
    subject: str
    content: str


class WhitelistReviewRequest(BaseModel):
    decision: Literal["APPROVED", "REJECTED"]
    admin_notes: str | None = None


class DirectWhitelistRequest(BaseModel):
    sender: str | None = None
    subject: str
    content: str


class SafeEmailAnalyzeResponse(BaseModel):
    safe: bool
    classification: str
    riskScore: int
    heuristicsScore: int
    updated: bool


class HeaderParseRequest(BaseModel):
    email_content: str


def _assert_user_can_access_scan(user: dict, scan: dict):
    if user.get("role") in {"SUPER_ADMIN", "ADMIN"}:
        return

    metadata = scan.get("metadata") or {}
    submitted_by = metadata.get("submitted_by") if isinstance(metadata, dict) else None
    owner_id = submitted_by.get("id") if isinstance(submitted_by, dict) else None

    if owner_id != user.get("sub"):
        raise HTTPException(status_code=403, detail="Not permitted to access this scan")


@router.post("/parse-headers")
def parse_headers(payload: HeaderParseRequest, user=Depends(get_current_user)):
    if user.get("role") not in {"SUPER_ADMIN", "ADMIN", "USER"}:
        raise HTTPException(status_code=403, detail="Operation not permitted")

    if not payload.email_content or not payload.email_content.strip():
        raise HTTPException(status_code=400, detail="email_content is required")

    parsed = parse_email_headers(payload.email_content)
    return {"headerAnalysis": parsed}


@router.post("")
@router.post("/")
async def scan_email(payload: ScanRequest, user=Depends(get_current_user)):
    if not payload.email_content:
        raise HTTPException(status_code=400, detail="email_content is required")

    if user.get("role") not in {"SUPER_ADMIN", "ADMIN", "USER"}:
        raise HTTPException(status_code=403, detail="Operation not permitted")

    parsed_headers = parse_email_headers(payload.email_content)
    parsed_fields = parsed_headers.get("fields") if isinstance(parsed_headers, dict) else {}
    derived_subject = parsed_fields.get("subject") if isinstance(parsed_fields, dict) else None
    derived_sender = parsed_fields.get("fromEmail") if isinstance(parsed_fields, dict) else None

    base_metadata = payload.metadata if isinstance(payload.metadata, dict) else {}
    resolved_subject = (payload.subject or derived_subject or "").strip() or "No Subject"
    metadata = {
        **base_metadata,
        "sender": base_metadata.get("sender") or derived_sender or "manual@scan.local",
        "header_analysis": parsed_headers,
        "organization_id": base_metadata.get("organization_id") or user.get("organization_id"),
        "submitted_by": {
            "id": user.get("sub"),
            "email": user.get("email"),
            "role": user.get("role"),
        },
        "submission_type": "user_submitted" if user.get("role") == "USER" else "admin_submitted",
    }

    scan_id = await start_scan(resolved_subject, payload.email_content, metadata)

    insert_role_action_log(
        actor=user,
        action="SCAN_INITIATED",
        resource_type="scan",
        resource_id=scan_id,
        details={"submissionType": metadata["submission_type"]},
    )
    insert_audit_log(
        action="SCAN_INITIATED",
        actor=user,
        resource_type="scan",
        resource_id=scan_id,
        details={"submissionType": metadata["submission_type"]},
    )

    return {"scan_id": scan_id, "status": "queued"}


@router.get("/reviews")
def get_reviews(
    limit: int = Query(100),
    status: str | None = Query(None),
    user=Depends(allow_ops_admin),
):
    return {"reviews": list_user_scan_reviews(limit=limit, status=status)}


@router.get("/reviews/pending")
def get_pending_reviews(limit: int = Query(100), user=Depends(allow_ops_admin)):
    return {"reviews": list_user_scan_reviews(limit=limit, status="PENDING_ADMIN_REVIEW")}


@router.patch("/reviews/{review_id}")
def review_user_submission(review_id: str, payload: ReviewDecisionRequest, user=Depends(allow_admin_only)):
    review = get_user_scan_review(review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if payload.decision == "APPROVE_FOR_TRAINING":
        mark_review_decision(review_id, "APPROVED_FOR_TRAINING", payload.admin_notes, user)
        scan_result = review.get("scanResult") or {}
        insert_training_dataset_entry({
            "source_review_id": review_id,
            "scan_id": review.get("scanId"),
            "email_subject": review.get("subject"),
            "email_content": review.get("content"),
            "metadata": review.get("metadata"),
            "label": scan_result.get("classification", "unknown"),
            "risk_score": scan_result.get("riskScore"),
            "organization_id": ((review.get("metadata") or {}).get("organization_id") if isinstance(review.get("metadata"), dict) else None),
            "model_version_used": scan_result.get("modelVersionUsed"),
            "approved_by_user_id": user.get("sub"),
            "approved_by_email": user.get("email"),
        })
    elif payload.decision == "FALSE_POSITIVE":
        mark_review_decision(review_id, "FALSE_POSITIVE", payload.admin_notes, user)
        submitted_by = review.get("submittedBy") or {}
        reclassify_email_as_clean(
            submitted_by_user_id=submitted_by.get("id"),
            subject=review.get("subject"),
            content=review.get("content"),
        )
    else:
        mark_review_decision(review_id, "REJECTED", payload.admin_notes, user)

    insert_role_action_log(
        actor=user,
        action="TRAINING_REVIEW_DECIDED",
        resource_type="review",
        resource_id=review_id,
        details={"decision": payload.decision},
    )

    return {"status": "updated", "reviewId": review_id, "decision": payload.decision}


@router.get("/notifications")
def get_admin_notifications(
    limit: int = Query(50),
    status: str | None = Query(None),
    user=Depends(allow_ops_admin),
):
    return {"notifications": list_admin_notifications(limit=limit, status=status)}


@router.patch("/notifications/read")
def mark_notification_as_read(payload: NotificationReadRequest, user=Depends(allow_ops_admin)):
    mark_admin_notification_read(payload.notification_id)
    insert_role_action_log(
        actor=user,
        action="ADMIN_NOTIFICATION_READ",
        resource_type="notification",
        resource_id=payload.notification_id,
    )
    return {"status": "updated"}


@router.post("/whitelist/request")
def create_whitelist_request(payload: WhitelistRequestCreate, user=Depends(get_current_user)):
    if user.get("role") == "USER":
        request_id = insert_whitelist_request({
            "scan_id": payload.scanId,
            "email_id": payload.emailId,
            "sender": payload.sender,
            "subject": payload.subject,
            "content": payload.content,
            "requested_by_user_id": user.get("sub"),
            "requested_by_email": user.get("email"),
            "status": "PENDING",
        })
        insert_role_action_log(
            actor=user,
            action="WHITELIST_REQUEST_CREATED",
            resource_type="whitelist_request",
            resource_id=request_id,
        )
        return {"status": "created", "requestId": request_id}

    if user.get("role") == "ADMIN":
        fingerprint = insert_safe_email(
            sender=payload.sender,
            subject=payload.subject,
            content=payload.content,
            source="ADMIN_DIRECT",
            whitelisted_by=user,
        )
        insert_role_action_log(
            actor=user,
            action="WHITELIST_DIRECT_ADDED",
            resource_type="safe_email",
            resource_id=fingerprint,
        )
        return {"status": "whitelisted", "fingerprint": fingerprint}

    raise HTTPException(status_code=403, detail="Not permitted")


@router.get("/whitelist/requests")
def get_whitelist_requests(
    limit: int = Query(200),
    status: str | None = Query(None),
    user=Depends(get_current_user),
):
    if user.get("role") == "USER":
        return {
            "requests": list_whitelist_requests(
                limit=limit,
                status=status,
                requested_by_user_id=user.get("sub"),
            )
        }

    if user.get("role") in {"ADMIN", "SUPER_ADMIN"}:
        return {"requests": list_whitelist_requests(limit=limit, status=status)}

    raise HTTPException(status_code=403, detail="Not permitted")


@router.patch("/whitelist/requests/{request_id}")
def review_whitelist_request(request_id: str, payload: WhitelistReviewRequest, user=Depends(allow_admin_only)):
    req = get_whitelist_request(request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Whitelist request not found")

    if payload.decision == "APPROVED":
        fingerprint = insert_safe_email(
            sender=req.get("sender"),
            subject=req.get("subject"),
            content=req.get("content"),
            source="REQUEST_APPROVED",
            whitelisted_by=user,
            whitelist_request_id=request_id,
        )
        update_whitelist_request_status(request_id, "APPROVED", payload.admin_notes, reviewer=user)
        reclassify_matching_emails_as_safe(req.get("sender"), req.get("subject"), req.get("content"))
        insert_role_action_log(
            actor=user,
            action="WHITELIST_APPROVED",
            resource_type="whitelist_request",
            resource_id=request_id,
            details={"fingerprint": fingerprint},
        )
        insert_audit_log(
            action="WHITELIST_APPROVED",
            actor=user,
            resource_type="whitelist_request",
            resource_id=request_id,
            details={"fingerprint": fingerprint},
        )
        try:
            queue_webhook_event(
                "whitelist.approved",
                {
                    "request_id": request_id,
                    "risk_score": 0,
                    "verdict": "safe",
                    "explanation": "Admin approved whitelist request.",
                    "metadata": {"sender": req.get("sender"), "subject": req.get("subject")},
                },
            )
        except Exception:
            pass
    else:
        update_whitelist_request_status(request_id, "REJECTED", payload.admin_notes, reviewer=user)
        insert_role_action_log(
            actor=user,
            action="WHITELIST_REJECTED",
            resource_type="whitelist_request",
            resource_id=request_id,
        )

    return {"status": payload.decision}


@router.post("/whitelist/direct")
def direct_whitelist(payload: DirectWhitelistRequest, user=Depends(allow_admin_only)):
    fingerprint = insert_safe_email(
        sender=payload.sender,
        subject=payload.subject,
        content=payload.content,
        source="ADMIN_DIRECT",
        whitelisted_by=user,
    )
    insert_role_action_log(
        actor=user,
        action="WHITELIST_DIRECT_ADDED",
        resource_type="safe_email",
        resource_id=fingerprint,
    )
    reclassify_matching_emails_as_safe(payload.sender, payload.subject, payload.content)
    return {"status": "whitelisted", "fingerprint": fingerprint}


@router.get("/whitelist/safe")
def get_safe_emails(limit: int = Query(200), user=Depends(allow_ops_admin)):
    return {"safeEmails": list_safe_emails(limit=limit)}


@router.get("/whitelist/safe/{safe_email_id}/analyze", response_model=SafeEmailAnalyzeResponse)
def analyze_safe_email(safe_email_id: str, user=Depends(allow_ops_admin)):
    item = get_safe_email_by_id(safe_email_id)
    if not item:
        raise HTTPException(status_code=404, detail="Safe email not found")

    heuristics_score, _ = run_heuristics(item.get("content") or "")
    try:
        label, probs = predict_email(item.get("subject") or "", item.get("content") or "")
    except Exception:
        label, probs = "safe", {"safe": 1.0}

    confidence = int(max(probs.values()) * 100) if probs else 0
    risk_score = int(0.6 * confidence + 0.4 * heuristics_score)
    safe = label in {"clean", "safe"} and heuristics_score < 35 and risk_score < 40
    updated = False
    if safe:
        reclassify_matching_emails_as_safe(item.get("sender"), item.get("subject"), item.get("content"))
        updated = True

    insert_role_action_log(
        actor=user,
        action="SAFE_EMAIL_ANALYZED",
        resource_type="safe_email",
        resource_id=safe_email_id,
        details={"label": label, "riskScore": risk_score, "safe": safe, "updated": updated},
    )

    return {
        "safe": safe,
        "classification": "safe" if safe else label,
        "riskScore": risk_score,
        "heuristicsScore": heuristics_score,
        "updated": updated,
    }


@router.get("/{scan_id}")
def scan_status(scan_id: str, user=Depends(get_current_user)):
    status = get_scan_status(scan_id)
    if not status:
        raise HTTPException(status_code=404, detail="Scan not found")

    scan = get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    _assert_user_can_access_scan(user, scan)
    return status


@router.get("/stream/{scan_id}")
async def scan_stream(scan_id: str, token: str = Query(None)):
    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")

    user = decode_user(token)

    scan = get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    _assert_user_can_access_scan(user, scan)
    channel = get_channel(scan_id)

    async def event_generator():
        yield {"event": "progress", "data": {"scan_id": scan_id, "progress": scan["progress"], "stage": scan["stage"]}}
        while True:
            message = await channel.get()
            yield message

    return EventSourceResponse(event_generator())
