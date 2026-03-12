from app.core.config import settings
from app.core.metrics import (
    ANOMALY_SCORE_AVG,
    DRIFT_SCORE,
    FINAL_RISK_SCORE_AVG,
    RETRAINING_RECOMMENDED,
    SUPERVISED_CONFIDENCE_AVG,
)
from app.db.repository import (
    get_active_model_version,
    get_score_stats_window,
    insert_model_drift_log,
)


def aggregate_hybrid_scores(supervised_score: float, anomaly_score: float, heuristic_score: float):
    final = (
        float(supervised_score) * float(settings.hybrid_supervised_weight)
        + float(anomaly_score) * float(settings.hybrid_anomaly_weight)
        + float(heuristic_score / 100.0) * float(settings.hybrid_heuristic_weight)
    )
    return max(0.0, min(1.0, final))


def update_live_hybrid_metrics(supervised_score: float, anomaly_score: float, final_score: float):
    SUPERVISED_CONFIDENCE_AVG.set(float(supervised_score))
    ANOMALY_SCORE_AVG.set(float(anomaly_score))
    FINAL_RISK_SCORE_AVG.set(float(final_score * 100.0))


def run_drift_detection_for_org(organization_id: str | None):
    current = get_score_stats_window(organization_id, days=30, offset_days=0)
    previous = get_score_stats_window(organization_id, days=30, offset_days=30)

    confidence_shift = abs((current["avg_confidence"] - previous["avg_confidence"]) / 100.0)
    feature_shift = abs(current["avg_anomaly"] - previous["avg_anomaly"])
    fp_shift = abs(current["false_positive_rate"] - previous["false_positive_rate"])
    drift_score = (confidence_shift + feature_shift + fp_shift) / 3.0
    recommended = drift_score >= float(settings.drift_threshold)

    active = get_active_model_version("supervised", None)
    insert_model_drift_log(
        organization_id=organization_id,
        model_type="supervised",
        model_version=(active or {}).get("version"),
        drift_score=drift_score,
        false_positive_rate=current["false_positive_rate"],
        confidence_shift=confidence_shift,
        feature_shift=feature_shift,
        retraining_recommended=recommended,
        details={"current": current, "previous": previous},
    )
    DRIFT_SCORE.set(float(drift_score))
    RETRAINING_RECOMMENDED.set(1 if recommended else 0)
    return {
        "organizationId": organization_id,
        "driftScore": drift_score,
        "retrainingRecommended": recommended,
        "confidenceShift": confidence_shift,
        "featureShift": feature_shift,
        "falsePositiveRate": current["false_positive_rate"],
    }
