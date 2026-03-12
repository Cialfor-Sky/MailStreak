import re
from email.utils import parseaddr


_HEADER_CANDIDATE_RE = re.compile(r"^[A-Za-z0-9\-]+:\s*.+$")
_IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
_STATUS_RE = re.compile(r"\b(pass|fail|softfail|neutral|none)\b", re.IGNORECASE)
_DOMAIN_RE = re.compile(r"@([A-Za-z0-9.\-]+\.[A-Za-z]{2,})")
_MESSAGE_ID_DOMAIN_RE = re.compile(r"<[^>]*@([A-Za-z0-9.\-]+\.[A-Za-z]{2,})>")
_DISPLAY_DOMAIN_RE = re.compile(r"\b([A-Za-z0-9.\-]+\.[A-Za-z]{2,})\b")


def _normalize_content(raw_email: str) -> str:
    return (raw_email or "").replace("\r\n", "\n").replace("\r", "\n")


def _extract_header_section(text: str) -> tuple[str, str]:
    if not text.strip():
        return "", ""

    parts = re.split(r"\n\s*\n", text, maxsplit=1)
    header_section = parts[0] if parts else ""
    body = parts[1] if len(parts) > 1 else ""
    return header_section, body


def _looks_like_header_section(header_section: str) -> bool:
    lines = [line for line in header_section.split("\n") if line.strip()]
    if not lines:
        return False
    header_like = sum(1 for line in lines[:25] if _HEADER_CANDIDATE_RE.match(line))
    return header_like >= 2


def _parse_folded_headers(header_section: str) -> dict[str, list[str]]:
    headers: dict[str, list[str]] = {}
    current_key = None
    current_value = []

    def flush():
        nonlocal current_key, current_value
        if current_key:
            value = " ".join(part.strip() for part in current_value if part is not None).strip()
            headers.setdefault(current_key.lower(), []).append(value)
        current_key = None
        current_value = []

    for raw_line in header_section.split("\n"):
        if not raw_line.strip():
            continue
        if raw_line[:1] in {" ", "\t"} and current_key:
            current_value.append(raw_line.strip())
            continue
        if ":" not in raw_line:
            continue
        flush()
        key, value = raw_line.split(":", 1)
        current_key = key.strip()
        current_value = [value.strip()]

    flush()
    return headers


def _first(headers: dict[str, list[str]], key: str) -> str | None:
    values = headers.get(key.lower()) or []
    return values[0] if values else None


def _extract_domain_from_email(address: str | None) -> str | None:
    if not address:
        return None
    _, parsed_email = parseaddr(address)
    if "@" not in parsed_email:
        return None
    return parsed_email.rsplit("@", 1)[-1].lower()


def _extract_spf_status(*values: str | None) -> str:
    text = " ".join(v for v in values if v).lower()
    if "softfail" in text:
        return "SOFTFAIL"
    if "fail" in text:
        return "FAIL"
    if "pass" in text:
        return "PASS"
    if "none" in text or "neutral" in text:
        return "NONE"
    return "NONE"


def _extract_dkim_status(*values: str | None) -> str:
    text = " ".join(v for v in values if v).lower()
    if "dkim=pass" in text or re.search(r"\bdkim\s*:\s*pass\b", text):
        return "PASS"
    if "dkim=fail" in text or re.search(r"\bdkim\s*:\s*fail\b", text):
        return "FAIL"
    if "dkim=none" in text:
        return "NONE"
    return "NONE"


def _extract_dmarc_status(*values: str | None) -> str:
    text = " ".join(v for v in values if v).lower()
    if "dmarc=pass" in text:
        return "PASS"
    if "dmarc=fail" in text:
        return "FAIL"
    if "dmarc=none" in text:
        return "NONE"
    if "dmarc:" in text:
        match = _STATUS_RE.search(text)
        if match:
            status = match.group(1).upper()
            if status in {"PASS", "FAIL", "NONE"}:
                return status
    return "NONE"


def _risk_for_auth(status: str, kind: str) -> str:
    if status == "PASS":
        return f"{kind} passed. Authentication signal is strong."
    if status == "SOFTFAIL":
        return f"{kind} softfail. Sender authorization is weak and should be reviewed."
    if status == "FAIL":
        return f"{kind} failed. This is a strong spoofing risk indicator."
    return f"{kind} not found or none. Missing signal increases uncertainty."


def parse_email_headers(raw_email: str) -> dict:
    try:
        content = _normalize_content(raw_email)
        header_section, _ = _extract_header_section(content)

        if not _looks_like_header_section(header_section):
            return {
                "hasHeaders": False,
                "rawHeader": "",
                "fields": {},
                "authentication": {
                    "spf": {"status": "NONE", "ip": None, "interpretation": _risk_for_auth("NONE", "SPF")},
                    "dkim": {"status": "NONE", "domain": None, "interpretation": _risk_for_auth("NONE", "DKIM")},
                    "dmarc": {"status": "NONE", "interpretation": _risk_for_auth("NONE", "DMARC")},
                },
                "anomalies": ["Missing standard email headers"],
                "headerRiskDetected": True,
            }

        headers = _parse_folded_headers(header_section)
        from_header = _first(headers, "from")
        to_header = _first(headers, "to")
        subject = _first(headers, "subject")
        message_id = _first(headers, "message-id")
        date = _first(headers, "date")
        authentication_results = _first(headers, "authentication-results")
        spf_header = _first(headers, "spf")
        dkim_header = _first(headers, "dkim")
        dmarc_header = _first(headers, "dmarc")
        received_headers = headers.get("received", [])

        display_name, from_email = parseaddr(from_header or "")
        from_domain = _extract_domain_from_email(from_email)
        message_id_domain_match = _MESSAGE_ID_DOMAIN_RE.search(message_id or "")
        message_id_domain = message_id_domain_match.group(1).lower() if message_id_domain_match else None

        auth_pool = [spf_header, dkim_header, dmarc_header, authentication_results]

        spf_status = _extract_spf_status(*auth_pool)
        spf_ip_match = _IP_RE.search(" ".join(v for v in auth_pool if v))
        spf_ip = spf_ip_match.group(0) if spf_ip_match else None

        dkim_domain_match = re.search(r"(?:header\.)?d=([A-Za-z0-9.\-]+\.[A-Za-z]{2,})", " ".join(v for v in auth_pool if v), re.IGNORECASE)
        dkim_domain = dkim_domain_match.group(1).lower() if dkim_domain_match else None
        dkim_status = _extract_dkim_status(*auth_pool)

        dmarc_status = _extract_dmarc_status(*auth_pool)

        anomalies = []
        if from_domain and message_id_domain and from_domain != message_id_domain:
            anomalies.append("Sender domain mismatch between From and Message-ID")

        if from_domain and dkim_domain and from_domain != dkim_domain:
            anomalies.append("DKIM signing domain does not match From domain")

        if not any([spf_header, dkim_header, dmarc_header, authentication_results]):
            anomalies.append("Missing authentication headers (SPF/DKIM/DMARC)")

        if len(received_headers) >= 8:
            anomalies.append("Suspicious relay chain length detected")

        joined_received = " ".join(received_headers).lower()
        if "unknown" in joined_received or "localhost" in joined_received:
            anomalies.append("Suspicious relay host in Received chain")

        if display_name and from_domain:
            display_domain_match = _DISPLAY_DOMAIN_RE.search(display_name.lower())
            if display_domain_match and display_domain_match.group(1) != from_domain:
                anomalies.append("Display name domain mismatches actual sender email domain")

        weak_auth = spf_status in {"FAIL", "SOFTFAIL", "NONE"} or dkim_status in {"FAIL", "NONE"} or dmarc_status in {"FAIL", "NONE"}
        header_risk_detected = bool(anomalies) or weak_auth

        return {
            "hasHeaders": True,
            "rawHeader": header_section,
            "fields": {
                "messageId": message_id,
                "date": date,
                "from": from_header,
                "fromEmail": from_email or None,
                "fromDisplayName": display_name or None,
                "fromDomain": from_domain,
                "to": to_header,
                "subject": subject,
                "receivedCount": len(received_headers),
                "authenticationResults": authentication_results,
                "messageIdDomain": message_id_domain,
                "messageIdMatchesFromDomain": bool(
                    from_domain and message_id_domain and from_domain == message_id_domain
                ),
            },
            "authentication": {
                "spf": {
                    "status": spf_status,
                    "ip": spf_ip,
                    "interpretation": _risk_for_auth(spf_status, "SPF"),
                },
                "dkim": {
                    "status": dkim_status,
                    "domain": dkim_domain,
                    "interpretation": _risk_for_auth(dkim_status, "DKIM"),
                },
                "dmarc": {
                    "status": dmarc_status,
                    "interpretation": _risk_for_auth(dmarc_status, "DMARC"),
                },
            },
            "anomalies": anomalies,
            "headerRiskDetected": header_risk_detected,
        }
    except Exception:
        return {
            "hasHeaders": False,
            "rawHeader": "",
            "fields": {},
            "authentication": {
                "spf": {"status": "NONE", "ip": None, "interpretation": _risk_for_auth("NONE", "SPF")},
                "dkim": {"status": "NONE", "domain": None, "interpretation": _risk_for_auth("NONE", "DKIM")},
                "dmarc": {"status": "NONE", "interpretation": _risk_for_auth("NONE", "DMARC")},
            },
            "anomalies": ["Malformed header content"],
            "headerRiskDetected": True,
        }
