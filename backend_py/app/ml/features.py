import re

from app.utils.header_parser import parse_email_headers


URL_RE = re.compile(r"https?://", re.IGNORECASE)
IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")


def extract_header_features(content: str):
    parsed = parse_email_headers(content or "")
    fields = parsed.get("fields") or {}
    auth = parsed.get("authentication") or {}
    anomalies = parsed.get("anomalies") or []
    return {
        "header_analysis": parsed,
        "spf_pass": 1 if ((auth.get("spf") or {}).get("status") == "PASS") else 0,
        "dkim_pass": 1 if ((auth.get("dkim") or {}).get("status") == "PASS") else 0,
        "dmarc_pass": 1 if ((auth.get("dmarc") or {}).get("status") == "PASS") else 0,
        "domain_mismatch": 1 if not fields.get("messageIdMatchesFromDomain", True) else 0,
        "relay_count": int(fields.get("receivedCount") or 0),
        "header_risk_detected": 1 if parsed.get("headerRiskDetected") else 0,
        "anomaly_count": len(anomalies),
    }


def extract_metadata_features(subject: str, content: str, metadata: dict | None, sender_frequency: int = 0):
    text = content or ""
    return {
        "subject_len": len(subject or ""),
        "content_len": len(text),
        "url_count": len(URL_RE.findall(text)),
        "ip_count": len(IP_RE.findall(text)),
        "exclamation_count": text.count("!"),
        "uppercase_ratio": (sum(1 for c in text if c.isupper()) / max(len(text), 1)),
        "sender_history_count": int(sender_frequency or 0),
        "has_sender": 1 if ((metadata or {}).get("sender")) else 0,
    }


def build_anomaly_text(subject: str, content: str, metadata_features: dict, header_features: dict):
    return " ".join(
        [
            (subject or ""),
            (content or ""),
            f"sender_history_{metadata_features.get('sender_history_count', 0)}",
            f"url_count_{metadata_features.get('url_count', 0)}",
            f"ip_count_{metadata_features.get('ip_count', 0)}",
            f"domain_mismatch_{header_features.get('domain_mismatch', 0)}",
            f"relay_count_{header_features.get('relay_count', 0)}",
            f"header_risk_{header_features.get('header_risk_detected', 0)}",
        ]
    )
