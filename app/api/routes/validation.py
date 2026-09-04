"""Deterministic Document Validation Endpoint."""

from fastapi import APIRouter, Depends, status
from app.api.deps import get_validator
from app.models.errors import ErrorResponse
from app.models.requests import DocumentValidateRequest
from app.models.responses import DocumentValidateResponse
from app.services.validator import DocumentValidator
from app.utils.security import verify_api_key

router = APIRouter(prefix="/api/v1/documents", tags=["Document Validation"])


@router.post(
    "/validate",
    response_model=DocumentValidateResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate Extracted Document Fields",
    description=(
        "Performs deterministic business and compliance validation against extracted fields and "
        "authoritative customer records. Evaluates mandatory fields, expiry dates, age eligibility, "
        "and name consistency without making final legal approval decisions."
    ),
    responses={
        200: {"model": DocumentValidateResponse, "description": "Validation completed"},
        400: {"model": ErrorResponse, "description": "Invalid payload format"},
        422: {"model": ErrorResponse, "description": "Schema validation failure"},
    },
)
async def validate_document_fields(
    request: DocumentValidateRequest,
    validator: DocumentValidator = Depends(get_validator),
    _: bool = Depends(verify_api_key),
) -> DocumentValidateResponse:
    """Execute validation worker tool."""
    return validator.validate(request)
