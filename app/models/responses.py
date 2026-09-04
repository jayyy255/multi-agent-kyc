"""Pydantic response schemas for all KYC backend endpoints."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.enums import (
    DocumentType,
    FieldValidationStatus,
    ReviewRecommendation,
    RiskLevel,
    ValidationStatus,
)


class HealthResponse(BaseModel):
    """Service health check response."""

    status: str = Field("healthy", description="Operational status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC timestamp of the check")
    service: str = Field("multi-agent-kyc-backend", description="Service identifier")


class VersionResponse(BaseModel):
    """Service version and environment discovery response."""

    service: str = Field("multi-agent-kyc-backend", description="Service identifier")
    version: str = Field(..., description="Semantic version")
    environment: str = Field(..., description="Active environment (e.g. development, production)")
    api_prefix: str = Field("/api/v1", description="API route prefix")


class DocumentClassifyResponse(BaseModel):
    """Response returned by the Document Classification service."""

    success: bool = Field(True, description="Indicates if classification succeeded")
    document_id: str = Field(..., description="Document identifier provided in request")
    document_type: DocumentType = Field(..., description="Identified document type")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    extracted_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Heuristic metadata extracted during classification",
    )
    requires_manual_review: bool = Field(
        False,
        description="Flag indicating if low confidence warrants human operator review",
    )
    warnings: List[str] = Field(default_factory=list, description="Non-fatal classification notices")
    message: str = Field("Document classified successfully", description="Status summary message")

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "document_id": "doc-001",
                "document_type": "passport",
                "confidence": 0.94,
                "extracted_metadata": {
                    "matched_keywords": ["PASSPORT", "PASSEPORT", "SURNAME"],
                    "detected_mimetype": "application/pdf"
                },
                "requires_manual_review": False,
                "warnings": [],
                "message": "Document classified successfully"
            }
        }
    }


class DocumentExtractResponse(BaseModel):
    """Response returned by the Document Field Extraction service."""

    success: bool = Field(True, description="Indicates if extraction succeeded")
    document_id: str = Field(..., description="Document identifier")
    document_type: DocumentType = Field(..., description="Document type extracted")
    extracted_fields: Dict[str, Any] = Field(
        default_factory=dict,
        description="Extracted key-value pairs (names, dates, IDs, addresses)",
    )
    missing_fields: List[str] = Field(
        default_factory=list,
        description="Expected fields for this document type that could not be extracted",
    )
    confidence: float = Field(..., ge=0.0, le=1.0, description="Average extraction confidence")
    requires_manual_review: bool = Field(
        False,
        description="Flag indicating extraction ambiguity or critical missing fields",
    )
    warnings: List[str] = Field(default_factory=list, description="Formatting or extraction warnings")
    message: str = Field("Fields extracted successfully", description="Summary message")

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "document_id": "doc-001",
                "document_type": "passport",
                "extracted_fields": {
                    "full_name": "Sample Customer",
                    "date_of_birth": "1998-04-12",
                    "nationality": "IN",
                    "passport_number": "P0000000",
                    "expiry_date": "2030-04-12"
                },
                "missing_fields": [],
                "confidence": 0.91,
                "requires_manual_review": False,
                "warnings": [],
                "message": "Fields extracted successfully"
            }
        }
    }


class ValidationResultItem(BaseModel):
    """Field-level validation check outcome."""

    field: str = Field(..., description="Field name being evaluated")
    status: FieldValidationStatus = Field(..., description="Status of this specific field check")
    message: str = Field(..., description="Explanatory message regarding check result")
    details: Dict[str, Any] = Field(default_factory=dict, description="Supplementary rule evaluation data")


class DocumentValidateResponse(BaseModel):
    """Response returned by the Deterministic Validation service."""

    success: bool = Field(True, description="Indicates whether validation executed without runtime error")
    case_id: str = Field(..., description="Case identifier")
    is_valid: bool = Field(..., description="True only if all deterministic rules and required fields pass")
    validation_status: ValidationStatus = Field(..., description="Overall categorization of validation outcome")
    validation_results: List[ValidationResultItem] = Field(
        default_factory=list,
        description="Detailed list of individual field checks",
    )
    missing_information: List[str] = Field(
        default_factory=list,
        description="List of fields that were missing or unparseable",
    )
    inconsistencies: List[str] = Field(
        default_factory=list,
        description="List of discrepancies found against customer profile or cross-document rules",
    )
    requires_manual_review: bool = Field(
        False,
        description="True if human compliance officer intervention is required",
    )
    recommendation: ReviewRecommendation = Field(
        ...,
        description="Actionable next-step recommendation for the Copilot Studio Supervisor Agent",
    )
    risk_level: RiskLevel = Field(RiskLevel.LOW, description="Assessed risk level based on discrepancies")
    message: str = Field("Validation completed", description="Summary text")

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "case_id": "case-001",
                "is_valid": False,
                "validation_status": "needs_information",
                "validation_results": [
                    {
                        "field": "expiry_date",
                        "status": "valid",
                        "message": "Document is not expired",
                        "details": {"expiry_date": "2030-12-20"}
                    },
                    {
                        "field": "address",
                        "status": "missing",
                        "message": "Address is required",
                        "details": {}
                    }
                ],
                "missing_information": ["address"],
                "inconsistencies": [],
                "requires_manual_review": False,
                "recommendation": "request_additional_information",
                "risk_level": "low",
                "message": "Validation identified missing required fields"
            }
        }
    }


class RequirementsCheckResponse(BaseModel):
    """Response for KYC document checklist completeness."""

    case_id: str = Field(..., description="Case identifier")
    satisfied: bool = Field(..., description="True if all required document types are provided")
    missing_document_types: List[DocumentType] = Field(default_factory=list)
    provided_document_types: List[DocumentType] = Field(default_factory=list)
    recommendation: ReviewRecommendation = Field(...)
    message: str = Field(...)


class DataComparisonItem(BaseModel):
    """Comparison item for a single attribute."""

    attribute: str = Field(..., description="Attribute name (e.g., full_name, dob)")
    customer_record_value: Any = Field(None)
    document_value: Any = Field(None)
    is_match: bool = Field(...)
    discrepancy_note: Optional[str] = Field(None)


class DataComparisonResponse(BaseModel):
    """Response comparing customer profile with extracted records."""

    case_id: str = Field(...)
    all_matched: bool = Field(...)
    comparison_results: List[DataComparisonItem] = Field(default_factory=list)
    risk_level: RiskLevel = Field(...)
    recommendation: ReviewRecommendation = Field(...)
    message: str = Field(...)


class InconsistencyDetectResponse(BaseModel):
    """Response for cross-document conflict detection."""

    case_id: str = Field(...)
    has_inconsistencies: bool = Field(...)
    inconsistencies: List[str] = Field(default_factory=list)
    risk_level: RiskLevel = Field(...)
    recommendation: ReviewRecommendation = Field(...)
    message: str = Field(...)
