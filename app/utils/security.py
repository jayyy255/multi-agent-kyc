"""Security utilities and authentication dependencies."""

from fastapi import Header, HTTPException, status
from app.config import get_settings


async def verify_api_key(x_api_key: str = Header(default=None, alias="X-API-Key")) -> bool:
    """
    Validate incoming API Key if REQUIRE_API_KEY is enabled.
    Can be used as a FastAPI dependency for protected routes.
    """
    settings = get_settings()
    if not settings.REQUIRE_API_KEY:
        return True

    if not x_api_key or x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error_code": "UNAUTHORIZED",
                "message": "Invalid or missing X-API-Key header",
                "details": {},
            },
        )
    return True
