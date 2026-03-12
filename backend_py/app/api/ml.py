from fastapi import APIRouter, Depends, Query
from app.services.training_service import start_training, get_training_status, get_training_history
from app.utils.dependencies import RoleChecker, get_current_user
from app.services.seed_service import seed_now
from app.db.repository import insert_role_action_log, list_model_versions, list_model_drift_logs
from app.services.hybrid_service import run_drift_detection_for_org

router = APIRouter()
allow_super_admin = RoleChecker(["SUPER_ADMIN"])
allow_ops_admin = RoleChecker(["SUPER_ADMIN", "ADMIN"])


@router.post("/train")
def trigger_training(dataset_size: int = Query(2000), user=Depends(allow_super_admin)):
    try:
        run_id = start_training(dataset_size, triggered_by=user, dataset_source="hybrid_pipeline")
    except RuntimeError as exc:
        return {"status": "running", "message": str(exc)}

    insert_role_action_log(
        actor=user,
        action="MODEL_TRAINING_STARTED",
        resource_type="training_run",
        resource_id=run_id,
        details={"datasetSize": dataset_size, "datasetSource": "hybrid_pipeline"},
    )
    return {"status": "started", "datasetSource": "hybrid_pipeline", "runId": run_id}


@router.get("/train/status")
def training_status(user=Depends(get_current_user)):
    return get_training_status()


@router.get("/train/history")
def training_history(limit: int = Query(20), user=Depends(get_current_user)):
    return {"history": get_training_history(limit=limit, user=user)}


@router.get("/models")
def model_versions(model_type: str | None = Query(None), user=Depends(allow_ops_admin)):
    org_id = user.get("organization_id") if user.get("role") == "ADMIN" else None
    return {"models": list_model_versions(model_type=model_type, organization_id=org_id, limit=200)}


@router.get("/drift")
def drift_logs(limit: int = Query(100), user=Depends(allow_ops_admin)):
    org_id = user.get("organization_id") if user.get("role") == "ADMIN" else None
    return {"drift": list_model_drift_logs(organization_id=org_id, limit=limit)}


@router.post("/drift/evaluate")
def evaluate_drift(user=Depends(allow_ops_admin)):
    org_id = user.get("organization_id") if user.get("role") == "ADMIN" else None
    return {"result": run_drift_detection_for_org(org_id)}


@router.post("/seed")
def seed_data(user=Depends(allow_super_admin)):
    return seed_now()
