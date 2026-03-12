import os
import random
import time

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC

from app.core.config import settings
from app.db.repository import create_model_version

LABELS = ["malware", "phishing", "spam", "suspicious", "clean", "safe"]


def generate_synthetic_dataset(n=2000):
    phishing_subjects = [
        "Verify your account", "Urgent password reset", "Security alert", "Account locked"
    ]
    malware_subjects = [
        "Invoice attached", "Important document", "Updated policy", "Payroll report"
    ]
    spam_subjects = [
        "Limited time offer", "Congratulations winner", "Claim your prize", "Discount inside"
    ]
    clean_subjects = [
        "Meeting notes", "Project update", "Team schedule", "Monthly report"
    ]
    safe_subjects = [
        "Approved vendor invoice",
        "Internal all-hands agenda",
        "Payroll confirmation",
        "Calendar invite: security review",
    ]

    data = []
    for _ in range(n):
        label = random.choices(LABELS, weights=[0.17, 0.17, 0.16, 0.16, 0.17, 0.17])[0]
        if label == "phishing":
            subject = random.choice(phishing_subjects)
            content = "Please verify your login at http://secure-login.example.com to avoid suspension."
        elif label == "malware":
            subject = random.choice(malware_subjects)
            content = "See attached invoice.zip for details. Enable macros to view the document."
        elif label == "spam":
            subject = random.choice(spam_subjects)
            content = "Buy now and get 50% off. Click http://promo.example.com"
        elif label == "suspicious":
            subject = "Unusual activity detected"
            content = "Your account requires attention. Please confirm details."
        elif label == "safe":
            subject = random.choice(safe_subjects)
            content = "This is a validated internal business email from a known trusted sender."
        else:
            subject = random.choice(clean_subjects)
            content = "Here is the report for this week. Let me know if you have questions."

        data.append({"subject": subject, "content": content, "label": label})

    return pd.DataFrame(data)


def build_pipeline():
    text_features = ColumnTransformer(
        transformers=[
            ("subject", TfidfVectorizer(ngram_range=(1, 2)), "subject"),
            ("content", TfidfVectorizer(ngram_range=(1, 2)), "content"),
        ]
    )

    rf = RandomForestClassifier(n_estimators=200, random_state=42)
    svm = SVC(probability=True, kernel="linear")
    dnn = MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=200)

    ensemble = VotingClassifier(
        estimators=[("rf", rf), ("svm", svm), ("dnn", dnn)],
        voting="soft",
    )

    pipeline = Pipeline(
        steps=[
            ("features", text_features),
            ("model", ensemble),
        ]
    )

    return pipeline


def train_model(progress_cb=None, dataset_size=2000):
    start = time.time()
    if progress_cb:
        progress_cb(10, "generate_data")
    df = generate_synthetic_dataset(n=dataset_size)
    X = df[["subject", "content"]]
    y = df["label"]
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    if progress_cb:
        progress_cb(40, "fit_models")
    model = build_pipeline()
    model.fit(X_train, y_train)

    if progress_cb:
        progress_cb(70, "validate")
    y_pred = model.predict(X_val)
    accuracy = float(accuracy_score(y_val, y_pred))
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_val, y_pred, average="weighted", zero_division=0
    )

    if progress_cb:
        progress_cb(90, "save_model")
    os.makedirs(os.path.dirname(settings.model_path), exist_ok=True)
    joblib.dump(model, settings.model_path)

    version_record = create_model_version(
        model_type="supervised",
        organization_id=None,
        artifact_path=settings.model_path,
        training_data_size=dataset_size,
        metrics={
            "accuracy": accuracy,
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
        },
        status="active",
        baseline={"confidence_mean": None, "confidence_std": None},
    )

    if progress_cb:
        progress_cb(100, "completed")
    duration_ms = int((time.time() - start) * 1000)
    return {
        "model": model,
        "dataset_size": dataset_size,
        "duration_ms": duration_ms,
        "metrics": {
            "accuracy": accuracy,
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
        },
        "model_version": version_record["version"],
    }


def train_model_from_dataframe(df: pd.DataFrame, progress_cb=None):
    start = time.time()
    if df is None or df.empty:
        raise ValueError("No training data provided")
    if not {"subject", "content", "label"}.issubset(set(df.columns)):
        raise ValueError("Training dataframe missing required columns")

    X = df[["subject", "content"]]
    y = df["label"]
    if len(df) < 20:
        raise ValueError("At least 20 approved records are required")

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    if progress_cb:
        progress_cb(40, "fit_models")
    model = build_pipeline()
    model.fit(X_train, y_train)

    if progress_cb:
        progress_cb(70, "validate")
    y_pred = model.predict(X_val)
    accuracy = float(accuracy_score(y_val, y_pred))
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_val, y_pred, average="weighted", zero_division=0
    )

    if progress_cb:
        progress_cb(90, "save_model")
    os.makedirs(os.path.dirname(settings.model_path), exist_ok=True)
    joblib.dump(model, settings.model_path)

    version_record = create_model_version(
        model_type="supervised",
        organization_id=None,
        artifact_path=settings.model_path,
        training_data_size=len(df),
        metrics={
            "accuracy": accuracy,
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
        },
        status="active",
        baseline={"confidence_mean": None, "confidence_std": None},
    )

    if progress_cb:
        progress_cb(100, "completed")
    duration_ms = int((time.time() - start) * 1000)
    return {
        "model": model,
        "dataset_size": len(df),
        "duration_ms": duration_ms,
        "metrics": {
            "accuracy": accuracy,
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
        },
        "model_version": version_record["version"],
    }


def ensure_model():
    if not os.path.exists(settings.model_path):
        train_model()
