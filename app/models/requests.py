"""Pydantic request schemas for all KYC backend endpoints."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.enums import DocumentType


class DocumentClassifyRequest(BaseModel):
    """Payload for document classification."""

    document_id: str = Field(..., description="Unique document tracking identifier")
    filename: Optional[str] = Field(None, description="Original filename (used for heuristic hints)")
    content_type: Optional[str] = Field(None, description="MIME type (e.g. application/pdf, image/jpeg)")
    document_text: Optional[str] = Field(None, description="Extracted raw text or OCR content")
    file_path: Optional[str] = Field(None, description="Local or cloud storage path reference")
    file_reference: Optional[str] = Field(None, description="SharePoint/Blob storage URL or ID")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary document metadata")

    model_config = {
        "json_schema_extra": {
            "example": {
                "document_id": "doc-001",
                "filename": "passport_scan_customer.pdf",
                "content_type": "application/pdf",
                "document_text": "PASSPORT / PASSEPORT\nSurname: DOE\nGiven Names: JANE\nNationality: USA\nPassport No: P12345678\nDate of Birth: 15 JAN 1990\nExpiry Date: 20 Dec 2030",
                "file_reference": "https://sharepoint.example.com/sites/kyc/doc-001.pdf"
            }
        }
    }


class DocumentExtractRequest(BaseModel):
    """Payload for structured field extraction."""

    document_id: str = Field(..., description="Unique document tracking identifier")
    document_type: DocumentType = Field(..., description="Identified document classification")
    document_text: Optional[str] = Field(None, description="Raw OCR or text content to extract from")
    file_reference: Optional[str] = Field(None, description="SharePoint/Blob storage URL or ID")
    extraction_config: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Optional config parameters (e.g., target fields, strict mode)",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "document_id": "doc-001",
                "document_type": "passport",
                "document_text": "PASSPORT / PASSEPORT\nSurname: DOE\nGiven Names: JANE\nNationality: USA\nPassport No: P12345678\nDate of Birth: 1990-01-15\nExpiry Date: 2030-12-20",
                "extraction_config": {}
            }
        }
    }


class DocumentValidateRequest(BaseModel):
    """Payload for deterministic validation."""

    case_id: str = Field(..., description="Case identifier tracking the onboarding case")
    customer_id: Optional[str] = Field(None, description="Customer identifier in Dataverse/CRM")
    document_type: DocumentType = Field(..., description="Classified document type being validated")
    extracted_fields: Dict[str, Any] = Field(..., description="Key-value pairs extracted from document")
    customer_record: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Authoritative customer CRM profile to cross-validate against",
    )
    required_fields: Optional[List[str]] = Field(
        default=None,
        description="Explicit list of mandatory fields to check. If omitted, defaults by document_type",
    )
    reference_date: Optional[str] = Field(
        default=None,
        description="ISO date (YYYY-MM-DD) to treat as 'today' for expiry/age checks (useful for testing/backdating)",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "case_id": "case-001",
                "customer_id": "cust-9001",
                "document_type": "passport",
                "extracted_fields": {
                    "full_name": "Jane Doe",
                    "date_of_birth": "1990-01-15",
                    "nationality": "USA",
                    "passport_number": "P12345678",
                    "expiry_date": "2030-12-20"
                },
                "customer_record": {
                    "full_name": "Jane Doe",
                    "date_of_birth": "1990-01-15",
                    "country_of_residence": "USA"
                }
            }
        }
    }


class RequirementsCheckRequest(BaseModel):
    """Payload for checking if a KYC case fulfills mandatory document requirements."""

    case_id: str = Field(..., description="Case tracking ID")
    customer_tier: Optional[str] = Field("individual_standard", description="Customer profile / risk tier")
    provided_document_types: List[DocumentType] = Field(..., description="List of document types already collected")
    required_document_types: Optional[List[DocumentType]] = Field(
        default=None,
        description="Optional custom requirement checklist. Defaults to standard KYC policy.",
    )


class DataComparisonRequest(BaseModel):
    """Payload for comparing customer profile record against multi-document extractions."""

    case_id: str = Field(..., description="Case tracking ID")
    customer_record: Dict[str, Any] = Field(..., description="Authoritative customer record from Dataverse")
    document_extractions: Dict[str, Dict[str, Any]] = Field(
        ...,
        description="Map of document_id or doc_type to extracted fields dictionary",
    )


class InconsistencyDetectRequest(BaseModel):
    """Payload for detecting cross-document discrepancies in a case."""

    case_id: str = Field(..., description="Case tracking ID")
    documents_data: List[Dict[str, Any]] = Field(
        ...,
        description="List of document objects with document_type and extracted_fields",
    )
    customer_record: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional customer profile record",
    )
