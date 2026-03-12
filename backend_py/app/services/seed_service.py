import json
import uuid
from datetime import datetime
from app.db.database import init_db
from app.db.repository import insert_scan, update_scan_result, insert_alert, get_counts, insert_emails_bulk


def seed_now():
    init_db()

    samples = [
        {
            "subject": "Urgent: Verify Your Account",
            "content": "Please verify your account at http://secure-login.example.com",
            "classification": "phishing",
            "risk": 72,
        },
        {
            "subject": "Invoice Attached",
            "content": "Please see the attached invoice.zip and enable macros.",
            "classification": "malware",
            "risk": 88,
        },
        {
            "subject": "Weekly Report",
            "content": "Here is the weekly report for your review.",
            "classification": "clean",
            "risk": 12,
        },
        {
            "subject": "Approved Vendor Invoice",
            "content": "Trusted vendor billing statement reviewed by finance and marked safe.",
            "classification": "safe",
            "risk": 5,
        },
        {
            "subject": "Limited Time Offer",
            "content": "Buy now and get 50% off. Click http://promo.example.com",
            "classification": "spam",
            "risk": 35,
        },
    ]

    import random
    from datetime import timedelta

    inserted = 0
    seed_emails = []
    
    # We'll create more samples to fill the trend chart
    for i in range(120): # 5 samples every hour for 24 hours approx
        sample = random.choice(samples)
        # Random time within the last 24 hours
        minutes_ago = random.randint(0, 1440)
        ts = datetime.utcnow() - timedelta(minutes=minutes_ago)
        ts_iso = ts.isoformat()
        
        scan_id = str(uuid.uuid4())
        insert_scan(
            scan_id,
            "completed",
            100,
            "completed",
            sample["subject"],
            sample["content"],
            {"seed": True},
        )

        result = {
            "scanId": scan_id,
            "classification": sample["classification"],
            "riskScore": sample["risk"],
            "mlConfidence": sample["risk"],
            "mlModel": "RF+SVM+DNN Ensemble",
            "heuristicRules": ["Seeded data"],
            "summary": f"Seeded sample classified as {sample['classification']}",
            "intent": sample["classification"],
            "indicators": [],
        }

        update_scan_result(scan_id, "completed", 100, "completed", result)

        if sample["classification"] in {"spam", "suspicious", "phishing", "malware"}:
            severity = "critical" if sample["risk"] >= 80 else "high" if sample["risk"] >= 60 else "medium" if sample["risk"] >= 40 else "low"
            insert_alert({
                "id": str(uuid.uuid4()),
                "scan_id": scan_id,
                "severity": severity,
                "threat_type": f"{sample['classification'].capitalize()} Detected",
                "description": result["summary"],
                "email_id": f"MSG-{ts.strftime('%Y%m%d')}-{scan_id[:6]}",
                "risk_score": sample["risk"],
                "classification": sample["classification"],
                "is_pinned": severity in ["critical", "high"],
                "timestamp": ts_iso,
            })
        
        seed_emails.append((
            str(uuid.uuid4()),
            f"user{random.randint(1,100)}@example.com",
            sample["subject"],
            sample["content"],
            sample["classification"],
            sample["risk"],
            sample["risk"],
            "RF+SVM+DNN Ensemble",
            json.dumps(["Seeded data"]),
            ts_iso,
            ts_iso,
        ))
        inserted += 1

    insert_emails_bulk(seed_emails)
    return {"status": "seeded", "inserted": inserted}


def seed_if_empty():
    counts = get_counts()
    if counts["scans"] == 0 and counts["alerts"] == 0 and counts.get("emails", 0) == 0:
        return seed_now()
    return {"status": "skipped", "reason": "database not empty"}
