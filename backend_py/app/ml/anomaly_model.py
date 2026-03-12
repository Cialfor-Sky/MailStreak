import math
import os

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import TfidfVectorizer

from app.core.config import settings
from app.db.repository import (
    create_model_version,
    get_active_model_version,
    get_org_anomaly_threshold,
    list_verified_safe_emails_for_org,
)


_cache = {}


def _artifact_path_for_org(organization_id: str | None, version: int):
    os.makedirs(settings.anomaly_models_dir, exist_ok=True)
    org = organization_id or "global"
    return os.path.join(settings.anomaly_models_dir, f"anomaly_{org}_v{version}.joblib")


def train_anomaly_model_for_org(organization_id: str | None):
    rows = list_verified_safe_emails_for_org(organization_id, limit=5000)
    if len(rows) < 20:
        return None

    corpus = [f"{(r.get('subject') or '').strip()} {(r.get('content') or '').strip()}" for r in rows]
    vectorizer = TfidfVectorizer(max_features=3000, ngram_range=(1, 2))
    X = vectorizer.fit_transform(corpus)
    model = IsolationForest(
        n_estimators=200,
        contamination=0.08,
        random_state=42,
    )
    model.fit(X)

    decision = model.decision_function(X)
    baseline = {
        "decision_mean": float(np.mean(decision)),
        "decision_std": float(np.std(decision)),
    }

    metrics = {"precision": None, "recall": None, "f1_score": None, "accuracy": None}
    record = create_model_version(
        model_type="anomaly",
        organization_id=organization_id,
        artifact_path=None,
        training_data_size=len(rows),
        metrics=metrics,
        status="active",
        baseline=baseline,
    )
    artifact_path = _artifact_path_for_org(organization_id, record["version"])
    joblib.dump({"vectorizer": vectorizer, "model": model, "baseline": baseline}, artifact_path)

    # Update active record with artifact path in-place
    from app.db.database import get_connection

    conn = get_connection()
    conn.execute("UPDATE models SET artifact_path = ? WHERE id = ?", (artifact_path, record["id"]))
    conn.commit()
    _cache[(organization_id or "global")] = {"vectorizer": vectorizer, "model": model, "baseline": baseline, "version": record["version"]}
    return {"artifactPath": artifact_path, "version": record["version"], "trainingDataSize": len(rows)}


def _load_active(organization_id: str | None):
    key = organization_id or "global"
    if key in _cache:
        return _cache[key]
    active = get_active_model_version("anomaly", organization_id)
    if not active:
        return None
    artifact = active.get("artifact_path")
    if not artifact or not os.path.exists(artifact):
        return None
    bundle = joblib.load(artifact)
    bundle["version"] = active.get("version")
    _cache[key] = bundle
    return bundle


def _to_anomaly_score(decision_value: float):
    # Convert IF decision_function to [0,1], higher means more anomalous.
    return float(1.0 / (1.0 + math.exp(5.0 * decision_value)))


def infer_anomaly_score(organization_id: str | None, text_for_anomaly: str):
    loaded = _load_active(organization_id)
    if not loaded:
        loaded = _load_active(None)
    if not loaded:
        return {"anomaly_score": 0.0, "anomaly_flag": False, "model_version": None}

    vectorizer = loaded["vectorizer"]
    model = loaded["model"]
    X = vectorizer.transform([text_for_anomaly or ""])
    decision = float(model.decision_function(X)[0])
    score = _to_anomaly_score(decision)
    threshold = get_org_anomaly_threshold(organization_id)
    if threshold is None:
        threshold = settings.default_anomaly_threshold
    return {
        "anomaly_score": max(0.0, min(1.0, score)),
        "anomaly_flag": score >= float(threshold),
        "model_version": loaded.get("version"),
    }
