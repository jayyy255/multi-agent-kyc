"""Standardized error models and custom exceptions."""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """Structured details for validation or field-specific errors."""

    field: Optional[str] = Field(None, description="Field associated with the error, if applicable")
    issue: Optional[str] = Field(None, description="Specific issue description")


class ErrorResponse(BaseModel):
    """Uniform error response envelope."""

    success: bool = Field(False, description="Always false for error responses")
    error_code: str = Field(..., description="Machine-readable error identifier")
    message: str = Field(..., description="Human-readable error explanation")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional context or diagnostics")

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": False,
                "error_code": "INVALID_DOCUMENT_TYPE",
                "message": "The supplied document type is not supported",
                "details": {
                    "provided_type": "invalid_doc",
                    "supported_types": ["passport", "national_id", "driving_license", "proof_of_address", "bank_statement", "tax_document"]
                }
            }
        }
    }


class KYCServiceException(Exception):
    """Base exception for application-level KYC errors."""

    def __init__(
        self,
        error_code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
