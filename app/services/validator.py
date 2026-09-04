"""Deterministic KYC Validation Worker Service.

This service validates extracted document entities against strict financial compliance rules
and authoritative customer CRM / Dataverse records.
It returns field-level diagnostics, inconsistency detections, and actionable recommendations
for the Microsoft Copilot Studio Supervisor Agent.
"""

from datetime import date
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from app.models.enums import (
    DocumentType,
    FieldValidationStatus,
    ReviewRecommendation,
    RiskLevel,
    ValidationStatus,
)
from app.models.requests import DocumentValidateRequest
from app.models.responses import DocumentValidateResponse, ValidationResultItem
from app.utils.date_utils import calculate_age, is_date_expired, parse_date
from app.utils.logging import get_logger

logger = get_logger(__name__)

# Mandatory fields per document type for verification
MANDATORY_VALIDATION_FIELDS: Dict[DocumentType, List[str]] = {
    DocumentType.PASSPORT: ["full_name", "passport_number", "date_of_birth", "expiry_date"],
    DocumentType.DRIVING_LICENSE: ["full_name", "license_number", "expiry_date"],
    DocumentType.PROOF_OF_ADDRESS: ["full_name", "address", "issue_date"],
    DocumentType.BANK_STATEMENT: ["full_name", "account_number", "issue_date"],
    DocumentType.NATIONAL_ID: ["full_name", "id_number", "date_of_birth"],
    DocumentType.TAX_DOCUMENT: ["full_name", "tax_id", "tax_year"],
    DocumentType.UNKNOWN: ["full_name"],
}


def normalize_name(name: Optional[str]) -> Set[str]:
    """Normalize and tokenize person name string for fuzzy token-set comparison."""
    if not name or not isinstance(name, str):
        return set()
    cleaned = re.sub(r"[^A-Za-z0-9\s]", " ", name.upper())
    tokens = {token for token in cleaned.split() if len(token) > 1}
    return tokens


def check_name_compatibility(extracted_name: Optional[str], customer_name: Optional[str]) -> Tuple[bool, str]:
    """
    Compare extracted name with customer record.
    Returns (is_compatible, explanation).
    Handles swapped first/last names, middle names, and casing.
    """
    if not extracted_name or not customer_name:
        return False, "Missing name string in comparison"

    tokens_extracted = normalize_name(extracted_name)
    tokens_customer = normalize_name(customer_name)

    if not tokens_extracted or not tokens_customer:
        return False, "Unable to extract name tokens"

    # Exact token set match
    if tokens_extracted == tokens_customer:
        return True, "Exact name match"

    # Overlap / Subset match (e.g. Jane Smith vs Jane Eleanor Smith)
    overlap = tokens_extracted.intersection(tokens_customer)
    min_required = min(len(tokens_extracted), len(tokens_customer))

    if len(overlap) >= min_required or (len(overlap) >= 2 and len(tokens_customer) >= 2):
        return True, f"Name match verified with acceptable token overlap ({', '.join(overlap)})"

    return False, f"Name mismatch: '{extracted_name}' differs significantly from customer record '{customer_name}'"


class DocumentValidator:
    """Deterministic validation engine for KYC compliance checks."""

    def validate(self, request: DocumentValidateRequest) -> DocumentValidateResponse:
        case_id = request.case_id
        doc_type = request.document_type
        extracted = request.extracted_fields or {}
        customer = request.customer_record or {}
        ref_date = parse_date(request.reference_date) or date.today()

        logger.info(f"Validating document for case_id={case_id}, doc_type={doc_type.value}")

        validation_results: List[ValidationResultItem] = []
        missing_info: List[str] = []
        inconsistencies: List[str] = []
        requires_manual_review = False
        risk_level = RiskLevel.LOW

        # 1. Check Required / Mandatory Fields
        required_fields = request.required_fields or MANDATORY_VALIDATION_FIELDS.get(doc_type, ["full_name"])
        for field in required_fields:
            val = extracted.get(field)
            if val is None or (isinstance(val, str) and not val.strip()):
                missing_info.append(field)
                validation_results.append(
                    ValidationResultItem(
                        field=field,
                        status=FieldValidationStatus.MISSING,
                        message=f"Mandatory field '{field}' is missing from extracted document data.",
                        details={"required": True},
                    )
                )
            else:
                validation_results.append(
                    ValidationResultItem(
                        field=field,
                        status=FieldValidationStatus.VALID,
                        message=f"Mandatory field '{field}' is present.",
                        details={"value_present": True},
                    )
                )

        # 2. Expiry Date Validation
        expiry_date = extracted.get("expiry_date")
        if expiry_date:
            is_expired, exp_msg = is_date_expired(str(expiry_date), reference_date=ref_date)
            if is_expired:
                inconsistencies.append(f"Document has expired: {exp_msg}")
                requires_manual_review = True
                risk_level = RiskLevel.HIGH
                validation_results.append(
                    ValidationResultItem(
                        field="expiry_date",
                        status=FieldValidationStatus.INVALID,
                        message=exp_msg,
                        details={"is_expired": True, "expiry_date": str(expiry_date)},
                    )
                )
            else:
                validation_results.append(
                    ValidationResultItem(
                        field="expiry_date",
                        status=FieldValidationStatus.VALID,
                        message=exp_msg,
                        details={"is_expired": False, "expiry_date": str(expiry_date)},
                    )
                )

        # 3. Date of Birth & Age Verification
        dob = extracted.get("date_of_birth")
        if dob:
            age = calculate_age(str(dob), reference_date=ref_date)
            if age is None:
                inconsistencies.append("Date of birth is not a valid date format.")
                validation_results.append(
                    ValidationResultItem(
                        field="date_of_birth",
                        status=FieldValidationStatus.INVALID,
                        message="Invalid date format for date of birth.",
                        details={"dob_raw": str(dob)},
                    )
                )
            elif age < 18:
                inconsistencies.append(f"Customer age ({age}) is below minimum legal onboarding requirement (18).")
                requires_manual_review = True
                risk_level = RiskLevel.HIGH
                validation_results.append(
                    ValidationResultItem(
                        field="date_of_birth",
                        status=FieldValidationStatus.INVALID,
                        message=f"Customer is underage (calculated age: {age}).",
                        details={"calculated_age": age, "minimum_required_age": 18},
                    )
                )
            else:
                validation_results.append(
                    ValidationResultItem(
                        field="date_of_birth",
                        status=FieldValidationStatus.VALID,
                        message=f"Customer meets legal age requirement (calculated age: {age}).",
                        details={"calculated_age": age},
                    )
                )

        # 4. Passport / Document ID Format Rules
        passport_num = extracted.get("passport_number")
        if passport_num and doc_type == DocumentType.PASSPORT:
            clean_num = str(passport_num).strip().upper()
            if not re.match(r"^[A-Z0-9]{6,12}$", clean_num):
                inconsistencies.append(f"Passport number '{clean_num}' fails standard format check.")
                requires_manual_review = True
                risk_level = max_risk(risk_level, RiskLevel.MEDIUM)
                validation_results.append(
                    ValidationResultItem(
                        field="passport_number",
                        status=FieldValidationStatus.INVALID,
                        message="Passport number does not match alphanumeric format rules.",
                        details={"passport_number": clean_num},
                    )
                )
            else:
                validation_results.append(
                    ValidationResultItem(
                        field="passport_number",
                        status=FieldValidationStatus.VALID,
                        message="Passport number conforms to standard format.",
                        details={"passport_number": clean_num},
                    )
                )

        # 5. Authoritative Customer Record Cross-Validation
        if customer:
            # Full Name Cross-check
            cust_name = customer.get("full_name") or f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip()
            doc_name = extracted.get("full_name")

            if doc_name and cust_name:
                is_compat, reason = check_name_compatibility(str(doc_name), str(cust_name))
                if not is_compat:
                    inconsistencies.append(reason)
                    requires_manual_review = True
                    risk_level = RiskLevel.HIGH
                    validation_results.append(
                        ValidationResultItem(
                            field="customer_name_match",
                            status=FieldValidationStatus.INCONSISTENT,
                            message=reason,
                            details={"extracted_name": doc_name, "customer_record_name": cust_name},
                        )
                    )
                else:
                    validation_results.append(
                        ValidationResultItem(
                            field="customer_name_match",
                            status=FieldValidationStatus.VALID,
                            message=reason,
                            details={"extracted_name": doc_name, "customer_record_name": cust_name},
                        )
                    )

            # Date of Birth Cross-check
            cust_dob = customer.get("date_of_birth")
            if dob and cust_dob:
                parsed_doc_dob = parse_date(str(dob))
                parsed_cust_dob = parse_date(str(cust_dob))
                if parsed_doc_dob and parsed_cust_dob and parsed_doc_dob != parsed_cust_dob:
                    inconsistency_msg = f"Date of birth mismatch: document states {parsed_doc_dob.isoformat()} but customer profile states {parsed_cust_dob.isoformat()}."
                    inconsistencies.append(inconsistency_msg)
                    requires_manual_review = True
                    risk_level = RiskLevel.HIGH
                    validation_results.append(
                        ValidationResultItem(
                            field="customer_dob_match",
                            status=FieldValidationStatus.INCONSISTENT,
                            message=inconsistency_msg,
                            details={"document_dob": parsed_doc_dob.isoformat(), "customer_dob": parsed_cust_dob.isoformat()},
                        )
                    )

            # Address Cross-check for proof of address
            cust_addr = customer.get("address")
            doc_addr = extracted.get("address")
            if doc_type == DocumentType.PROOF_OF_ADDRESS and doc_addr and cust_addr:
                addr_tokens_doc = set(re.findall(r"\w+", str(doc_addr).upper()))
                addr_tokens_cust = set(re.findall(r"\w+", str(cust_addr).upper()))
                overlap = addr_tokens_doc.intersection(addr_tokens_cust)
                # Significant overlap of street/zip numbers
                if len(overlap) < 2:
                    inconsistencies.append("Proof of address does not sufficiently align with customer profile address.")
                    requires_manual_review = True
                    risk_level = max_risk(risk_level, RiskLevel.MEDIUM)
                    validation_results.append(
                        ValidationResultItem(
                            field="customer_address_match",
                            status=FieldValidationStatus.INCONSISTENT,
                            message="Address tokens do not match customer profile.",
                            details={"document_address": doc_addr, "customer_address": cust_addr},
                        )
                    )
                else:
                    validation_results.append(
                        ValidationResultItem(
                            field="customer_address_match",
                            status=FieldValidationStatus.VALID,
                            message="Proof of address matches customer profile address.",
                            details={"matched_tokens_count": len(overlap)},
                        )
                    )

        # 6. Synthesize Overall Decision & Recommendation
        is_valid = len(missing_info) == 0 and len(inconsistencies) == 0

        if is_valid:
            validation_status = ValidationStatus.VALID
            recommendation = ReviewRecommendation.PROCEED
            summary_message = "All deterministic validation rules passed successfully."
        elif len(inconsistencies) > 0 or requires_manual_review:
            validation_status = ValidationStatus.REQUIRES_REVIEW if requires_manual_review else ValidationStatus.INVALID
            recommendation = ReviewRecommendation.ESCALATE_HUMAN_REVIEW
            summary_message = f"Validation detected discrepancies ({len(inconsistencies)} issues) requiring human review."
        else:
            validation_status = ValidationStatus.NEEDS_INFORMATION
            recommendation = ReviewRecommendation.REQUEST_ADDITIONAL_INFORMATION
            summary_message = f"Validation incomplete: {len(missing_info)} required fields are missing."

        logger.info(
            f"Validation result for case_id={case_id}: status={validation_status.value}, "
            f"is_valid={is_valid}, rec={recommendation.value}, risk={risk_level.value}"
        )

        return DocumentValidateResponse(
            success=True,
            case_id=case_id,
            is_valid=is_valid,
            validation_status=validation_status,
            validation_results=validation_results,
            missing_information=missing_info,
            inconsistencies=inconsistencies,
            requires_manual_review=requires_manual_review,
            recommendation=recommendation,
            risk_level=risk_level,
            message=summary_message,
        )


def max_risk(r1: RiskLevel, r2: RiskLevel) -> RiskLevel:
    """Helper to pick highest risk level."""
    order = {RiskLevel.LOW: 1, RiskLevel.MEDIUM: 2, RiskLevel.HIGH: 3}
    return r1 if order[r1] >= order[r2] else r2


# Singleton instance
default_validator = DocumentValidator()
