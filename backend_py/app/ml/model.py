import os

import joblib
import pandas as pd

from app.core.config import settings
from app.db.repository import get_active_model_version

_model = None
_model_meta = None


def load_model():
    global _model, _model_meta
    active = get_active_model_version("supervised", None)
    candidate_path = None
    version = None
    if active and active.get("artifact_path"):
        candidate_path = active["artifact_path"]
        version = active.get("version")
    if not candidate_path:
        candidate_path = settings.model_path
    if _model is None or (_model_meta or {}).get("path") != candidate_path:
        if not os.path.exists(candidate_path):
            return None, {"path": candidate_path, "version": version}
        _model = joblib.load(candidate_path)
        _model_meta = {"path": candidate_path, "version": version}
    return _model, (_model_meta or {"path": candidate_path, "version": version})


def predict_email_with_meta(subject: str, content: str):
    model, meta = load_model()
    if model is None:
        return "suspicious", {"suspicious": 1.0}, meta
    df = pd.DataFrame([{"subject": subject or "", "content": content or ""}])
    proba = model.predict_proba(df)[0]
    labels = model.classes_
    probabilities = {labels[i]: float(proba[i]) for i in range(len(labels))}
    predicted = labels[int(proba.argmax())]
    return predicted, probabilities, meta


def predict_email(subject: str, content: str):
    predicted, probabilities, _ = predict_email_with_meta(subject, content)
    return predicted, probabilities
