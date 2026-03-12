import asyncio
import time
import uuid
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api import auth, scan, alerts, health, ml, emails, analytics, incidents, users, gdpr, public_v1, compliance, users_v1
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.metrics import REQUEST_COUNT, REQUEST_LATENCY, ERROR_COUNT, metrics_response
from app.core.security import seed_static_users
from app.db.database import init_db, migrate_db
from app.ml.training import ensure_model
from app.services.retention_service import run_retention_cleanup, run_gdpr_deletion_jobs
from app.services.seed_service import seed_if_empty
from app.services.webhook_service import process_webhook_retries
from app.services.hybrid_service import run_drift_detection_for_org
from app.db.repository import list_organization_ids

app = FastAPI(title="MailStreak Backend (Python)")
configure_logging("INFO")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_FRONTEND_BUILD = BASE_DIR / "frontend" / "build"
DEFAULT_FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

frontend_env = settings.frontend_dist.strip() if settings.frontend_dist else ""
if frontend_env:
    FRONTEND_DIST = Path(frontend_env)
else:
    FRONTEND_DIST = DEFAULT_FRONTEND_BUILD if DEFAULT_FRONTEND_BUILD.exists() else DEFAULT_FRONTEND_DIST

INDEX_FILE = FRONTEND_DIST / "index.html"
ASSETS_DIR = FRONTEND_DIST / "assets"


@app.middleware("http")
async def request_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id

    if settings.enforce_https:
        forwarded_proto = request.headers.get("x-forwarded-proto", "http")
        if forwarded_proto != "https" and request.url.scheme != "https":
            return JSONResponse({"detail": "HTTPS required"}, status_code=400)

    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        ERROR_COUNT.inc()
        if settings.app_env.lower() == "production":
            return JSONResponse({"detail": "Internal server error", "request_id": request_id}, status_code=500)
        raise

    duration = time.perf_counter() - start
    path = request.url.path
    REQUEST_COUNT.labels(request.method, path, str(response.status_code)).inc()
    REQUEST_LATENCY.labels(request.method, path).observe(duration)
    response.headers["X-Request-ID"] = request_id
    return response


async def _periodic_jobs():
    while True:
        try:
            run_retention_cleanup()
            run_gdpr_deletion_jobs()
            process_webhook_retries()
            run_drift_detection_for_org(None)
            for org_id in list_organization_ids():
                run_drift_detection_for_org(org_id)
        except Exception:
            pass
        await asyncio.sleep(max(60, settings.retention_cleanup_interval_minutes * 60))


@app.on_event("startup")
async def startup():
    init_db()
    migrate_db()
    seed_static_users()
    seed_if_empty()
    if settings.train_on_startup:
        ensure_model()
    asyncio.create_task(_periodic_jobs())


app.include_router(health.router)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(scan.router, prefix="/scan-email", tags=["scan"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(ml.router, prefix="/ml", tags=["ml"])
app.include_router(emails.router, prefix="/emails", tags=["emails"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(gdpr.router, prefix="/api/v1/gdpr", tags=["gdpr"])
app.include_router(public_v1.router, prefix="/api/v1", tags=["public-v1"])
app.include_router(compliance.router, prefix="/api/v1/compliance", tags=["compliance"])
app.include_router(users_v1.router, prefix="/api/v1/users", tags=["users-v1"])


@app.get("/metrics")
def metrics():
    return metrics_response()


if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


def _serve_index():
    if INDEX_FILE.exists():
        return FileResponse(INDEX_FILE)
    return JSONResponse({"detail": "Frontend build not found"}, status_code=404)


@app.get("/")
def serve_root():
    return _serve_index()


@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    if full_path.startswith(("auth", "scan-email", "alerts", "ml", "emails", "analytics", "incidents", "users", "health", "docs", "openapi", "api", "metrics")):
        return JSONResponse({"detail": "Not Found"}, status_code=404)
    return _serve_index()
