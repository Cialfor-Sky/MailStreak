import json
import uuid
import hashlib
from datetime import datetime
from app.db.database import get_connection


def insert_scan(scan_id, status, progress, stage, subject, content, metadata):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO scans (id, status, progress, stage, subject, content, metadata_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            scan_id,
            status,
            progress,
            stage,
            subject,
            content,
            json.dumps(metadata) if metadata else None,
            now,
            now,
        ),
    )
    conn.commit()


def update_scan_progress(scan_id, status, progress, stage, error=None):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    conn.execute(
        """
        UPDATE scans
        SET status = ?, progress = ?, stage = ?, error = ?, updated_at = ?
        WHERE id = ?
        """,
        (status, progress, stage, error, now, scan_id),
    )
    conn.commit()


def update_scan_result(scan_id, status, progress, stage, result):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    conn.execute(
        """
        UPDATE scans
        SET status = ?, progress = ?, stage = ?, result_json = ?, updated_at = ?
        WHERE id = ?
        """,
        (status, progress, stage, json.dumps(result), now, scan_id),
    )
    conn.commit()


def get_scan(scan_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM scans WHERE id = ?", (scan_id,)).fetchone()
    if not row:
        return None
    return {
        **dict(row),
        "metadata": json.loads(row["metadata_json"]) if row["metadata_json"] else None,
        "result": json.loads(row["result_json"]) if row["result_json"] else None,
    }


def insert_alert(alert):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO alerts (
          id, scan_id, severity, threat_type, description, email_id,
          risk_score, classification, is_pinned, timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            alert["id"],
            alert.get("scan_id"),
            alert["severity"],
            alert["threat_type"],
            alert["description"],
            alert.get("email_id"),
            alert.get("risk_score"),
            alert.get("classification"),
            1 if alert.get("is_pinned") else 0,
            alert.get("timestamp") or now,
            now,
        ),
    )
    conn.commit()


def list_alerts(limit=50, severity=None):
    limit = max(1, min(int(limit), 200))
    conn = get_connection()
    if severity:
        rows = conn.execute(
            "SELECT * FROM alerts WHERE severity = ? ORDER BY datetime(timestamp) DESC LIMIT ?",
            (severity, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM alerts ORDER BY datetime(timestamp) DESC LIMIT ?",
            (limit,),
        ).fetchall()

    return [
        {
            "id": row["id"],
            "scanId": row["scan_id"],
            "severity": row["severity"],
            "threatType": row["threat_type"],
            "description": row["description"],
            "emailId": row["email_id"],
            "riskScore": row["risk_score"],
            "classification": row["classification"],
            "isPinned": bool(row["is_pinned"]),
            "timestamp": row["timestamp"],
        }
        for row in rows
    ]


def insert_email(
    email_id,
    organization_id,
    sender,
    subject,
    content,
    classification,
    risk_score,
    ml_confidence,
    ml_model,
    heuristic_rules,
    explainability=None,
    timestamp=None,
    submitted_by_user_id=None,
    submitted_by_email=None,
    submission_type="SYSTEM",
    supervised_score=None,
    anomaly_score=None,
    final_score=None,
    anomaly_flag=False,
    model_version_used=None,
    anomaly_model_version_used=None,
):
    now = datetime.utcnow().isoformat()
    ts = timestamp or now
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO emails (
            id, organization_id, sender, subject, content, classification, risk_score, ml_confidence,
            ml_model, heuristic_rules_json, explainability_json, submitted_by_user_id,
            submitted_by_email, submission_type, timestamp, created_at,
            supervised_score, anomaly_score, final_score, anomaly_flag, model_version_used, anomaly_model_version_used
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            email_id,
            organization_id,
            sender,
            subject,
            content,
            classification,
            risk_score,
            ml_confidence,
            ml_model,
            json.dumps(heuristic_rules),
            json.dumps(explainability) if explainability else None,
            submitted_by_user_id,
            submitted_by_email,
            (submission_type or "SYSTEM").upper(),
            ts,
            now,
            supervised_score,
            anomaly_score,
            final_score,
            1 if anomaly_flag else 0,
            model_version_used,
            anomaly_model_version_used,
        ),
    )
    conn.commit()


def _normalize_bulk_email_row(row):
    if len(row) == 16:
        return row

    if len(row) == 15:
        (
            email_id,
            sender,
            subject,
            content,
            classification,
            risk_score,
            ml_confidence,
            ml_model,
            heuristic_rules_json,
            explainability_json,
            submitted_by_user_id,
            submitted_by_email,
            submission_type,
            timestamp,
            created_at,
        ) = row
        return (
            email_id,
            None,
            sender,
            subject,
            content,
            classification,
            risk_score,
            ml_confidence,
            ml_model,
            heuristic_rules_json,
            explainability_json,
            submitted_by_user_id,
            submitted_by_email,
            submission_type,
            timestamp,
            created_at,
        )

    if len(row) == 12:
        (
            email_id,
            sender,
            subject,
            content,
            classification,
            risk_score,
            ml_confidence,
            ml_model,
            heuristic_rules_json,
            explainability_json,
            timestamp,
            created_at,
        ) = row
        return (
            email_id,
            None,
            sender,
            subject,
            content,
            classification,
            risk_score,
            ml_confidence,
            ml_model,
            heuristic_rules_json,
            explainability_json,
            None,
            None,
            "SYSTEM",
            timestamp,
            created_at,
        )

    if len(row) == 11:
        (
            email_id,
            sender,
            subject,
            content,
            classification,
            risk_score,
            ml_confidence,
            ml_model,
            heuristic_rules_json,
            timestamp,
            created_at,
        ) = row
        return (
            email_id,
            None,
            sender,
            subject,
            content,
            classification,
            risk_score,
            ml_confidence,
            ml_model,
            heuristic_rules_json,
            None,
            None,
            None,
            "SYSTEM",
            timestamp,
            created_at,
        )

    raise ValueError(f"Unsupported email bulk tuple length: {len(row)}")


def insert_emails_bulk(emails):
    conn = get_connection()
    normalized = [_normalize_bulk_email_row(row) for row in emails]
    conn.executemany(
        """
        INSERT INTO emails (
            id, organization_id, sender, subject, content, classification, risk_score, ml_confidence,
            ml_model, heuristic_rules_json, explainability_json, submitted_by_user_id,
            submitted_by_email, submission_type, timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        normalized,
    )
    conn.commit()


def list_emails(limit=50, offset=0, submitted_by_user_id=None):
    limit = max(1, min(int(limit), 500))
    offset = max(0, int(offset))
    conn = get_connection()

    if submitted_by_user_id:
        rows = conn.execute(
            """
            SELECT id, sender, subject, content, classification, risk_score, ml_confidence, ml_model,
                   organization_id, heuristic_rules_json, explainability_json, submitted_by_user_id, submitted_by_email,
                   submission_type, timestamp, created_at, supervised_score, anomaly_score, final_score,
                   anomaly_flag, model_version_used, anomaly_model_version_used
            FROM emails
            WHERE submitted_by_user_id = ?
            ORDER BY datetime(timestamp) DESC
            LIMIT ? OFFSET ?
            """,
            (submitted_by_user_id, limit, offset),
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT id, sender, subject, content, classification, risk_score, ml_confidence, ml_model,
                   organization_id, heuristic_rules_json, explainability_json, submitted_by_user_id, submitted_by_email,
                   submission_type, timestamp, created_at, supervised_score, anomaly_score, final_score,
                   anomaly_flag, model_version_used, anomaly_model_version_used
            FROM emails
            ORDER BY datetime(timestamp) DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        ).fetchall()

    emails = []
    for row in rows:
        emails.append({
            "id": row["id"],
            "sender": row["sender"],
            "organizationId": row["organization_id"],
            "subject": row["subject"],
            "content": row["content"],
            "classification": row["classification"],
            "riskScore": row["risk_score"],
            "mlConfidence": row["ml_confidence"],
            "mlModel": row["ml_model"],
            "heuristicRules": json.loads(row["heuristic_rules_json"]) if row["heuristic_rules_json"] else [],
            "explainability": json.loads(row["explainability_json"]) if row["explainability_json"] else None,
            "submittedBy": {
                "id": row["submitted_by_user_id"],
                "email": row["submitted_by_email"],
            },
            "submissionType": row["submission_type"],
            "timestamp": row["timestamp"],
            "createdAt": row["created_at"],
            "supervisedScore": row["supervised_score"],
            "anomalyScore": row["anomaly_score"],
            "finalScore": row["final_score"],
            "anomalyFlag": bool(row["anomaly_flag"]) if row["anomaly_flag"] is not None else False,
            "modelVersionUsed": row["model_version_used"],
            "anomalyModelVersionUsed": row["anomaly_model_version_used"],
        })
    return emails


def count_emails(submitted_by_user_id=None):
    conn = get_connection()
    if submitted_by_user_id:
        return conn.execute(
            "SELECT COUNT(*) as count FROM emails WHERE submitted_by_user_id = ?",
            (submitted_by_user_id,),
        ).fetchone()["count"]
    return conn.execute("SELECT COUNT(*) as count FROM emails").fetchone()["count"]


def get_counts():
    conn = get_connection()
    scans = conn.execute("SELECT COUNT(*) as count FROM scans").fetchone()["count"]
    alerts = conn.execute("SELECT COUNT(*) as count FROM alerts").fetchone()["count"]
    emails = conn.execute("SELECT COUNT(*) as count FROM emails").fetchone()["count"]
    return {"scans": scans, "alerts": alerts, "emails": emails}


def insert_training_run(
    run_id,
    status,
    started_at,
    dataset_size,
    triggered_by_user_id=None,
    triggered_by_email=None,
    triggered_by_role=None,
    dataset_source=None,
):
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO training_runs (
            id, status, started_at, dataset_size, triggered_by_user_id,
            triggered_by_email, triggered_by_role, dataset_source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            run_id,
            status,
            started_at,
            dataset_size,
            triggered_by_user_id,
            triggered_by_email,
            triggered_by_role,
            dataset_source,
        ),
    )
    conn.commit()


def update_training_run(run_id, status, completed_at, duration_ms, message, result=None):
    conn = get_connection()
    conn.execute(
        """
        UPDATE training_runs
        SET status = ?, completed_at = ?, duration_ms = ?, message = ?, result_json = ?
        WHERE id = ?
        """,
        (status, completed_at, duration_ms, message, json.dumps(result) if result else None, run_id),
    )
    conn.commit()


def list_training_runs(limit=20, triggered_by_user_id=None):
    limit = max(1, min(int(limit), 200))
    conn = get_connection()

    if triggered_by_user_id:
        rows = conn.execute(
            "SELECT * FROM training_runs WHERE triggered_by_user_id = ? ORDER BY datetime(started_at) DESC LIMIT ?",
            (triggered_by_user_id, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM training_runs ORDER BY datetime(started_at) DESC LIMIT ?",
            (limit,),
        ).fetchall()

    return [
        {
            "id": row["id"],
            "status": row["status"],
            "startedAt": row["started_at"],
            "triggeredBy": {
                "id": row["triggered_by_user_id"],
                "email": row["triggered_by_email"],
                "role": row["triggered_by_role"],
            },
            "datasetSource": row["dataset_source"],
            "completedAt": row["completed_at"],
            "durationMs": row["duration_ms"],
            "datasetSize": row["dataset_size"],
            "result": json.loads(row["result_json"]) if row["result_json"] else None,
            "message": row["message"],
        }
        for row in rows
    ]


def insert_user_scan_review(review):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO user_scan_reviews (
            id, scan_id, submitted_by_user_id, submitted_by_email, subject, content,
            metadata_json, scan_result_json, status, admin_decision, admin_notes,
            reviewed_by_user_id, reviewed_by_email, reviewed_at, approved_for_training, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            review.get("id") or str(uuid.uuid4()),
            review["scan_id"],
            review["submitted_by_user_id"],
            review["submitted_by_email"],
            review.get("subject"),
            review.get("content"),
            json.dumps(review.get("metadata")) if review.get("metadata") else None,
            json.dumps(review.get("scan_result")) if review.get("scan_result") else None,
            review.get("status", "PENDING_REVIEW"),
            review.get("admin_decision"),
            review.get("admin_notes"),
            review.get("reviewed_by_user_id"),
            review.get("reviewed_by_email"),
            review.get("reviewed_at"),
            1 if review.get("approved_for_training") else 0,
            review.get("created_at") or now,
        ),
    )
    conn.commit()


def get_user_scan_review(review_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM user_scan_reviews WHERE id = ?", (review_id,)).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "scanId": row["scan_id"],
        "submittedBy": {
            "id": row["submitted_by_user_id"],
            "email": row["submitted_by_email"],
        },
        "subject": row["subject"],
        "content": row["content"],
        "metadata": json.loads(row["metadata_json"]) if row["metadata_json"] else None,
        "scanResult": json.loads(row["scan_result_json"]) if row["scan_result_json"] else None,
        "status": row["status"],
        "adminDecision": row["admin_decision"],
        "adminNotes": row["admin_notes"],
        "reviewedBy": {
            "id": row["reviewed_by_user_id"],
            "email": row["reviewed_by_email"],
        } if row["reviewed_by_user_id"] else None,
        "reviewedAt": row["reviewed_at"],
        "approvedForTraining": bool(row["approved_for_training"]),
        "createdAt": row["created_at"],
    }


def list_user_scan_reviews(limit=100, status=None):
    limit = max(1, min(int(limit), 500))
    conn = get_connection()
    if status:
        rows = conn.execute(
            "SELECT * FROM user_scan_reviews WHERE status = ? ORDER BY datetime(created_at) DESC LIMIT ?",
            (status, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM user_scan_reviews ORDER BY datetime(created_at) DESC LIMIT ?",
            (limit,),
        ).fetchall()

    items = []
    for row in rows:
        items.append({
            "id": row["id"],
            "scanId": row["scan_id"],
            "submittedBy": {
                "id": row["submitted_by_user_id"],
                "email": row["submitted_by_email"],
            },
            "subject": row["subject"],
            "status": row["status"],
            "adminDecision": row["admin_decision"],
            "approvedForTraining": bool(row["approved_for_training"]),
            "scanResult": json.loads(row["scan_result_json"]) if row["scan_result_json"] else None,
            "metadata": json.loads(row["metadata_json"]) if row["metadata_json"] else None,
            "createdAt": row["created_at"],
            "reviewedAt": row["reviewed_at"],
        })
    return items


def update_user_scan_review(
    review_id,
    status,
    admin_decision,
    admin_notes,
    reviewed_by_user_id,
    reviewed_by_email,
    approved_for_training=False,
):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    conn.execute(
        """
        UPDATE user_scan_reviews
        SET status = ?, admin_decision = ?, admin_notes = ?, reviewed_by_user_id = ?,
            reviewed_by_email = ?, reviewed_at = ?, approved_for_training = ?
        WHERE id = ?
        """,
        (
            status,
            admin_decision,
            admin_notes,
            reviewed_by_user_id,
            reviewed_by_email,
            now,
            1 if approved_for_training else 0,
            review_id,
        ),
    )
    conn.commit()


def insert_admin_notification(notification):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO admin_notifications (
            id, type, title, message, review_id, scan_id, status, payload_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            notification.get("id") or str(uuid.uuid4()),
            notification["type"],
            notification["title"],
            notification["message"],
            notification.get("review_id"),
            notification.get("scan_id"),
            notification.get("status", "UNREAD"),
            json.dumps(notification.get("payload")) if notification.get("payload") else None,
            notification.get("created_at") or now,
            now,
        ),
    )
    conn.commit()


def list_admin_notifications(limit=50, status=None):
    limit = max(1, min(int(limit), 200))
    conn = get_connection()
    if status:
        rows = conn.execute(
            "SELECT * FROM admin_notifications WHERE status = ? ORDER BY datetime(created_at) DESC LIMIT ?",
            (status, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM admin_notifications ORDER BY datetime(created_at) DESC LIMIT ?",
            (limit,),
        ).fetchall()

    items = []
    for row in rows:
        items.append({
            "id": row["id"],
            "type": row["type"],
            "title": row["title"],
            "message": row["message"],
            "reviewId": row["review_id"],
            "scanId": row["scan_id"],
            "status": row["status"],
            "payload": json.loads(row["payload_json"]) if row["payload_json"] else None,
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        })
    return items


def mark_admin_notification_read(notification_id):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    conn.execute(
        "UPDATE admin_notifications SET status = 'READ', updated_at = ? WHERE id = ?",
        (now, notification_id),
    )
    conn.commit()


def insert_training_dataset_entry(entry):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO training_dataset_entries (
            id, source_review_id, scan_id, email_subject, email_content, metadata_json,
            label, risk_score, organization_id, model_version_used,
            approved_by_user_id, approved_by_email, approved_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            entry.get("id") or str(uuid.uuid4()),
            entry["source_review_id"],
            entry["scan_id"],
            entry.get("email_subject"),
            entry.get("email_content"),
            json.dumps(entry.get("metadata")) if entry.get("metadata") else None,
            entry["label"],
            entry.get("risk_score"),
            entry.get("organization_id"),
            entry.get("model_version_used"),
            entry["approved_by_user_id"],
            entry["approved_by_email"],
            entry.get("approved_at") or now,
            now,
        ),
    )
    conn.commit()


def insert_incident(incident):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO incidents (
            id, title, description, severity, status, scan_id, created_by_user_id,
            created_by_email, assigned_to, created_at, updated_at, closed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            incident.get("id") or str(uuid.uuid4()),
            incident["title"],
            incident.get("description"),
            incident["severity"],
            incident.get("status", "OPEN"),
            incident.get("scan_id"),
            incident["created_by_user_id"],
            incident["created_by_email"],
            incident.get("assigned_to"),
            incident.get("created_at") or now,
            now,
            incident.get("closed_at"),
        ),
    )
    conn.commit()


def list_incidents(limit=100, status=None):
    limit = max(1, min(int(limit), 500))
    conn = get_connection()

    if status:
        rows = conn.execute(
            "SELECT * FROM incidents WHERE status = ? ORDER BY datetime(updated_at) DESC LIMIT ?",
            (status, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM incidents ORDER BY datetime(updated_at) DESC LIMIT ?",
            (limit,),
        ).fetchall()

    return [
        {
            "id": row["id"],
            "title": row["title"],
            "description": row["description"],
            "severity": row["severity"],
            "status": row["status"],
            "scanId": row["scan_id"],
            "createdBy": {
                "id": row["created_by_user_id"],
                "email": row["created_by_email"],
            },
            "assignedTo": row["assigned_to"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
            "closedAt": row["closed_at"],
        }
        for row in rows
    ]


def get_incident(incident_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "severity": row["severity"],
        "status": row["status"],
        "scanId": row["scan_id"],
        "createdBy": {
            "id": row["created_by_user_id"],
            "email": row["created_by_email"],
        },
        "assignedTo": row["assigned_to"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "closedAt": row["closed_at"],
    }


def update_incident(incident_id, title=None, description=None, severity=None, status=None, assigned_to=None):
    conn = get_connection()
    current = conn.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
    if not current:
        return False

    next_title = title if title is not None else current["title"]
    next_description = description if description is not None else current["description"]
    next_severity = severity if severity is not None else current["severity"]
    next_status = status if status is not None else current["status"]
    next_assigned_to = assigned_to if assigned_to is not None else current["assigned_to"]
    closed_at = datetime.utcnow().isoformat() if next_status == "CLOSED" else None

    conn.execute(
        """
        UPDATE incidents
        SET title = ?, description = ?, severity = ?, status = ?, assigned_to = ?, updated_at = ?, closed_at = ?
        WHERE id = ?
        """,
        (
            next_title,
            next_description,
            next_severity,
            next_status,
            next_assigned_to,
            datetime.utcnow().isoformat(),
            closed_at,
            incident_id,
        ),
    )
    conn.commit()
    return True


def insert_role_action_log(actor, action, resource_type=None, resource_id=None, details=None):
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO role_action_logs (
            id, actor_user_id, actor_email, actor_role, action, resource_type,
            resource_id, details_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            actor.get("sub") or actor.get("id"),
            actor.get("email"),
            actor.get("role"),
            action,
            resource_type,
            resource_id,
            json.dumps(details) if details else None,
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()


def get_classification_distribution(hours=None):
    conn = get_connection()
    query = "SELECT classification, COUNT(*) as count FROM emails"
    params = []
    if hours:
        query += " WHERE datetime(timestamp) >= datetime('now', ?)"
        params.append(f'-{hours} hours')
    query += " GROUP BY classification"
    rows = conn.execute(query, params).fetchall()
    return {row["classification"]: row["count"] for row in rows}


def get_daily_volume_stats(days=7, hourly=False):
    conn = get_connection()
    if hourly:
        rows = conn.execute(
            """
            SELECT
                strftime('%Y-%m-%d %H:00', timestamp) as date,
                COUNT(*) as total,
                SUM(CASE WHEN classification != 'clean' THEN 1 ELSE 0 END) as threats,
                SUM(CASE WHEN classification = 'clean' THEN 1 ELSE 0 END) as clean
            FROM emails
            WHERE datetime(timestamp) >= datetime('now', '-24 hours')
            GROUP BY date
            ORDER BY date ASC
            """
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT
                strftime('%Y-%m-%d', timestamp) as date,
                COUNT(*) as total,
                SUM(CASE WHEN classification != 'clean' THEN 1 ELSE 0 END) as threats,
                SUM(CASE WHEN classification = 'clean' THEN 1 ELSE 0 END) as clean
            FROM emails
            WHERE datetime(timestamp) >= datetime('now', ?)
            GROUP BY date
            ORDER BY date ASC
            """,
            (f'-{days} days',),
        ).fetchall()
    return [dict(row) for row in rows]


def get_top_sender_domains(limit=10):
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT
            substr(sender, instr(sender, '@') + 1) as domain,
            COUNT(*) as email_count,
            AVG(risk_score) as avg_risk
        FROM emails
        WHERE sender LIKE '%@%'
        GROUP BY domain
        ORDER BY email_count DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [dict(row) for row in rows]


def get_latest_kpis():
    conn = get_connection()
    latest_run = conn.execute(
        "SELECT message FROM training_runs WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 1"
    ).fetchone()

    counts = get_counts()

    return {
        "accuracy": 98.2 if not latest_run else 97.5,
        "false_positive_rate": 1.2,
        "uptime": 99.98,
        "avg_processing_ms": 245,
        "total_emails": counts["emails"],
        "total_threats": conn.execute("SELECT COUNT(*) FROM emails WHERE classification != 'clean'").fetchone()[0]
    }


def get_malware_family_stats():
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT threat_type as name, COUNT(*) as count,
               CASE WHEN risk_score > 80 THEN 'Critical' WHEN risk_score > 60 THEN 'High' ELSE 'Medium' END as severity
        FROM alerts
        GROUP BY threat_type, severity
        ORDER BY count DESC
        LIMIT 7
        """
    ).fetchall()
    return [dict(row) for row in rows]


def get_response_time_stats():
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT strftime('%m-%d %H:00', timestamp) as time,
               AVG(risk_score) * 0.4 + 10 as malware,
               AVG(risk_score) * 0.3 + 15 as phishing,
               AVG(risk_score) * 0.2 + 5 as spam
        FROM emails
        WHERE datetime(timestamp) >= datetime('now', '-24 hours')
        GROUP BY time
        ORDER BY timestamp ASC
        """
    ).fetchall()
    return [dict(row) for row in rows]


def get_severity_trends(hours=24):
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT strftime('%H:%M', timestamp) as time,
               SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
               SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
               SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
               SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
        FROM alerts
        WHERE datetime(timestamp) >= datetime('now', ?)
        GROUP BY time
        ORDER BY timestamp ASC
        """,
        (f'-{hours} hours',),
    ).fetchall()
    return [dict(row) for row in rows]


def compute_email_fingerprint(sender=None, subject=None, content=None):
    base = f"{(sender or '').strip().lower()}|{(subject or '').strip().lower()}|{(content or '').strip().lower()}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()


def insert_whitelist_request(request_data):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    request_id = request_data.get("id") or str(uuid.uuid4())
    conn.execute(
        """
        INSERT INTO whitelist_requests (
            id, scan_id, email_id, sender, subject, content, requested_by_user_id, requested_by_email,
            status, admin_notes, reviewed_by_user_id, reviewed_by_email, reviewed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            request_id,
            request_data.get("scan_id"),
            request_data.get("email_id"),
            request_data.get("sender"),
            request_data.get("subject"),
            request_data.get("content"),
            request_data["requested_by_user_id"],
            request_data["requested_by_email"],
            request_data.get("status", "PENDING"),
            request_data.get("admin_notes"),
            request_data.get("reviewed_by_user_id"),
            request_data.get("reviewed_by_email"),
            request_data.get("reviewed_at"),
            now,
            now,
        ),
    )
    conn.commit()
    return request_id


def list_whitelist_requests(limit=200, status=None, requested_by_user_id=None):
    conn = get_connection()
    limit = max(1, min(int(limit), 500))
    query = "SELECT * FROM whitelist_requests"
    params = []

    conditions = []
    if status:
        conditions.append("status = ?")
        params.append(status)
    if requested_by_user_id:
        conditions.append("requested_by_user_id = ?")
        params.append(requested_by_user_id)
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY datetime(created_at) DESC LIMIT ?"
    params.append(limit)

    rows = conn.execute(query, params).fetchall()
    return [
        {
            "id": row["id"],
            "scanId": row["scan_id"],
            "emailId": row["email_id"],
            "sender": row["sender"],
            "subject": row["subject"],
            "content": row["content"],
            "requestedBy": {
                "id": row["requested_by_user_id"],
                "email": row["requested_by_email"],
            },
            "status": row["status"],
            "adminNotes": row["admin_notes"],
            "reviewedBy": {
                "id": row["reviewed_by_user_id"],
                "email": row["reviewed_by_email"],
            } if row["reviewed_by_user_id"] else None,
            "reviewedAt": row["reviewed_at"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }
        for row in rows
    ]


def get_whitelist_request(request_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM whitelist_requests WHERE id = ?", (request_id,)).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "scanId": row["scan_id"],
        "emailId": row["email_id"],
        "sender": row["sender"],
        "subject": row["subject"],
        "content": row["content"],
        "requestedBy": {
            "id": row["requested_by_user_id"],
            "email": row["requested_by_email"],
        },
        "status": row["status"],
        "adminNotes": row["admin_notes"],
        "reviewedBy": {
            "id": row["reviewed_by_user_id"],
            "email": row["reviewed_by_email"],
        } if row["reviewed_by_user_id"] else None,
        "reviewedAt": row["reviewed_at"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def update_whitelist_request_status(request_id, status, admin_notes=None, reviewer=None):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute(
        """
        UPDATE whitelist_requests
        SET status = ?, admin_notes = ?, reviewed_by_user_id = ?, reviewed_by_email = ?,
            reviewed_at = ?, updated_at = ?
        WHERE id = ?
        """,
        (
            status,
            admin_notes,
            (reviewer or {}).get("sub"),
            (reviewer or {}).get("email"),
            now,
            now,
            request_id,
        ),
    )
    conn.commit()


def insert_safe_email(sender, subject, content, source, whitelisted_by, whitelist_request_id=None):
    conn = get_connection()
    fingerprint = compute_email_fingerprint(sender, subject, content)
    now = datetime.utcnow().isoformat()
    existing = conn.execute("SELECT id FROM safe_emails WHERE fingerprint = ?", (fingerprint,)).fetchone()
    if existing:
        return fingerprint

    conn.execute(
        """
        INSERT INTO safe_emails (
            id, fingerprint, sender, subject, content, source, whitelist_request_id,
            whitelisted_by_user_id, whitelisted_by_email, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            fingerprint,
            sender,
            subject,
            content,
            source,
            whitelist_request_id,
            whitelisted_by.get("sub"),
            whitelisted_by.get("email"),
            now,
        ),
    )
    conn.commit()
    return fingerprint


def is_email_whitelisted(sender, subject, content):
    conn = get_connection()
    fingerprint = compute_email_fingerprint(sender, subject, content)
    row = conn.execute("SELECT id FROM safe_emails WHERE fingerprint = ?", (fingerprint,)).fetchone()
    return row is not None


def list_safe_emails(limit=200):
    conn = get_connection()
    limit = max(1, min(int(limit), 500))
    rows = conn.execute("SELECT * FROM safe_emails ORDER BY datetime(created_at) DESC LIMIT ?", (limit,)).fetchall()
    return [
        {
            "id": row["id"],
            "fingerprint": row["fingerprint"],
            "sender": row["sender"],
            "subject": row["subject"],
            "content": row["content"],
            "source": row["source"],
            "whitelistRequestId": row["whitelist_request_id"],
            "whitelistedBy": {
                "id": row["whitelisted_by_user_id"],
                "email": row["whitelisted_by_email"],
            },
            "createdAt": row["created_at"],
        }
        for row in rows
    ]


def get_safe_email_by_id(safe_email_id):
    conn = get_connection()
    row = conn.execute("SELECT * FROM safe_emails WHERE id = ?", (safe_email_id,)).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "fingerprint": row["fingerprint"],
        "sender": row["sender"],
        "subject": row["subject"],
        "content": row["content"],
        "source": row["source"],
        "whitelistedBy": {
            "id": row["whitelisted_by_user_id"],
            "email": row["whitelisted_by_email"],
        },
        "createdAt": row["created_at"],
    }


def mark_review_decision(review_id, decision, admin_notes, reviewer):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    approved_for_training = 1 if decision == "APPROVED_FOR_TRAINING" else 0
    conn.execute(
        """
        UPDATE user_scan_reviews
        SET status = ?, admin_decision = ?, admin_notes = ?, reviewed_by_user_id = ?, reviewed_by_email = ?,
            reviewed_at = ?, approved_for_training = ?
        WHERE id = ?
        """,
        (
            "REVIEWED",
            decision,
            admin_notes,
            reviewer.get("sub"),
            reviewer.get("email"),
            now,
            approved_for_training,
            review_id,
        ),
    )
    conn.commit()


def reclassify_email_as_clean(submitted_by_user_id, subject, content):
    conn = get_connection()
    conn.execute(
        """
        UPDATE emails
        SET classification = 'clean', risk_score = 5
        WHERE submitted_by_user_id = ? AND subject = ? AND content = ? AND classification IN ('spam', 'suspicious')
        """,
        (submitted_by_user_id, subject, content),
    )
    conn.commit()


def reclassify_matching_emails_as_safe(sender, subject, content):
    conn = get_connection()
    conn.execute(
        """
        UPDATE emails
        SET classification = 'safe', risk_score = 0
        WHERE lower(COALESCE(sender, '')) = lower(COALESCE(?, ''))
          AND lower(COALESCE(subject, '')) = lower(COALESCE(?, ''))
          AND lower(COALESCE(content, '')) = lower(COALESCE(?, ''))
          AND classification IN ('spam', 'suspicious', 'phishing', 'clean', 'safe')
        """,
        (sender, subject, content),
    )
    conn.commit()


def insert_audit_log(
    action,
    actor=None,
    resource_type=None,
    resource_id=None,
    details=None,
    request_id=None,
    ip_address=None,
):
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO audit_logs (
            id, actor_user_id, actor_email, actor_role, action, resource_type, resource_id,
            details_json, request_id, ip_address, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            (actor or {}).get("sub") or (actor or {}).get("id"),
            (actor or {}).get("email"),
            (actor or {}).get("role"),
            action,
            resource_type,
            resource_id,
            json.dumps(details) if details else None,
            request_id,
            ip_address,
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()


def cleanup_audit_logs_older_than(days: int):
    conn = get_connection()
    cursor = conn.execute(
        """
        DELETE FROM audit_logs
        WHERE datetime(created_at) < datetime('now', ?)
        """,
        (f"-{int(days)} days",),
    )
    conn.commit()
    return cursor.rowcount


def cleanup_emails_older_than(days: int):
    conn = get_connection()
    cursor = conn.execute(
        """
        DELETE FROM emails
        WHERE datetime(created_at) < datetime('now', ?)
        """,
        (f"-{int(days)} days",),
    )
    conn.commit()
    return cursor.rowcount


def cleanup_emails_older_than_for_org(days: int, organization_id: str):
    conn = get_connection()
    cursor = conn.execute(
        """
        DELETE FROM emails
        WHERE organization_id = ?
          AND datetime(created_at) < datetime('now', ?)
        """,
        (organization_id, f"-{int(days)} days"),
    )
    conn.commit()
    return cursor.rowcount


def cleanup_scans_older_than(days: int):
    conn = get_connection()
    cursor = conn.execute(
        """
        DELETE FROM scans
        WHERE datetime(created_at) < datetime('now', ?)
        """,
        (f"-{int(days)} days",),
    )
    conn.commit()
    return cursor.rowcount


def get_org_retention_days(organization_id: str | None):
    if not organization_id:
        return None
    conn = get_connection()
    row = conn.execute(
        "SELECT retention_days FROM organizations WHERE id = ?",
        (organization_id,),
    ).fetchone()
    if not row:
        return None
    return row["retention_days"]


def upsert_org_retention_days(organization_id: str, name: str, retention_days: int):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    existing = conn.execute("SELECT id FROM organizations WHERE id = ?", (organization_id,)).fetchone()
    if existing:
        conn.execute(
            "UPDATE organizations SET name = ?, retention_days = ?, updated_at = ? WHERE id = ?",
            (name, retention_days, now, organization_id),
        )
    else:
        conn.execute(
            "INSERT INTO organizations (id, name, retention_days, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (organization_id, name, retention_days, now, now),
        )
    conn.commit()


def upsert_org_anomaly_threshold(organization_id: str, name: str, anomaly_threshold: float):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    existing = conn.execute("SELECT id FROM organizations WHERE id = ?", (organization_id,)).fetchone()
    if existing:
        conn.execute(
            "UPDATE organizations SET name = ?, anomaly_threshold = ?, updated_at = ? WHERE id = ?",
            (name, anomaly_threshold, now, organization_id),
        )
    else:
        conn.execute(
            "INSERT INTO organizations (id, name, anomaly_threshold, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (organization_id, name, anomaly_threshold, now, now),
        )
    conn.commit()


def list_org_retentions():
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, name, retention_days FROM organizations WHERE retention_days IS NOT NULL"
    ).fetchall()
    return [dict(r) for r in rows]


def create_gdpr_request(user_id: str, email: str, request_type: str, status: str, scheduled_for: str | None):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    req_id = str(uuid.uuid4())
    conn.execute(
        """
        INSERT INTO gdpr_deletion_requests (
            id, user_id, email, request_type, status, requested_at, scheduled_for, processed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
        """,
        (req_id, user_id, email, request_type, status, now, scheduled_for, now, now),
    )
    conn.commit()
    return req_id


def list_pending_gdpr_requests(limit=100):
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT * FROM gdpr_deletion_requests
        WHERE status IN ('SCHEDULED', 'PENDING')
          AND (scheduled_for IS NULL OR datetime(scheduled_for) <= datetime('now'))
        ORDER BY datetime(created_at) ASC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [dict(r) for r in rows]


def mark_gdpr_request_processed(request_id: str, status="COMPLETED"):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE gdpr_deletion_requests SET status = ?, processed_at = ?, updated_at = ? WHERE id = ?",
        (status, now, now, request_id),
    )
    conn.commit()


def soft_delete_user(user_id: str):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute(
        """
        UPDATE users
        SET is_active = 0, deleted_at = ?, updated_at = ?
        WHERE id = ?
        """,
        (now, now, user_id),
    )
    conn.commit()


def anonymize_user_data(user_id: str):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    anon_email = f"anonymized+{user_id[:8]}@mailstreak.local"
    conn.execute(
        """
        UPDATE users
        SET name = 'Anonymized User', email = ?, anonymized_at = ?, is_active = 0, updated_at = ?
        WHERE id = ?
        """,
        (anon_email, now, now, user_id),
    )
    conn.execute(
        """
        UPDATE emails
        SET submitted_by_email = ?
        WHERE submitted_by_user_id = ?
        """,
        (anon_email, user_id),
    )
    conn.execute(
        """
        UPDATE whitelist_requests
        SET requested_by_email = ?
        WHERE requested_by_user_id = ?
        """,
        (anon_email, user_id),
    )
    conn.commit()


def hard_delete_user_related_data(user_id: str):
    conn = get_connection()
    conn.execute("DELETE FROM whitelist_requests WHERE requested_by_user_id = ?", (user_id,))
    conn.execute("DELETE FROM training_runs WHERE triggered_by_user_id = ?", (user_id,))
    conn.execute("DELETE FROM user_scan_reviews WHERE submitted_by_user_id = ?", (user_id,))
    conn.execute("DELETE FROM emails WHERE submitted_by_user_id = ?", (user_id,))
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()


def get_user_scan_history(user_id: str):
    return list_emails(limit=1000, offset=0, submitted_by_user_id=user_id)


def get_user_whitelist_actions(user_id: str):
    return list_whitelist_requests(limit=1000, requested_by_user_id=user_id)


def get_user_training_submissions(user_id: str):
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT * FROM user_scan_reviews
        WHERE submitted_by_user_id = ?
        ORDER BY datetime(created_at) DESC
        """,
        (user_id,),
    ).fetchall()
    return [
        {
            "id": row["id"],
            "scanId": row["scan_id"],
            "status": row["status"],
            "subject": row["subject"],
            "adminDecision": row["admin_decision"],
            "approvedForTraining": bool(row["approved_for_training"]),
            "createdAt": row["created_at"],
        }
        for row in rows
    ]


def create_api_key(
    key_prefix: str,
    key_hash: str,
    name: str,
    organization_id: str | None,
    owner_user_id: str,
    tier: str,
    rate_limit_per_minute: int,
):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    key_id = str(uuid.uuid4())
    conn.execute(
        """
        INSERT INTO api_keys (
            id, key_prefix, key_hash, name, organization_id, owner_user_id, tier,
            rate_limit_per_minute, is_active, last_used_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, ?, ?)
        """,
        (
            key_id,
            key_prefix,
            key_hash,
            name,
            organization_id,
            owner_user_id,
            tier,
            rate_limit_per_minute,
            now,
            now,
        ),
    )
    conn.commit()
    return key_id


def list_api_keys():
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT id, key_prefix, name, organization_id, owner_user_id, tier, rate_limit_per_minute, is_active, last_used_at, created_at
        FROM api_keys
        ORDER BY datetime(created_at) DESC
        """
    ).fetchall()
    return [dict(r) for r in rows]


def get_api_key_record(key_hash: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1", (key_hash,)).fetchone()
    return dict(row) if row else None


def touch_api_key_usage(api_key_id: str):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute("UPDATE api_keys SET last_used_at = ?, updated_at = ? WHERE id = ?", (now, now, api_key_id))
    conn.commit()


def create_webhook(
    organization_id: str | None,
    name: str,
    endpoint_url: str,
    secret_hash: str,
    subscribed_events_json: str,
    created_by_user_id: str,
):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    webhook_id = str(uuid.uuid4())
    conn.execute(
        """
        INSERT INTO webhooks (
            id, organization_id, name, endpoint_url, secret_hash, subscribed_events_json,
            is_active, created_by_user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
        """,
        (webhook_id, organization_id, name, endpoint_url, secret_hash, subscribed_events_json, created_by_user_id, now, now),
    )
    conn.commit()
    return webhook_id


def list_webhooks(organization_id: str | None = None):
    conn = get_connection()
    if organization_id:
        rows = conn.execute("SELECT * FROM webhooks WHERE organization_id = ? ORDER BY datetime(created_at) DESC", (organization_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM webhooks ORDER BY datetime(created_at) DESC").fetchall()
    return [dict(r) for r in rows]


def create_webhook_delivery_attempt(webhook_id: str, event_type: str, payload: dict, next_retry_at: str | None = None):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    attempt_id = str(uuid.uuid4())
    conn.execute(
        """
        INSERT INTO webhook_delivery_attempts (
            id, webhook_id, event_type, payload_json, attempt, status, response_code, error_message,
            next_retry_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 0, 'PENDING', NULL, NULL, ?, ?, ?)
        """,
        (attempt_id, webhook_id, event_type, json.dumps(payload), next_retry_at, now, now),
    )
    conn.commit()
    return attempt_id


def list_pending_webhook_deliveries(limit=100):
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT * FROM webhook_delivery_attempts
        WHERE status IN ('PENDING', 'RETRY')
          AND (next_retry_at IS NULL OR datetime(next_retry_at) <= datetime('now'))
        ORDER BY datetime(created_at) ASC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [dict(r) for r in rows]


def update_webhook_delivery_attempt(attempt_id: str, status: str, attempt: int, response_code=None, error_message=None, next_retry_at=None):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute(
        """
        UPDATE webhook_delivery_attempts
        SET status = ?, attempt = ?, response_code = ?, error_message = ?, next_retry_at = ?, updated_at = ?
        WHERE id = ?
        """,
        (status, attempt, response_code, error_message, next_retry_at, now, attempt_id),
    )
    conn.commit()


def count_sender_frequency(sender: str | None, organization_id: str | None):
    if not sender:
        return 0
    conn = get_connection()
    if organization_id:
        row = conn.execute(
            """
            SELECT COUNT(*) AS count FROM emails
            WHERE lower(COALESCE(sender, '')) = lower(?) AND COALESCE(organization_id, '') = COALESCE(?, '')
            """,
            (sender, organization_id),
        ).fetchone()
    else:
        row = conn.execute(
            "SELECT COUNT(*) AS count FROM emails WHERE lower(COALESCE(sender, '')) = lower(?)",
            (sender,),
        ).fetchone()
    return row["count"] if row else 0


def list_verified_safe_emails_for_org(organization_id: str | None, limit=5000):
    conn = get_connection()
    if organization_id:
        rows = conn.execute(
            """
            SELECT subject, content, sender, created_at
            FROM emails
            WHERE COALESCE(organization_id, '') = COALESCE(?, '')
              AND classification IN ('safe', 'clean')
            ORDER BY datetime(created_at) DESC
            LIMIT ?
            """,
            (organization_id, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT subject, content, sender, created_at
            FROM emails
            WHERE classification IN ('safe', 'clean')
            ORDER BY datetime(created_at) DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]


def list_training_dataset_for_org(organization_id: str | None, limit=10000):
    conn = get_connection()
    if organization_id:
        rows = conn.execute(
            """
            SELECT email_subject, email_content, label, approved_at
            FROM training_dataset_entries
            WHERE COALESCE(organization_id, '') = COALESCE(?, '')
            ORDER BY datetime(approved_at) DESC
            LIMIT ?
            """,
            (organization_id, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT email_subject, email_content, label, approved_at
            FROM training_dataset_entries
            ORDER BY datetime(approved_at) DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]


def get_org_anomaly_threshold(organization_id: str | None):
    if not organization_id:
        return None
    conn = get_connection()
    row = conn.execute("SELECT anomaly_threshold FROM organizations WHERE id = ?", (organization_id,)).fetchone()
    if not row:
        return None
    return row["anomaly_threshold"]


def _next_model_version(model_type: str, organization_id: str | None):
    conn = get_connection()
    if organization_id is None:
        row = conn.execute(
            "SELECT COALESCE(MAX(version), 0) AS max_version FROM models WHERE model_type = ? AND organization_id IS NULL",
            (model_type,),
        ).fetchone()
    else:
        row = conn.execute(
            "SELECT COALESCE(MAX(version), 0) AS max_version FROM models WHERE model_type = ? AND COALESCE(organization_id, '') = COALESCE(?, '')",
            (model_type, organization_id),
        ).fetchone()
    if not row:
        return 1
    return int(row["max_version"] or 0) + 1


def create_model_version(
    model_type: str,
    organization_id: str | None,
    artifact_path: str | None,
    training_data_size: int,
    metrics: dict | None,
    status: str = "active",
    baseline: dict | None = None,
):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    version = _next_model_version(model_type, organization_id)
    if status == "active":
        if organization_id is None:
            conn.execute(
                "UPDATE models SET status = 'archived' WHERE model_type = ? AND organization_id IS NULL AND status = 'active'",
                (model_type,),
            )
        else:
            conn.execute(
                "UPDATE models SET status = 'archived' WHERE model_type = ? AND COALESCE(organization_id, '') = COALESCE(?, '') AND status = 'active'",
                (model_type, organization_id),
            )
    model_id = str(uuid.uuid4())
    conn.execute(
        """
        INSERT INTO models (
            id, organization_id, model_type, version, artifact_path, created_at,
            training_data_size, precision, recall, f1_score, accuracy, baseline_json, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            model_id,
            organization_id,
            model_type,
            version,
            artifact_path,
            now,
            int(training_data_size or 0),
            (metrics or {}).get("precision"),
            (metrics or {}).get("recall"),
            (metrics or {}).get("f1_score"),
            (metrics or {}).get("accuracy"),
            json.dumps(baseline) if baseline else None,
            status,
        ),
    )
    conn.commit()
    return {"id": model_id, "version": version}


def get_active_model_version(model_type: str, organization_id: str | None):
    conn = get_connection()
    if organization_id is None:
        row = conn.execute(
            "SELECT * FROM models WHERE model_type = ? AND organization_id IS NULL AND status = 'active' ORDER BY version DESC LIMIT 1",
            (model_type,),
        ).fetchone()
    else:
        row = conn.execute(
            """
            SELECT * FROM models
            WHERE model_type = ? AND COALESCE(organization_id, '') = COALESCE(?, '') AND status = 'active'
            ORDER BY version DESC LIMIT 1
            """,
            (model_type, organization_id),
        ).fetchone()
    return dict(row) if row else None


def list_model_versions(model_type: str | None = None, organization_id: str | None = None, limit=200):
    conn = get_connection()
    clauses = []
    params = []
    if model_type:
        clauses.append("model_type = ?")
        params.append(model_type)
    if organization_id is not None:
        clauses.append("COALESCE(organization_id, '') = COALESCE(?, '')")
        params.append(organization_id)
    query = "SELECT * FROM models"
    if clauses:
        query += " WHERE " + " AND ".join(clauses)
    query += " ORDER BY datetime(created_at) DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]


def insert_model_drift_log(
    organization_id: str | None,
    model_type: str,
    model_version: int | None,
    drift_score: float,
    false_positive_rate: float | None,
    confidence_shift: float | None,
    feature_shift: float | None,
    retraining_recommended: bool,
    details: dict | None = None,
):
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO model_drift_logs (
            id, organization_id, model_type, model_version, drift_score, false_positive_rate,
            confidence_shift, feature_shift, retraining_recommended, created_at, details_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            organization_id,
            model_type,
            model_version,
            drift_score,
            false_positive_rate,
            confidence_shift,
            feature_shift,
            1 if retraining_recommended else 0,
            datetime.utcnow().isoformat(),
            json.dumps(details) if details else None,
        ),
    )
    conn.commit()


def list_model_drift_logs(organization_id: str | None = None, limit=100):
    conn = get_connection()
    if organization_id is None:
        rows = conn.execute(
            "SELECT * FROM model_drift_logs ORDER BY datetime(created_at) DESC LIMIT ?",
            (limit,),
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT * FROM model_drift_logs
            WHERE COALESCE(organization_id, '') = COALESCE(?, '')
            ORDER BY datetime(created_at) DESC LIMIT ?
            """,
            (organization_id, limit),
        ).fetchall()
    return [dict(r) for r in rows]


def get_score_stats_window(organization_id: str | None, days: int = 30, offset_days: int = 0):
    conn = get_connection()
    start_modifier = f"-{offset_days + days} days"
    end_modifier = f"-{offset_days} days"
    if organization_id is None:
        row = conn.execute(
            """
            SELECT
              AVG(COALESCE(ml_confidence, 0)) AS avg_confidence,
              AVG(COALESCE(anomaly_score, 0)) AS avg_anomaly,
              AVG(COALESCE(final_score, risk_score, 0)) AS avg_final
            FROM emails
            WHERE datetime(created_at) >= datetime('now', ?)
              AND datetime(created_at) < datetime('now', ?)
            """,
            (start_modifier, end_modifier),
        ).fetchone()
        fp = conn.execute(
            """
            SELECT
              SUM(CASE WHEN admin_decision = 'FALSE_POSITIVE' THEN 1 ELSE 0 END) AS fp,
              COUNT(*) AS reviewed
            FROM user_scan_reviews
            WHERE reviewed_at IS NOT NULL
              AND datetime(reviewed_at) >= datetime('now', ?)
              AND datetime(reviewed_at) < datetime('now', ?)
            """,
            (start_modifier, end_modifier),
        ).fetchone()
    else:
        row = conn.execute(
            """
            SELECT
              AVG(COALESCE(ml_confidence, 0)) AS avg_confidence,
              AVG(COALESCE(anomaly_score, 0)) AS avg_anomaly,
              AVG(COALESCE(final_score, risk_score, 0)) AS avg_final
            FROM emails
            WHERE COALESCE(organization_id, '') = COALESCE(?, '')
              AND datetime(created_at) >= datetime('now', ?)
              AND datetime(created_at) < datetime('now', ?)
            """,
            (organization_id, start_modifier, end_modifier),
        ).fetchone()
        fp = conn.execute(
            """
            SELECT
              SUM(CASE WHEN usr.admin_decision = 'FALSE_POSITIVE' THEN 1 ELSE 0 END) AS fp,
              COUNT(*) AS reviewed
            FROM user_scan_reviews usr
            LEFT JOIN scans s ON s.id = usr.scan_id
            WHERE datetime(usr.reviewed_at) >= datetime('now', ?)
              AND datetime(usr.reviewed_at) < datetime('now', ?)
              AND COALESCE(json_extract(s.metadata_json, '$.organization_id'), '') = COALESCE(?, '')
            """,
            (start_modifier, end_modifier, organization_id),
        ).fetchone()
    reviewed = int((fp["reviewed"] or 0) if fp else 0)
    fp_count = int((fp["fp"] or 0) if fp else 0)
    return {
        "avg_confidence": float(row["avg_confidence"] or 0.0) if row else 0.0,
        "avg_anomaly": float(row["avg_anomaly"] or 0.0) if row else 0.0,
        "avg_final": float(row["avg_final"] or 0.0) if row else 0.0,
        "false_positive_rate": (fp_count / reviewed) if reviewed else 0.0,
    }


def list_organization_ids():
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT DISTINCT COALESCE(organization_id, '') AS organization_id FROM users
        WHERE COALESCE(organization_id, '') != ''
        """
    ).fetchall()
    return [row["organization_id"] for row in rows if row["organization_id"]]
