"""Health check and version discovery endpoints."""

from fastapi import APIRouter
from app.config import get_settings
from app.models.responses import HealthResponse, VersionResponse

router = APIRouter(tags=["Health & Version"])


@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
async def get_health() -> HealthResponse:
    """
    Check if the service is alive and healthy.
    Useful for container probes (Docker, Kubernetes) and Power Automate ping tests.
    """
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        service=settings.APP_NAME,
    )


@router.get("/api/v1/version", response_model=VersionResponse, summary="API Version Discovery")
async def get_version() -> VersionResponse:
    """
    Return current service metadata, semantic version, and active environment.
    """
    settings = get_settings()
    return VersionResponse(
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        api_prefix=settings.API_V1_PREFIX,
    )
