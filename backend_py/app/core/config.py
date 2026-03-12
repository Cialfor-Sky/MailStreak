from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    port: int = 8000
    app_env: str = "development"
    jwt_secret: str
    openai_api_key: str | None = None
    cors_origin: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4028,http://127.0.0.1:4028,*"
    db_path: str = "./data/mailstreak.db"
    model_path: str = "./artifacts/ensemble_model.joblib"
    train_on_startup: bool = False
    frontend_dist: str | None = None
    data_retention_days: int = 90
    audit_log_retention_days: int = 365
    gdpr_hard_delete_delay_days: int = 7
    retention_cleanup_interval_minutes: int = 60
    redis_url: str | None = None
    webhook_max_retries: int = 5
    enforce_https: bool = False
    default_org_id: str = "org-default"
    default_org_name: str = "Default Organization"
    privacy_contact_email: str = "privacy@mailstreak.local"
    terms_governing_law: str = "Governing law to be defined per organization"
    hybrid_supervised_weight: float = 0.5
    hybrid_anomaly_weight: float = 0.3
    hybrid_heuristic_weight: float = 0.2
    default_anomaly_threshold: float = 0.7
    anomaly_models_dir: str = "./artifacts/anomaly"
    drift_threshold: float = 0.25

    model_config = SettingsConfigDict(
        env_file=".env",
        protected_namespaces=("settings_",),
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def cors_origins(self):
        return [origin.strip() for origin in self.cors_origin.split(",") if origin.strip()]

settings = Settings()
