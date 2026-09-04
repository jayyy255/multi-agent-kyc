"""Case-Level KYC Worker Endpoints (Optional Future-Ready Tools)."""

from fastapi import APIRouter, Depends, status
from app.api.deps import get_case_analyzer
from app.models.errors import ErrorResponse
from app.models.requests import (
    DataComparisonRequest,
    InconsistencyDetectRequest,
    RequirementsCheckRequest,
)
from app.models.responses import (
    DataComparisonResponse,
    InconsistencyDetectResponse,
    RequirementsCheckResponse,
)
from app.services.case_analyzer import CaseAnalyzer
from app.utils.security import verify_api_key

router = APIRouter(prefix="/api/v1/cases", tags=["Case Analysis Tools"])


@router.post(
    "/check-requirements",
    response_model=RequirementsCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Check KYC Case Document Requirements",
    description="Evaluates if uploaded documents satisfy the required KYC checklist (Identity + Address proof).",
)
async def check_requirements(
    request: RequirementsCheckRequest,
    analyzer: CaseAnalyzer = Depends(get_case_analyzer),
    _: bool = Depends(verify_api_key),
) -> RequirementsCheckResponse:
    return analyzer.check_requirements(request)


@router.post(
    "/compare-customer-data",
    response_model=DataComparisonResponse,
    status_code=status.HTTP_200_OK,
    summary="Compare Customer Profile against Documents",
    description="Compares customer profile attributes with all extracted document fields.",
)
async def compare_customer_data(
    request: DataComparisonRequest,
    analyzer: CaseAnalyzer = Depends(get_case_analyzer),
    _: bool = Depends(verify_api_key),
) -> DataComparisonResponse:
    return analyzer.compare_customer_data(request)


@router.post(
    "/detect-inconsistencies",
    response_model=InconsistencyDetectResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect Cross-Document Inconsistencies",
    description="Scans all documents provided in a case for conflicting names, dates, or addresses.",
)
async def detect_inconsistencies(
    request: InconsistencyDetectRequest,
    analyzer: CaseAnalyzer = Depends(get_case_analyzer),
    _: bool = Depends(verify_api_key),
) -> InconsistencyDetectResponse:
    return analyzer.detect_inconsistencies(request)
