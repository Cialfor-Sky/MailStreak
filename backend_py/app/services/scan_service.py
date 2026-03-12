import asyncio
import uuid
from datetime import datetime
import time

from app.db.repository import (
    insert_scan,
    update_scan_progress,
    update_scan_result,
    get_scan,
    insert_alert,
    insert_email,
    insert_user_scan_review,
    insert_admin_notification,
    is_email_whitelisted,
    count_sender_frequency,
)
from app.heuristics.engine import run_heuristics
from app.ml.model import predict_email_with_meta
from app.ml.anomaly_model import infer_anomaly_score
from app.ml.features import extract_header_features, extract_metadata_features, build_anomaly_text
from app.core.metrics import SCAN_TIME
from app.services.webhook_service import queue_webhook_event
from app.services.hybrid_service import aggregate_hybrid_scores, update_live_hybrid_metrics

scan_channels = {}
THREAT_LABELS = {"malware", "phishing", "spam", "suspicious"}
SAFE_LABELS = {"clean", "safe"}


def get_channel(scan_id):
    return scan_channels.setdefault(scan_id, asyncio.Queue())


async def start_scan(subject: str, content: str, metadata: dict | None):
    scan_id = str(uuid.uuid4())
    insert_scan(scan_id, "queued", 0, "queued", subject, content, metadata)

    asyncio.create_task(run_scan(scan_id, subject, content, metadata))
    return scan_id


async def run_scan(scan_id, subject, content, metadata=None):
    started = time.time()
    async def publish(progress, stage):
        update_scan_progress(scan_id, "running", progress, stage)
        await get_channel(scan_id).put({
            "event": "progress",
            "data": {"scan_id": scan_id, "progress": progress, "stage": stage},
        })

    await publish(5, "received")
    await asyncio.sleep(0.05)

    await publish(15, "preprocessing")
    await asyncio.sleep(0.05)

    await publish(30, "heuristics")
    heur_task = asyncio.to_thread(run_heuristics, content)

    await publish(45, "ml_inference")
    model_task = asyncio.to_thread(predict_email_with_meta, subject, content)

    async def progress_ticker():
        for progress in (50, 55, 60, 65):
            await asyncio.sleep(0.2)
            await publish(progress, "analyzing")

    ticker_task = asyncio.create_task(progress_ticker())

    heur_score, heur_indicators = await heur_task

    label = "suspicious"
    probs = {"suspicious": 1.0}
    model_meta = {"version": None}
    try:
        label, probs, model_meta = await asyncio.wait_for(model_task, timeout=1.5)
    except Exception:
        label = "suspicious"
        probs = {"suspicious": 1.0}
        model_meta = {"version": None}

    if not ticker_task.done():
        ticker_task.cancel()

    await publish(70, "scoring")
    await asyncio.sleep(0.05)

    supervised_score = float(
        sum(prob for cls, prob in (probs or {}).items() if str(cls).lower() in THREAT_LABELS)
    )
    if supervised_score <= 0:
        supervised_score = 1.0 if str(label).lower() in THREAT_LABELS else 0.0
    org_id = (metadata or {}).get("organization_id") if isinstance(metadata, dict) else None
    sender_frequency = count_sender_frequency(
        (metadata or {}).get("sender") if isinstance(metadata, dict) else None,
        org_id,
    )
    header_features = extract_header_features(content)
    metadata_features = extract_metadata_features(subject, content, metadata or {}, sender_frequency=sender_frequency)
    anomaly_text = build_anomaly_text(subject, content, metadata_features, header_features)
    anomaly_pred = infer_anomaly_score(org_id, anomaly_text)
    anomaly_score = float(anomaly_pred.get("anomaly_score") or 0.0)

    final_score_float = aggregate_hybrid_scores(
        supervised_score=supervised_score,
        anomaly_score=anomaly_score,
        heuristic_score=heur_score,
    )
    risk_score = int(supervised_score * 100)
    final_score = int(final_score_float * 100)
    update_live_hybrid_metrics(supervised_score, anomaly_score, final_score_float)

    if final_score >= 80:
        classification = "malware"
    elif final_score >= 60:
        classification = "phishing"
    elif final_score >= 40:
        classification = "suspicious"
    elif final_score >= 20:
        classification = "spam"
    else:
        classification = "safe" if (str(label).lower() in SAFE_LABELS and not bool(anomaly_pred.get("anomaly_flag"))) else "clean"

    severity = "critical" if final_score >= 80 else "high" if final_score >= 60 else "medium" if final_score >= 40 else "low"
    sender_email = (metadata or {}).get("sender") if isinstance(metadata, dict) else "manual@scan.local"

    if is_email_whitelisted(sender_email, subject, content):
        classification = "safe"
        final_score = min(final_score, 10)
        severity = "low"

    await publish(85, "ai_explainability")
    try:
        from app.services.explain_service import analyze_email_explainability
        explainability = await analyze_email_explainability(
            sender=(metadata or {}).get("sender") if isinstance(metadata, dict) else "manual@scan.local",
            subject=subject,
            content=content,
            ml_verdict=classification,
            heuristic_hits=[{"name": h} for h in (heur_indicators or [])]
        )
    except Exception as e:
        print(f"Explainability Error: {e}")
        explainability = None

    await publish(95, "finalizing")
    await asyncio.sleep(0.05)

    submission_type = ((metadata or {}).get("submission_type") or "system").lower() if isinstance(metadata, dict) else "system"
    submitted_by = (metadata or {}).get("submitted_by") if isinstance(metadata, dict) else None
    submitted_by_id = submitted_by.get("id") if isinstance(submitted_by, dict) else None
    submitted_by_email = submitted_by.get("email") if isinstance(submitted_by, dict) else None
    submission_tag = "User Submitted" if submission_type == "user_submitted" else "System Generated"

    result = {
        "scanId": scan_id,
        "classification": classification,
        "riskScore": final_score,
        "mlConfidence": risk_score,
        "supervisedScore": round(supervised_score, 4),
        "anomalyScore": round(anomaly_score, 4),
        "finalScore": round(final_score_float, 4),
        "anomalyFlag": bool(anomaly_pred.get("anomaly_flag")),
        "mlModel": "RF+SVM+DNN Ensemble",
        "heuristicRules": heur_indicators or ["No high-risk heuristics triggered"],
        "explainability": explainability,
        "summary": explainability.get("summary") if explainability else f"Scan complete. {classification.capitalize()} risk detected.",
        "intent": label,
        "indicators": list(probs.keys()),
        "submissionTag": submission_tag,
        "headerAnalysis": (metadata or {}).get("header_analysis") if isinstance(metadata, dict) else None,
        "modelVersionUsed": f"supervised:v{model_meta.get('version')}" if model_meta.get("version") else "supervised:legacy",
        "anomalyModelVersionUsed": f"anomaly:v{anomaly_pred.get('model_version')}" if anomaly_pred.get("model_version") else "anomaly:none",
    }

    update_scan_result(scan_id, "completed", 100, "completed", result)

    insert_email(
        email_id=str(uuid.uuid4()),
        organization_id=(metadata or {}).get("organization_id") if isinstance(metadata, dict) else None,
        sender=sender_email,
        subject=subject,
        content=content,
        classification=classification,
        risk_score=final_score,
        ml_confidence=risk_score,
        ml_model="RF+SVM+DNN Ensemble",
        heuristic_rules=heur_indicators or ["No high-risk heuristics triggered"],
        explainability=explainability,
        timestamp=datetime.utcnow().isoformat(),
        submitted_by_user_id=submitted_by_id,
        submitted_by_email=submitted_by_email,
        submission_type=submission_type,
        supervised_score=supervised_score,
        anomaly_score=anomaly_score,
        final_score=final_score,
        anomaly_flag=bool(anomaly_pred.get("anomaly_flag")),
        model_version_used=result.get("modelVersionUsed"),
        anomaly_model_version_used=result.get("anomalyModelVersionUsed"),
    )

    if submission_type == "user_submitted" and submitted_by_id and submitted_by_email:
        review_id = str(uuid.uuid4())
        insert_user_scan_review({
            "id": review_id,
            "scan_id": scan_id,
            "submitted_by_user_id": submitted_by_id,
            "submitted_by_email": submitted_by_email,
            "subject": subject,
            "content": content,
            "metadata": metadata,
            "scan_result": result,
            "status": "PENDING_ADMIN_REVIEW",
            "approved_for_training": False,
        })

        insert_admin_notification({
            "type": "USER_SUBMISSION_PENDING_REVIEW",
            "title": "User Submitted Email Pending Review",
            "message": f"Scan {scan_id} submitted by {submitted_by_email} requires admin review.",
            "review_id": review_id,
            "scan_id": scan_id,
            "status": "UNREAD",
            "payload": {
                "submittedBy": submitted_by,
                "scanResult": result,
                "metadata": metadata,
                "status": "Pending Review",
                "tag": "User Submitted",
            },
        })

    await get_channel(scan_id).put({
        "event": "completed",
        "data": {"scan_id": scan_id, "progress": 100, "stage": "completed", "result": result},
    })

    try:
        queue_webhook_event(
            "scan.completed",
            {
                "scan_id": scan_id,
                "risk_score": final_score,
                "verdict": classification,
                "explanation": result.get("summary"),
                "metadata": metadata or {},
            },
            organization_id=(metadata or {}).get("organization_id") if isinstance(metadata, dict) else None,
        )
        if classification in {"phishing", "malware", "suspicious", "spam"}:
            queue_webhook_event(
                "threat.detected",
                {
                    "scan_id": scan_id,
                    "risk_score": final_score,
                    "verdict": classification,
                    "explanation": result.get("summary"),
                    "metadata": metadata or {},
                },
                organization_id=(metadata or {}).get("organization_id") if isinstance(metadata, dict) else None,
            )
    except Exception:
        pass

    if classification in THREAT_LABELS:
        insert_alert({
            "id": str(uuid.uuid4()),
            "scan_id": scan_id,
            "severity": severity,
            "threat_type": f"{classification.capitalize()} Detected",
            "description": result["summary"],
            "email_id": f"MSG-{datetime.utcnow().strftime('%Y%m%d')}-{scan_id[:6]}",
            "risk_score": final_score,
            "classification": classification,
            "is_pinned": severity in ["critical", "high"],
            "timestamp": datetime.utcnow().isoformat(),
        })
    SCAN_TIME.observe(max(0.0, time.time() - started))


def get_scan_status(scan_id):
    scan = get_scan(scan_id)
    if not scan:
        return None
    return {
        "scan_id": scan["id"],
        "status": scan["status"],
        "progress": scan["progress"],
        "stage": scan["stage"],
        "result": scan["result"],
        "error": scan["error"],
    }
