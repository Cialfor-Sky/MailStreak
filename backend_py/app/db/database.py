import sqlite3
from app.core.config import settings

_db = None


def get_connection():
    global _db
    if _db is None:
        _db = sqlite3.connect(settings.db_path, check_same_thread=False)
        _db.row_factory = sqlite3.Row
    return _db


def init_db():
    conn = get_connection()
    with open("app/db/schema.sql", "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.commit()


def _add_missing_columns(table_name, required_columns):
    conn = get_connection()
    columns = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    existing = {row["name"] for row in columns}
    for column_name, definition in required_columns.items():
        if column_name not in existing:
            conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}")


def migrate_db():
    conn = get_connection()

    _add_missing_columns(
        "emails",
        {
            "organization_id": "TEXT",
            "supervised_score": "REAL",
            "anomaly_score": "REAL",
            "final_score": "REAL",
            "anomaly_flag": "INTEGER DEFAULT 0",
            "model_version_used": "TEXT",
            "anomaly_model_version_used": "TEXT",
            "submitted_by_user_id": "TEXT",
            "submitted_by_email": "TEXT",
            "submission_type": "TEXT DEFAULT 'SYSTEM'",
        },
    )

    _add_missing_columns(
        "training_runs",
        {
            "triggered_by_user_id": "TEXT",
            "triggered_by_email": "TEXT",
            "triggered_by_role": "TEXT",
            "dataset_source": "TEXT",
            "result_json": "TEXT",
        },
    )

    _add_missing_columns(
        "users",
        {
            "organization_id": "TEXT",
            "deleted_at": "TEXT",
            "anonymized_at": "TEXT",
        },
    )
    _add_missing_columns(
        "organizations",
        {
            "anomaly_threshold": "REAL DEFAULT 0.70",
        },
    )
    _add_missing_columns(
        "training_dataset_entries",
        {
            "organization_id": "TEXT",
            "model_version_used": "TEXT",
        },
    )
    conn.execute(
        "UPDATE users SET organization_id = ? WHERE organization_id IS NULL OR trim(organization_id) = ''",
        (settings.default_org_id,),
    )

    # user_scan_reviews status normalization for existing rows
    conn.execute(
        """
        UPDATE user_scan_reviews
        SET status = 'PENDING_ADMIN_REVIEW'
        WHERE status = 'PENDING_REVIEW'
        """
    )

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_emails_submitted_by_user_id ON emails(submitted_by_user_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_training_triggered_by_user ON training_runs(triggered_by_user_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_emails_organization ON emails(organization_id)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_role_action_logs_created_at ON role_action_logs(created_at)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_emails_final_score ON emails(final_score)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_emails_org_created ON emails(organization_id, created_at)"
    )

    conn.commit()
