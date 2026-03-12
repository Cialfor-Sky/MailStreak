from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

REQUEST_COUNT = Counter("mailstreak_requests_total", "Total HTTP requests", ["method", "path", "status"])
REQUEST_LATENCY = Histogram("mailstreak_request_latency_seconds", "Request latency in seconds", ["method", "path"])
SCAN_TIME = Histogram("mailstreak_scan_processing_seconds", "Email scan processing time in seconds")
ERROR_COUNT = Counter("mailstreak_errors_total", "Unhandled errors total")
TRAINING_RUNS_TOTAL = Counter("mailstreak_training_runs_total", "Total model training runs started")
SUPERVISED_CONFIDENCE_AVG = Gauge("mailstreak_supervised_confidence_avg", "Average supervised confidence")
ANOMALY_SCORE_AVG = Gauge("mailstreak_anomaly_score_avg", "Average anomaly score")
FINAL_RISK_SCORE_AVG = Gauge("mailstreak_final_risk_avg", "Average final risk score")
DRIFT_SCORE = Gauge("mailstreak_model_drift_score", "Latest drift score")
RETRAINING_RECOMMENDED = Gauge("mailstreak_retraining_recommended", "1 if retraining recommended")
MODEL_ACCURACY = Gauge("mailstreak_model_accuracy", "Latest supervised model accuracy")


def metrics_response():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
