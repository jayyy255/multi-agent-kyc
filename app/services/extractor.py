"""Document Field Extraction Worker Service.

This service extracts structured key-value entities from raw document texts based on
document type patterns (regex and entity anchors).
Designed with a modular architecture to support OCR/LLM extractor plugins.
"""

from abc import ABC, abstractmethod
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from app.models.enums import DocumentType
from app.models.requests import DocumentExtractRequest
from app.models.responses import DocumentExtractResponse
from app.utils.date_utils import parse_date
from app.utils.logging import get_logger

logger = get_logger(__name__)

# Expected standard fields per document type
EXPECTED_FIELDS_BY_TYPE: Dict[DocumentType, List[str]] = {
    DocumentType.PASSPORT: [
        "full_name",
        "date_of_birth",
        "nationality",
        "passport_number",
        "expiry_date",
        "issue_date",
    ],
    DocumentType.DRIVING_LICENSE: [
        "full_name",
        "license_number",
        "date_of_birth",
        "expiry_date",
        "address",
    ],
    DocumentType.PROOF_OF_ADDRESS: [
        "full_name",
        "address",
        "issue_date",
        "document_reference",
    ],
    DocumentType.BANK_STATEMENT: [
        "full_name",
        "account_number",
        "bank_name",
        "issue_date",
        "address",
    ],
    DocumentType.NATIONAL_ID: [
        "full_name",
        "id_number",
        "date_of_birth",
        "address",
    ],
    DocumentType.TAX_DOCUMENT: [
        "full_name",
        "tax_id",
        "tax_year",
    ],
}

# Critical fields that trigger manual review if missing
CRITICAL_FIELDS_BY_TYPE: Dict[DocumentType, List[str]] = {
    DocumentType.PASSPORT: ["full_name", "passport_number", "expiry_date"],
    DocumentType.DRIVING_LICENSE: ["full_name", "license_number"],
    DocumentType.PROOF_OF_ADDRESS: ["full_name", "address"],
    DocumentType.BANK_STATEMENT: ["full_name", "account_number"],
    DocumentType.NATIONAL_ID: ["full_name", "id_number"],
    DocumentType.TAX_DOCUMENT: ["full_name", "tax_id"],
}


class BaseExtractor(ABC):
    """Abstract base extractor class."""

    @abstractmethod
    def extract(self, request: DocumentExtractRequest) -> DocumentExtractResponse:
        """Extract structured fields from document text."""
        pass


class RegexDocumentExtractor(BaseExtractor):
    """Rule-based regex & entity anchor extractor."""

    def extract(self, request: DocumentExtractRequest) -> DocumentExtractResponse:
        doc_type = request.document_type
        text = request.document_text or ""
        doc_id = request.document_id

        logger.info(f"Extracting fields for doc_id={doc_id}, doc_type={doc_type.value}")

        if not text.strip():
            logger.warning(f"Empty document text for doc_id={doc_id}")
            expected = EXPECTED_FIELDS_BY_TYPE.get(doc_type, [])
            return DocumentExtractResponse(
                success=True,
                document_id=doc_id,
                document_type=doc_type,
                extracted_fields={},
                missing_fields=expected,
                confidence=0.0,
                requires_manual_review=True,
                warnings=["Document text was empty; no fields could be extracted."],
                message="Extraction incomplete: no text provided.",
            )

        extracted_fields: Dict[str, Any] = {}
        warnings: List[str] = []

        # Dispatch extraction logic by document type
        if doc_type == DocumentType.PASSPORT:
            extracted_fields = self._extract_passport(text)
        elif doc_type == DocumentType.DRIVING_LICENSE:
            extracted_fields = self._extract_driving_license(text)
        elif doc_type == DocumentType.PROOF_OF_ADDRESS:
            extracted_fields = self._extract_proof_of_address(text)
        elif doc_type == DocumentType.BANK_STATEMENT:
            extracted_fields = self._extract_bank_statement(text)
        elif doc_type == DocumentType.NATIONAL_ID:
            extracted_fields = self._extract_national_id(text)
        elif doc_type == DocumentType.TAX_DOCUMENT:
            extracted_fields = self._extract_tax_document(text)
        else:
            extracted_fields = self._extract_generic(text)

        # Standardize dates to ISO format YYYY-MM-DD
        for date_key in ["date_of_birth", "expiry_date", "issue_date", "statement_date"]:
            if date_key in extracted_fields and extracted_fields[date_key]:
                parsed = parse_date(str(extracted_fields[date_key]))
                if parsed:
                    extracted_fields[date_key] = parsed.isoformat()
                else:
                    warnings.append(f"Field '{date_key}' has non-standard date value: {extracted_fields[date_key]}")

        # Check expected and missing fields
        expected = EXPECTED_FIELDS_BY_TYPE.get(doc_type, list(extracted_fields.keys()))
        missing = [f for f in expected if f not in extracted_fields or not extracted_fields[f]]

        # Calculate confidence score
        if expected:
            ratio_extracted = len([f for f in expected if f in extracted_fields]) / len(expected)
            confidence = round(min(0.96, max(0.10, ratio_extracted * 0.95)), 2)
        else:
            confidence = 0.50 if extracted_fields else 0.0

        # Determine if critical fields are missing
        critical = CRITICAL_FIELDS_BY_TYPE.get(doc_type, [])
        missing_critical = [f for f in critical if f in missing]
        requires_manual_review = bool(missing_critical) or confidence < 0.60

        if missing_critical:
            warnings.append(f"Critical fields missing: {', '.join(missing_critical)}")

        logger.info(
            f"Extraction completed for doc_id={doc_id}: {len(extracted_fields)} fields, "
            f"{len(missing)} missing, confidence={confidence}, manual_review={requires_manual_review}"
        )

        return DocumentExtractResponse(
            success=True,
            document_id=doc_id,
            document_type=doc_type,
            extracted_fields=extracted_fields,
            missing_fields=missing,
            confidence=confidence,
            requires_manual_review=requires_manual_review,
            warnings=warnings,
            message="Fields extracted successfully" if not missing_critical else "Partial extraction: critical fields missing",
        )

    # ----------------------------------------------------
    # Type-Specific Parsers
    # ----------------------------------------------------

    def _extract_passport(self, text: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}

        # Passport Number
        p_num = re.search(r"(?:Passport\s*No\.?|P[0-9]{8}|Passport\s*Number)[:\s]*([A-Z0-9]{7,10})", text, re.I)
        if p_num:
            fields["passport_number"] = p_num.group(1).strip()
        else:
            # Fallback regex for standard P+numbers
            p_alt = re.search(r"\b([A-Z][0-9]{7,8})\b", text)
            if p_alt:
                fields["passport_number"] = p_alt.group(1).strip()

        # Surname / Given Names / Full Name
        surname = re.search(r"(?:Surname|Nom|Last\s*Name)[:\s]*([A-Za-z\s'-]+)", text, re.I)
        given_names = re.search(r"(?:Given\s*Names?|Prénoms|First\s*Name)[:\s]*([A-Za-z\s'-]+)", text, re.I)
        full_name_match = re.search(r"(?:Full\s*Name|Name)[:\s]*([A-Za-z\s'-]+)", text, re.I)

        s_val = surname.group(1).strip() if surname else ""
        g_val = given_names.group(1).strip() if given_names else ""

        if s_val and g_val:
            fields["surname"] = s_val
            fields["given_names"] = g_val
            fields["full_name"] = f"{g_val} {s_val}"
        elif full_name_match:
            fields["full_name"] = full_name_match.group(1).strip()

        # Date of Birth
        dob = re.search(r"(?:Date\s*of\s*Birth|DOB|Date\s*de\s*naissance)[:\s]*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})", text, re.I)
        if dob:
            fields["date_of_birth"] = dob.group(1).strip()

        # Expiry Date
        exp = re.search(r"(?:Date\s*of\s*Expiry|Expiry\s*Date|EXP|Date\s*d'expiration)[:\s]*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})", text, re.I)
        if exp:
            fields["expiry_date"] = exp.group(1).strip()

        # Issue Date
        iss = re.search(r"(?:Date\s*of\s*Issue|Issue\s*Date|Date\s*de\s*délivrance)[:\s]*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})", text, re.I)
        if iss:
            fields["issue_date"] = iss.group(1).strip()

        # Nationality
        nat = re.search(r"(?:Nationality|Nationalité)[:\s]*([A-Za-z\s]{2,20})", text, re.I)
        if nat:
            fields["nationality"] = nat.group(1).strip()

        # MRZ line extraction if present
        mrz = re.search(r"(P<[A-Z0-9<]{39,44})", text)
        if mrz:
            fields["mrz_line1"] = mrz.group(1).strip()

        return fields

    def _extract_driving_license(self, text: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}

        dl = re.search(r"(?:DL\s*No\.?|Licen[sc]e\s*No\.?|DLN)[:\s]*([A-Z0-9-]{6,15})", text, re.I)
        if dl:
            fields["license_number"] = dl.group(1).strip()

        fn = re.search(r"(?:FN|First\s*Name|Given\s*Name)[:\s]*([A-Za-z\s'-]+)", text, re.I)
        ln = re.search(r"(?:LN|Last\s*Name|Surname)[:\s]*([A-Za-z\s'-]+)", text, re.I)
        name = re.search(r"(?:Name|Full\s*Name)[:\s]*([A-Za-z\s'-]+)", text, re.I)

        if fn and ln:
            fields["full_name"] = f"{fn.group(1).strip()} {ln.group(1).strip()}"
        elif name:
            fields["full_name"] = name.group(1).strip()

        dob = re.search(r"(?:DOB|Date\s*of\s*Birth)[:\s]*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})", text, re.I)
        if dob:
            fields["date_of_birth"] = dob.group(1).strip()

        exp = re.search(r"(?:EXP|Expiry\s*Date|Expires)[:\s]*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})", text, re.I)
        if exp:
            fields["expiry_date"] = exp.group(1).strip()

        addr = re.search(r"(?:ADDR|Address)[:\s]*([A-Za-z0-9\s,.-]+(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\s+[0-9]{5}(?:-[0-9]{4})?)", text, re.I)
        if addr:
            fields["address"] = addr.group(1).strip()
        else:
            # General address anchor
            addr_alt = re.search(r"(?:ADDR|Address)[:\s]*([A-Za-z0-9\s,.-]+(?:\n[A-Za-z0-9\s,.-]+)?)", text, re.I)
            if addr_alt:
                fields["address"] = " ".join(addr_alt.group(1).split())

        return fields

    def _extract_proof_of_address(self, text: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}

        # Name under Service Address or Customer
        serv_addr = re.search(r"Service\s+Address:\s*\n([A-Za-z\s'-]+)\n([0-9A-Za-z\s,.-]+(?:\n[A-Za-z\s,.-]+[0-9]{5})?)", text, re.I)
        if serv_addr:
            fields["full_name"] = serv_addr.group(1).strip()
            fields["address"] = " ".join(serv_addr.group(2).split())
        else:
            name = re.search(r"(?:Customer\s*Name|Account\s*Holder|Bill\s*To|Name)[:\s]*([A-Za-z\s'-]+)", text, re.I)
            if name:
                fields["full_name"] = name.group(1).strip()

            addr = re.search(r"(?:Service\s*Address|Billing\s*Address|Address)[:\s]*([A-Za-z0-9\s,.-]+)", text, re.I)
            if addr:
                fields["address"] = addr.group(1).strip()

        # Account Number / Ref
        acc = re.search(r"(?:Account\s*(?:Number|No\.?)|Invoice\s*(?:Number|No\.?)|Ref)[:\s]*([A-Z0-9-]+)", text, re.I)
        if acc:
            fields["document_reference"] = acc.group(1).strip()

        # Date
        stmt_date = re.search(r"(?:Statement\s*Date|Bill\s*Date|Date\s*of\s*Issue|Date)[:\s]*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})", text, re.I)
        if stmt_date:
            fields["issue_date"] = stmt_date.group(1).strip()

        # Provider
        first_line = text.strip().split("\n")[0] if text.strip() else ""
        if any(keyword in first_line.upper() for keyword in ["ELECTRIC", "GAS", "UTILITY", "WATER", "ENERGY", "TELECOM"]):
            fields["provider_name"] = first_line.strip()

        return fields

    def _extract_bank_statement(self, text: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}

        holder = re.search(r"(?:Account\s*Holder|Customer\s*Name|Name)[:\s]*([A-Za-z\s'-]+)", text, re.I)
        if holder:
            fields["full_name"] = holder.group(1).strip()

        acc = re.search(r"(?:Account\s*(?:Number|No\.?))[:\s]*([0-9-]+)", text, re.I)
        if acc:
            fields["account_number"] = acc.group(1).strip()

        date_m = re.search(r"(?:Issue\s*Date|Statement\s*Date|Date)[:\s]*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})", text, re.I)
        if date_m:
            fields["issue_date"] = date_m.group(1).strip()

        first_line = text.strip().split("\n")[0] if text.strip() else ""
        if "BANK" in first_line.upper():
            fields["bank_name"] = first_line.strip()

        bal = re.search(r"(?:Closing\s*Balance|Ending\s*Balance)[:\s]*([$€£]?[0-9,]+(?:\.[0-9]{2})?)", text, re.I)
        if bal:
            fields["closing_balance"] = bal.group(1).strip()

        return fields

    def _extract_national_id(self, text: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}

        id_m = re.search(r"(?:National\s*ID|Identity\s*Number|ID\s*No\.?|UID)[:\s]*([A-Z0-9-]+)", text, re.I)
        if id_m:
            fields["id_number"] = id_m.group(1).strip()

        name = re.search(r"(?:Name|Full\s*Name)[:\s]*([A-Za-z\s'-]+)", text, re.I)
        if name:
            fields["full_name"] = name.group(1).strip()

        dob = re.search(r"(?:DOB|Date\s*of\s*Birth)[:\s]*([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})", text, re.I)
        if dob:
            fields["date_of_birth"] = dob.group(1).strip()

        return fields

    def _extract_tax_document(self, text: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}

        tax_id = re.search(r"(?:SSN|Tax\s*ID|EIN|ITIN|PAN)[:\s]*([A-Z0-9-]{9,11})", text, re.I)
        if tax_id:
            fields["tax_id"] = tax_id.group(1).strip()

        name = re.search(r"(?:Taxpayer\s*Name|Name)[:\s]*([A-Za-z\s'-]+)", text, re.I)
        if name:
            fields["full_name"] = name.group(1).strip()

        year = re.search(r"(?:Tax\s*Year|Year)[:\s]*([12][0-9]{3})", text, re.I)
        if year:
            fields["tax_year"] = year.group(1).strip()

        return fields

    def _extract_generic(self, text: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}
        name = re.search(r"(?:Name|Full\s*Name)[:\s]*([A-Za-z\s'-]+)", text, re.I)
        if name:
            fields["full_name"] = name.group(1).strip()
        return fields


# Singleton instance
default_extractor = RegexDocumentExtractor()
