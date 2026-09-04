"""Document Classification Endpoint."""

from fastapi import APIRouter, Depends, status
from app.api.deps import get_classifier
from app.models.errors import ErrorResponse
from app.models.requests import DocumentClassifyRequest
from app.models.responses import DocumentClassifyResponse
from app.services.classifier import BaseClassifier
from app.utils.security import verify_api_key

router = APIRouter(prefix="/api/v1/documents", tags=["Document Classification"])


@router.post(
    "/classify",
    response_model=DocumentClassifyResponse,
    status_code=status.HTTP_200_OK,
    summary="Classify Document Type",
    description=(
        "Analyzes raw document text, filename, and metadata to identify the document category "
        "(e.g. passport, driving_license, proof_of_address). Returns category, confidence score, "
        "and human review flag."
    ),
    responses={
        200: {"model": DocumentClassifyResponse, "description": "Classification successful"},
        400: {"model": ErrorResponse, "description": "Invalid input format"},
        422: {"model": ErrorResponse, "description": "Schema validation failure"},
    },
)
async def classify_document(
    request: DocumentClassifyRequest,
    classifier: BaseClassifier = Depends(get_classifier),
    _: bool = Depends(verify_api_key),
) -> DocumentClassifyResponse:
    """Execute document classification worker tool."""
    return classifier.classify(request)
