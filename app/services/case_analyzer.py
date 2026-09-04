"""Case Analyzer Worker Services.

Optional future-ready endpoints for case-level reasoning:
- Requirements checklist checking
- Customer profile cross-comparisons
- Cross-document inconsistency detection
- Human review summary generation
"""

from typing import Any, Dict, List, Optional
from app.models.enums import DocumentType, ReviewRecommendation, RiskLevel
from app.models.requests import (
    DataComparisonRequest,
    InconsistencyDetectRequest,
    RequirementsCheckRequest,
)
from app.models.responses import (
    DataComparisonItem,
    DataComparisonResponse,
    InconsistencyDetectResponse,
    RequirementsCheckResponse,
)
from app.services.validator import check_name_compatibility, normalize_name
from app.utils.logging import get_logger

logger = get_logger(__name__)

STANDARD_REQUIRED_DOCS = [
    DocumentType.PASSPORT,  # Or Driving License / National ID
    DocumentType.PROOF_OF_ADDRESS,
]


class CaseAnalyzer:
    """Helper worker for multi-document and case-level operations."""

    def check_requirements(self, request: RequirementsCheckRequest) -> RequirementsCheckResponse:
        provided = set(request.provided_document_types)
        required = request.required_document_types or STANDARD_REQUIRED_DOCS

        # Check identity doc presence (Passport OR Driving License OR National ID)
        has_id = any(d in provided for d in [DocumentType.PASSPORT, DocumentType.DRIVING_LICENSE, DocumentType.NATIONAL_ID])
        has_address = DocumentType.PROOF_OF_ADDRESS in provided or DocumentType.BANK_STATEMENT in provided

        missing: List[DocumentType] = []
        if not has_id:
            missing.append(DocumentType.PASSPORT)
        if not has_address:
            missing.append(DocumentType.PROOF_OF_ADDRESS)

        satisfied = len(missing) == 0
        recommendation = ReviewRecommendation.PROCEED if satisfied else ReviewRecommendation.REQUEST_ADDITIONAL_INFORMATION

        return RequirementsCheckResponse(
            case_id=request.case_id,
            satisfied=satisfied,
            missing_document_types=missing,
            provided_document_types=request.provided_document_types,
            recommendation=recommendation,
            message="Document requirements satisfied." if satisfied else f"Missing required document types: {[m.value for m in missing]}",
        )

    def compare_customer_data(self, request: DataComparisonRequest) -> DataComparisonResponse:
        case_id = request.case_id
        customer = request.customer_record
        docs = request.document_extractions

        comparison_results: List[DataComparisonItem] = []
        all_matched = True
        risk_level = RiskLevel.LOW

        cust_name = customer.get("full_name") or f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip()

        # Check names across all documents
        for doc_key, fields in docs.items():
            doc_name = fields.get("full_name")
            if doc_name and cust_name:
                is_compat, note = check_name_compatibility(str(doc_name), str(cust_name))
                comparison_results.append(
                    DataComparisonItem(
                        attribute=f"{doc_key}.full_name",
                        customer_record_value=cust_name,
                        document_value=doc_name,
                        is_match=is_compat,
                        discrepancy_note=note if not is_compat else None,
                    )
                )
                if not is_compat:
                    all_matched = False
                    risk_level = RiskLevel.HIGH

        recommendation = ReviewRecommendation.PROCEED if all_matched else ReviewRecommendation.ESCALATE_HUMAN_REVIEW
        return DataComparisonResponse(
            case_id=case_id,
            all_matched=all_matched,
            comparison_results=comparison_results,
            risk_level=risk_level,
            recommendation=recommendation,
            message="All customer data attributes match documents." if all_matched else "Discrepancies identified during data comparison.",
        )

    def detect_inconsistencies(self, request: InconsistencyDetectRequest) -> InconsistencyDetectResponse:
        case_id = request.case_id
        docs = request.documents_data
        customer = request.customer_record or {}

        inconsistencies: List[str] = []

        # Extract names across documents
        names_found: Dict[str, str] = {}
        dobs_found: Dict[str, str] = {}

        for doc in docs:
            doc_type = doc.get("document_type", "unknown")
            fields = doc.get("extracted_fields", {})

            if "full_name" in fields and fields["full_name"]:
                names_found[doc_type] = str(fields["full_name"])
            if "date_of_birth" in fields and fields["date_of_birth"]:
                dobs_found[doc_type] = str(fields["date_of_birth"])

        # Compare names between documents
        doc_types = list(names_found.keys())
        for i in range(len(doc_types)):
            for j in range(i + 1, len(doc_types)):
                t1, t2 = doc_types[i], doc_types[j]
                compat, reason = check_name_compatibility(names_found[t1], names_found[t2])
                if not compat:
                    inconsistencies.append(f"Name conflict between {t1} ('{names_found[t1]}') and {t2} ('{names_found[t2]}').")

        # Compare DOBs between documents
        dob_types = list(dobs_found.keys())
        for i in range(len(dob_types)):
            for j in range(i + 1, len(dob_types)):
                t1, t2 = dob_types[i], dob_types[j]
                if dobs_found[t1] != dobs_found[t2]:
                    inconsistencies.append(f"DOB conflict between {t1} ('{dobs_found[t1]}') and {t2} ('{dobs_found[t2]}').")

        has_inconsistencies = len(inconsistencies) > 0
        risk_level = RiskLevel.HIGH if has_inconsistencies else RiskLevel.LOW
        recommendation = ReviewRecommendation.ESCALATE_HUMAN_REVIEW if has_inconsistencies else ReviewRecommendation.PROCEED

        return InconsistencyDetectResponse(
            case_id=case_id,
            has_inconsistencies=has_inconsistencies,
            inconsistencies=inconsistencies,
            risk_level=risk_level,
            recommendation=recommendation,
            message="No cross-document inconsistencies detected." if not has_inconsistencies else f"Found {len(inconsistencies)} cross-document discrepancies.",
        )


default_case_analyzer = CaseAnalyzer()
