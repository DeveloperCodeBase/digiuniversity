"""FastAPI entry point for the AI Gateway."""

from fastapi import FastAPI

from . import __version__
from .routes import router
from .settings import settings


app = FastAPI(
    title="DigiUniversity AI Gateway",
    description=(
        "Adapter between the core API and external AI providers. The current "
        "VPS has no GPU; heavy AI must be delegated to an external provider "
        "via AI_SERVICES_BASE_URL (set AI_MODE=external_api). With AI_MODE=mock "
        "(default) the gateway returns deterministic stub responses so the "
        "rest of the platform can run locally without network."
    ),
    version=__version__,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


app.include_router(router)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {
        "service": settings.service_name,
        "version": __version__,
        "mode": settings.ai_mode,
        "docs": "/docs",
        "health": "/v1/health",
    }
