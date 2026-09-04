"""Main FastAPI application entrypoint for Multi-Agent KYC Onboarding Automation."""

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import cases, classification, extraction, health, validation
from app.config import get_settings
from app.models.errors import ErrorResponse, KYCServiceException
from app.utils.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

app = FastAPI(
    title="Multi-Agent KYC Onboarding Automation API",
    description=(
        "Production-ready deterministic worker service backend for the Multi-Agent KYC Onboarding system.\n\n"
        "### Architecture Context\n"
        "- **Supervisor Agent**: Microsoft Copilot Studio (orchestration, planning, reasoning, next-action selection).\n"
        "- **Integration Layer**: Power Automate HTTP actions calling these RESTful worker endpoints.\n"
        "- **Worker Services**: Bounded Python micro-services for classification, structured extraction, and deterministic validation.\n"
        "- **State Store**: Microsoft Dataverse (case state, audit logs, customer CRM profile).\n\n"
        "**Note**: This service acts as a deterministic worker tool and never makes final legal or regulatory compliance authorizations."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------------------
# Standardized Error Handling & Exception Handlers
# ------------------------------------------------------------------------------


@app.exception_handler(KYCServiceException)
async def kyc_service_exception_handler(request: Request, exc: KYCServiceException):
    """Handle custom application KYC exceptions."""
    logger.warning(f"KYCServiceException: code={exc.error_code}, message={exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            success=False,
            error_code=exc.error_code,
            message=exc.message,
            details=exc.details,
        ).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic request schema validation errors."""
    errors_list = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err.get("loc", [])])
        errors_list.append({
            "field": field,
            "issue": err.get("msg", "Invalid field format"),
            "type": err.get("type", "value_error"),
        })

    logger.warning(f"RequestValidationError at {request.url.path}: {len(errors_list)} schema issues")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            success=False,
            error_code="VALIDATION_ERROR",
            message="The request payload failed schema validation.",
            details={"errors": errors_list},
        ).model_dump(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle standard FastAPI/Starlette HTTP exceptions."""
    if isinstance(exc.detail, dict) and "error_code" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            success=False,
            error_code="HTTP_ERROR",
            message=str(exc.detail),
            details={"status_code": exc.status_code},
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Catch-all generic 500 error handler.
    Guarantees no internal stack traces or secrets are leaked in API responses.
    """
    logger.error(f"Unhandled internal server error at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            success=False,
            error_code="INTERNAL_SERVER_ERROR",
            message="An unexpected internal server error occurred while processing the request.",
            details={"path": request.url.path},
        ).model_dump(),
    )


# ------------------------------------------------------------------------------
# Include API Routers
# ------------------------------------------------------------------------------

app.include_router(health.router)
app.include_router(classification.router)
app.include_router(extraction.router)
app.include_router(validation.router)
app.include_router(cases.router)


@app.get("/", include_in_schema=False)
async def root():
    """Redirect or provide quick welcome message at root URL."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }
