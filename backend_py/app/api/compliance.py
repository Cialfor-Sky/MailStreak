from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.config import settings
from app.db.repository import upsert_org_retention_days, upsert_org_anomaly_threshold, insert_audit_log
from app.utils.dependencies import RoleChecker

router = APIRouter()
allow_super_admin = RoleChecker(["SUPER_ADMIN"])


class OrgRetentionRequest(BaseModel):
    organizationName: str = Field(min_length=2, max_length=150)
    retentionDays: int = Field(ge=1, le=3650)


class OrgAnomalyThresholdRequest(BaseModel):
    organizationName: str = Field(min_length=2, max_length=150)
    anomalyThreshold: float = Field(ge=0.0, le=1.0)


@router.get("/privacy-policy")
def privacy_policy():
    return {
        "title": "Privacy Policy",
        "dataCollected": [
            "User profile identifiers (name, email, role)",
            "Email content and metadata submitted for scanning",
            "Whitelist and training governance actions",
            "Security and audit logs",
        ],
        "processingPurpose": [
            "Threat detection and email risk classification",
            "Fraud/spam prevention and security response",
            "Role-based governance and compliance auditing",
        ],
        "retentionDaysDefault": settings.data_retention_days,
        "thirdParties": [
            "OpenAI (optional explainability integration)",
            "Cloud/database/monitoring providers configured by deployment",
        ],
        "contact": settings.privacy_contact_email,
    }


@router.get("/terms-of-service")
def terms_of_service():
    return {
        "title": "Terms of Service",
        "acceptableUsePolicy": "Users must not upload unlawful, malicious, or unauthorized data.",
        "liabilityLimitations": "Service is provided as-is to the maximum extent permitted by law.",
        "userResponsibilities": "Users are responsible for account security and lawful operation.",
        "terminationPolicy": "Accounts may be suspended for abuse, fraud, or policy violations.",
        "governingLaw": settings.terms_governing_law,
    }


@router.post("/organizations/{organization_id}/retention")
def set_org_retention(organization_id: str, payload: OrgRetentionRequest, user=Depends(allow_super_admin)):
    upsert_org_retention_days(organization_id, payload.organizationName, payload.retentionDays)
    insert_audit_log(
        action="ORG_RETENTION_UPDATED",
        actor=user,
        resource_type="organization",
        resource_id=organization_id,
        details={"retentionDays": payload.retentionDays},
    )
    return {"status": "updated", "organizationId": organization_id, "retentionDays": payload.retentionDays}


@router.post("/organizations/{organization_id}/anomaly-threshold")
def set_org_anomaly_threshold(organization_id: str, payload: OrgAnomalyThresholdRequest, user=Depends(allow_super_admin)):
    upsert_org_anomaly_threshold(organization_id, payload.organizationName, payload.anomalyThreshold)
    insert_audit_log(
        action="ORG_ANOMALY_THRESHOLD_UPDATED",
        actor=user,
        resource_type="organization",
        resource_id=organization_id,
        details={"anomalyThreshold": payload.anomalyThreshold},
    )
    return {"status": "updated", "organizationId": organization_id, "anomalyThreshold": payload.anomalyThreshold}
