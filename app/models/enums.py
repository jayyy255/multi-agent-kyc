"""Enumerations used across KYC API requests, responses, and validation rules."""

from enum import Enum


class DocumentType(str, Enum):
    """Supported document classifications."""

    PASSPORT = "passport"
    NATIONAL_ID = "national_id"
    DRIVING_LICENSE = "driving_license"
    PROOF_OF_ADDRESS = "proof_of_address"
    BANK_STATEMENT = "bank_statement"
    TAX_DOCUMENT = "tax_document"
    UNKNOWN = "unknown"


class ValidationStatus(str, Enum):
    """Overall status of validation execution."""

    VALID = "valid"
    INVALID = "invalid"
    NEEDS_INFORMATION = "needs_information"
    REQUIRES_REVIEW = "requires_review"


class FieldValidationStatus(str, Enum):
    """Status for individual field checks."""

    VALID = "valid"
    INVALID = "invalid"
    MISSING = "missing"
    INCONSISTENT = "inconsistent"
    UNVERIFIED = "unverified"


class RiskLevel(str, Enum):
    """Assessed risk level for detected anomalies."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ReviewRecommendation(str, Enum):
    """Actionable recommendation for the Supervisor Agent to act upon."""

    PROCEED = "proceed"
    REQUEST_ADDITIONAL_INFORMATION = "request_additional_information"
    ESCALATE_HUMAN_REVIEW = "escalate_human_review"
    REJECT = "reject"
