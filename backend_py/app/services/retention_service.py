from datetime import datetime, timedelta

from app.core.config import settings
from app.db.repository import (
    cleanup_audit_logs_older_than,
    cleanup_emails_older_than,
    cleanup_scans_older_than,
    cleanup_emails_older_than_for_org,
    insert_audit_log,
    list_pending_gdpr_requests,
    mark_gdpr_request_processed,
    hard_delete_user_related_data,
    list_org_retentions,
)


def run_retention_cleanup():
    deleted_emails = cleanup_emails_older_than(settings.data_retention_days)
    deleted_scans = cleanup_scans_older_than(settings.data_retention_days)
    deleted_audits = cleanup_audit_logs_older_than(settings.audit_log_retention_days)
    org_overrides = list_org_retentions()
    org_deleted = []
    for org in org_overrides:
        if not org.get("retention_days"):
            continue
        count = cleanup_emails_older_than_for_org(int(org["retention_days"]), org["id"])
        org_deleted.append({"organizationId": org["id"], "deletedEmails": count})
    insert_audit_log(
        action="RETENTION_CLEANUP_EXECUTED",
        resource_type="system",
        details={
            "deletedEmails": deleted_emails,
            "deletedScans": deleted_scans,
            "deletedAuditLogs": deleted_audits,
            "organizationOverrides": org_deleted,
            "at": datetime.utcnow().isoformat(),
        },
    )


def run_gdpr_deletion_jobs():
    pending = list_pending_gdpr_requests(limit=100)
    for item in pending:
        request_type = (item.get("request_type") or "").upper()
        user_id = item.get("user_id")
        if not user_id:
            mark_gdpr_request_processed(item["id"], status="FAILED")
            continue
        if request_type in {"DELETE_ACCOUNT", "ANONYMIZE_DATA"}:
            hard_delete_user_related_data(user_id)
            mark_gdpr_request_processed(item["id"], status="COMPLETED")
            insert_audit_log(
                action="GDPR_HARD_DELETE_COMPLETED",
                resource_type="user",
                resource_id=user_id,
                details={"requestType": request_type},
            )
