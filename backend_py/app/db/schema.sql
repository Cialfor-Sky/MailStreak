CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL,
  stage TEXT,
  subject TEXT,
  content TEXT,
  metadata_json TEXT,
  result_json TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  organization_id TEXT,
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  anonymized_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  scan_id TEXT,
  severity TEXT NOT NULL,
  threat_type TEXT NOT NULL,
  description TEXT NOT NULL,
  email_id TEXT,
  risk_score INTEGER,
  classification TEXT,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS training_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  triggered_by_user_id TEXT,
  triggered_by_email TEXT,
  triggered_by_role TEXT,
  dataset_source TEXT,
  completed_at TEXT,
  duration_ms INTEGER,
  dataset_size INTEGER,
  result_json TEXT,
  message TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_training_started ON training_runs(started_at);

CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  sender TEXT,
  subject TEXT,
  content TEXT,
  classification TEXT,
  risk_score INTEGER,
  ml_confidence INTEGER,
  ml_model TEXT,
  heuristic_rules_json TEXT,
  explainability_json TEXT,
  submitted_by_user_id TEXT,
  submitted_by_email TEXT,
  submission_type TEXT DEFAULT 'SYSTEM',
  timestamp TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_emails_timestamp ON emails(timestamp);
CREATE INDEX IF NOT EXISTS idx_emails_classification ON emails(classification);

CREATE TABLE IF NOT EXISTS user_scan_reviews (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL,
  submitted_by_user_id TEXT NOT NULL,
  submitted_by_email TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  metadata_json TEXT,
  scan_result_json TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_ADMIN_REVIEW',
  admin_decision TEXT,
  admin_notes TEXT,
  reviewed_by_user_id TEXT,
  reviewed_by_email TEXT,
  reviewed_at TEXT,
  approved_for_training INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_scan_reviews_status ON user_scan_reviews(status);
CREATE INDEX IF NOT EXISTS idx_user_scan_reviews_user ON user_scan_reviews(submitted_by_user_id);

CREATE TABLE IF NOT EXISTS admin_notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  review_id TEXT,
  scan_id TEXT,
  status TEXT NOT NULL DEFAULT 'UNREAD',
  payload_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

CREATE TABLE IF NOT EXISTS training_dataset_entries (
  id TEXT PRIMARY KEY,
  source_review_id TEXT NOT NULL,
  scan_id TEXT NOT NULL,
  email_subject TEXT,
  email_content TEXT,
  metadata_json TEXT,
  label TEXT NOT NULL,
  risk_score INTEGER,
  approved_by_user_id TEXT NOT NULL,
  approved_by_email TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_training_dataset_entries_label ON training_dataset_entries(label);
CREATE INDEX IF NOT EXISTS idx_training_dataset_entries_approved_at ON training_dataset_entries(approved_at);

CREATE TABLE IF NOT EXISTS whitelist_requests (
  id TEXT PRIMARY KEY,
  scan_id TEXT,
  email_id TEXT,
  sender TEXT,
  subject TEXT,
  content TEXT,
  requested_by_user_id TEXT NOT NULL,
  requested_by_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  admin_notes TEXT,
  reviewed_by_user_id TEXT,
  reviewed_by_email TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_whitelist_requests_status ON whitelist_requests(status);

CREATE TABLE IF NOT EXISTS safe_emails (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL UNIQUE,
  sender TEXT,
  subject TEXT,
  content TEXT,
  source TEXT NOT NULL,
  whitelist_request_id TEXT,
  whitelisted_by_user_id TEXT NOT NULL,
  whitelisted_by_email TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_safe_emails_fingerprint ON safe_emails(fingerprint);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  scan_id TEXT,
  created_by_user_id TEXT NOT NULL,
  created_by_email TEXT NOT NULL,
  assigned_to TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  closed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);

CREATE TABLE IF NOT EXISTS role_action_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_role_action_logs_created_at ON role_action_logs(created_at);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  retention_days INTEGER,
  anomaly_threshold REAL DEFAULT 0.70,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  scheduled_for TEXT,
  processed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_requests_user ON gdpr_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_requests_status ON gdpr_deletion_requests(status);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details_json TEXT,
  request_id TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  organization_id TEXT,
  owner_user_id TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'standard',
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_organization ON api_keys(organization_id);

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  subscribed_events_json TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhooks_organization ON webhooks(organization_id);

CREATE TABLE IF NOT EXISTS webhook_delivery_attempts (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  response_code INTEGER,
  error_message TEXT,
  next_retry_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_status ON webhook_delivery_attempts(status);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_retry_at ON webhook_delivery_attempts(next_retry_at);

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  model_type TEXT NOT NULL,
  version INTEGER NOT NULL,
  artifact_path TEXT,
  created_at TEXT NOT NULL,
  training_data_size INTEGER NOT NULL DEFAULT 0,
  precision REAL,
  recall REAL,
  f1_score REAL,
  accuracy REAL,
  baseline_json TEXT,
  status TEXT NOT NULL DEFAULT 'archived'
);

CREATE INDEX IF NOT EXISTS idx_models_type_org ON models(model_type, organization_id);
CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);

CREATE TABLE IF NOT EXISTS model_drift_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  model_type TEXT NOT NULL,
  model_version INTEGER,
  drift_score REAL NOT NULL,
  false_positive_rate REAL,
  confidence_shift REAL,
  feature_shift REAL,
  retraining_recommended INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  details_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_model_drift_org_created ON model_drift_logs(organization_id, created_at);
