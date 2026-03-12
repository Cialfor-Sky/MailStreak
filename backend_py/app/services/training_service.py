import json
import uuid
from datetime import datetime
from threading import Lock, Thread

import pandas as pd

from app.db.repository import (
    insert_training_run,
    update_training_run,
    list_training_runs,
    insert_emails_bulk,
    list_training_dataset_for_org,
    list_organization_ids,
)
from app.ml.anomaly_model import train_anomaly_model_for_org
from app.ml.training import train_model, train_model_from_dataframe, generate_synthetic_dataset
from app.services.hybrid_service import run_drift_detection_for_org
from app.core.metrics import MODEL_ACCURACY, TRAINING_RUNS_TOTAL

_state = {
    "status": "idle",
    "progress": 0,
    "stage": "idle",
    "message": "",
    "triggeredBy": None,
    "runId": None,
    "datasetSize": 0,
    "datasetSource": None,
}
_lock = Lock()


def _insert_synthetic_emails(dataset_size, triggered_by=None):
    df = generate_synthetic_dataset(n=dataset_size)
    now = datetime.utcnow().isoformat()
    triggered_by_id = (triggered_by or {}).get("sub")
    triggered_by_email = (triggered_by or {}).get("email")
    org_id = (triggered_by or {}).get("organization_id")
    emails = []
    for _, row in df.iterrows():
        label = row["label"]
        if label == "malware":
            risk = 88
        elif label == "phishing":
            risk = 72
        elif label == "suspicious":
            risk = 52
        elif label == "spam":
            risk = 35
        elif label == "safe":
            risk = 5
        else:
            risk = 12

        emails.append(
            (
                str(uuid.uuid4()),
                org_id,
                f"synthetic@{label}.mailstreak",
                row["subject"],
                row["content"],
                label,
                risk,
                risk,
                "RF+SVM+DNN Ensemble",
                json.dumps(["Synthetic seed dataset for training"]),
                json.dumps({"source": "seed_data_training", "label": label}),
                triggered_by_id,
                triggered_by_email,
                "TRAINING_SEED",
                now,
                now,
            )
        )
    insert_emails_bulk(emails)


def get_training_status():
    with _lock:
        return dict(_state)


def get_training_history(limit=20, user=None):
    if user and user.get("role") == "USER":
        return list_training_runs(limit=limit, triggered_by_user_id=user.get("sub"))
    return list_training_runs(limit=limit)


def _set_state(progress, stage, status=None, message=None):
    with _lock:
        _state["progress"] = progress
        _state["stage"] = stage
        if status:
            _state["status"] = status
        if message is not None:
            _state["message"] = message


def _approved_training_df():
    rows = list_training_dataset_for_org(None, limit=20000)
    if not rows:
        return None
    data = []
    for r in rows:
        data.append(
            {
                "subject": r.get("email_subject") or "",
                "content": r.get("email_content") or "",
                "label": r.get("label") or "suspicious",
            }
        )
    if not data:
        return None
    return pd.DataFrame(data)


def _run_training_job(run_id, dataset_size, actor, dataset_source):
    def progress_cb(progress, stage):
        _set_state(progress, stage, status="running")

    try:
        _set_state(5, "starting", status="running", message="Training started")

        approved_df = _approved_training_df()
        used_source = dataset_source
        if approved_df is not None and len(approved_df) >= 20:
            used_source = "approved_training_data"
            result = train_model_from_dataframe(approved_df, progress_cb=progress_cb)
        else:
            used_source = "seed_data"
            result = train_model(progress_cb=progress_cb, dataset_size=dataset_size)

        _set_state(85, "training_anomaly_models", status="running", message="Training anomaly models per organization")
        anomaly_versions = []
        for org_id in list_organization_ids():
            trained = train_anomaly_model_for_org(org_id)
            if trained:
                anomaly_versions.append({"organizationId": org_id, "version": trained["version"]})
        # global fallback anomaly model
        global_anomaly = train_anomaly_model_for_org(None)
        if global_anomaly:
            anomaly_versions.append({"organizationId": None, "version": global_anomaly["version"]})

        _set_state(92, "seeding_email_list", status="running", message="Updating email list with training seed data")
        _insert_synthetic_emails(dataset_size, triggered_by=actor)

        _set_state(96, "drift_detection", status="running", message="Evaluating drift")
        drift = run_drift_detection_for_org((actor or {}).get("organization_id"))

        completed_at = datetime.utcnow().isoformat()
        result_summary = {
            "datasetSize": result["dataset_size"],
            "durationMs": result["duration_ms"],
            "model": "RF+SVM+DNN Ensemble",
            "seededEmailRows": dataset_size,
            "metrics": result.get("metrics"),
            "supervisedModelVersion": result.get("model_version"),
            "anomalyModelVersions": anomaly_versions,
            "drift": drift,
            "datasetSource": used_source,
        }
        if (result.get("metrics") or {}).get("accuracy") is not None:
            MODEL_ACCURACY.set(float(result["metrics"]["accuracy"]))
        update_training_run(
            run_id,
            "completed",
            completed_at,
            result["duration_ms"],
            "Training complete",
            result=result_summary,
        )
        _set_state(100, "completed", status="completed", message="Training complete")
    except Exception as exc:
        completed_at = datetime.utcnow().isoformat()
        update_training_run(
            run_id,
            "failed",
            completed_at,
            None,
            f"Training failed: {str(exc)}",
            result={"error": str(exc)},
        )
        _set_state(100, "failed", status="failed", message=f"Training failed: {str(exc)}")


def start_training(dataset_size=2000, triggered_by=None, dataset_source="seed_data"):
    with _lock:
        if _state.get("status") == "running":
            raise RuntimeError("A training run is already in progress")

    run_id = str(uuid.uuid4())
    started_at = datetime.utcnow().isoformat()
    actor = triggered_by or {}

    insert_training_run(
        run_id,
        "running",
        started_at,
        dataset_size,
        triggered_by_user_id=actor.get("sub"),
        triggered_by_email=actor.get("email"),
        triggered_by_role=actor.get("role"),
        dataset_source=dataset_source,
    )
    TRAINING_RUNS_TOTAL.inc()

    actor_summary = {
        "id": actor.get("sub"),
        "email": actor.get("email"),
        "role": actor.get("role"),
    } if actor else None

    with _lock:
        _state["status"] = "running"
        _state["progress"] = 0
        _state["stage"] = "queued"
        _state["message"] = ""
        _state["triggeredBy"] = actor_summary
        _state["runId"] = run_id
        _state["datasetSize"] = dataset_size
        _state["datasetSource"] = dataset_source

    worker = Thread(
        target=_run_training_job,
        args=(run_id, dataset_size, actor, dataset_source),
        daemon=True,
    )
    worker.start()
    return run_id
