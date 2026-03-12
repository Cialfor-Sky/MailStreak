# MailStreak Backend (FastAPI)

## Quick Start

1. Create env and install deps:
   ```bash
   python -m venv .venv
   .venv\\Scripts\\activate
   pip install -r requirements.txt
   ```
2. Copy env file:
   ```bash
   copy .env.example .env
   ```
3. Run API:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Docker

From repo root:
```bash
docker compose up --build
```
Services:
- `backend` on `:8000`
- `redis` on `:6379`
- `postgres` on `:5432` (provisioned for enterprise migration path)

## Compliance + GDPR

- `GET /api/v1/compliance/privacy-policy`
- `GET /api/v1/compliance/terms-of-service`
- `POST /api/v1/compliance/organizations/{organization_id}/retention` (SUPER_ADMIN)
- `GET /api/v1/gdpr/export`
- `POST /api/v1/gdpr/delete-request`

## Enterprise API (Versioned)

- `POST /api/v1/api-keys` (SUPER_ADMIN)
- `GET /api/v1/api-keys` (SUPER_ADMIN)
- `POST /api/v1/webhooks` (ADMIN/SUPER_ADMIN)
- `POST /api/v1/scan` (API key)
- `GET /api/v1/scan/{scan_id}` (API key)
- `GET /api/v1/threat-results` (API key)
- `GET /api/v1/compliance-summary` (API key)

## Monitoring

- `GET /metrics` (Prometheus format)
- Includes request totals, latency, scan duration, and error counters.

## Hybrid AI Architecture

MailStreak now uses layered scoring:

1. Supervised classifier (existing ensemble):
- Output: `supervisedScore` (0..1)

2. Unsupervised anomaly model (Isolation Forest):
- Trained on verified safe emails (`safe`/`clean`) per organization
- Output: `anomalyScore` and `anomalyFlag`

3. Heuristic engine:
- Output: `heuristicsScore` (0..100)

4. Aggregation:
- `finalScore = supervised*HYBRID_SUPERVISED_WEIGHT + anomaly*HYBRID_ANOMALY_WEIGHT + heuristic*HYBRID_HEURISTIC_WEIGHT`

Score outputs are persisted with each email record.

## Model Versioning + Drift

- `models` table stores supervised/anomaly versions and validation metrics.
- Active model version is used for inference.
- `model_drift_logs` stores monthly drift computations and retraining recommendation.

API:
- `GET /ml/models`
- `GET /ml/drift`
- `POST /ml/drift/evaluate`

## SIEM/Webhook Payload Contract

Webhook events deliver JSON payloads with fields:
- `risk_score`
- `verdict`
- `explanation`
- `metadata`

Headers:
- `X-MailStreak-Event`
- `X-MailStreak-Signature` (HMAC-SHA256)

## Security Notes

- HTTPS enforcement supported with `ENFORCE_HTTPS=true`.
- JWT auth for app users, API key auth for enterprise API.
- API key rate limiting uses Redis (in-memory fallback in local dev).
- Audit logs are retained and cleaned by scheduled retention jobs.
