"""Document Field Extraction Endpoint."""

from fastapi import APIRouter, Depends, status
from app.api.deps import get_extractor
from app.models.errors import ErrorResponse
from app.models.requests import DocumentExtractRequest
from app.models.responses import DocumentExtractResponse
from app.services.extractor import BaseExtractor
from app.utils.security import verify_api_key

router = APIRouter(prefix="/api/v1/documents", tags=["Document Extraction"])


@router.post(
    "/extract",
    response_model=DocumentExtractResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract Structured Fields from Document",
    description=(
        "Extracts structured key-value entities (full name, DOB, ID numbers, address, expiry date) "
        "from classified document text. Identifies missing fields and returns extraction confidence."
    ),
    responses={
        200: {"model": DocumentExtractResponse, "description": "Extraction completed"},
        400: {"model": ErrorResponse, "description": "Invalid input"},
        422: {"model": ErrorResponse, "description": "Schema validation failure"},
    },
)
async def extract_document_fields(
    request: DocumentExtractRequest,
    extractor: BaseExtractor = Depends(get_extractor),
    _: bool = Depends(verify_api_key),
) -> DocumentExtractResponse:
    """Execute field extraction worker tool."""
    return extractor.extract(request)
