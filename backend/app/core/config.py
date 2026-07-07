from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    SECRET_KEY: str

    AZURE_TENANT_ID: str = ""
    AZURE_CLIENT_ID: str = ""
    AZURE_JWKS_URI: str = ""

    ACS_CONNECTION_STRING: str = ""
    ACS_SENDER_EMAIL: str = "no-reply@xebia.com"

    # Base URL of the frontend app — used to generate survey links in emails
    FRONTEND_URL: str = "http://localhost:3000"

    # Comma-separated list of allowed frontend origins e.g. https://myapp.vercel.app
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # ── App-native auth (credential login) ─────────────────────────────────
    # App JWTs are signed with SECRET_KEY; keep it stable in production.
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 12  # 12h session

    # ── Lead search ────────────────────────────────────────────────────────
    # Which B2B data provider to use for lead discovery/enrichment.
    # Currently supported: "apollo". Adding a provider = one new adapter.
    LEAD_PROVIDER: str = "apollo"
    APOLLO_API_KEY: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


settings = Settings()
print("Allowed Origins:", settings.cors_origins)
