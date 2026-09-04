"""Document Classification Worker Service.

This service identifies document types (passport, driving_license, proof_of_address, etc.)
using structured heuristics, keyword frequency, and file metadata.
Designed with an abstract base class to allow seamless integration of ML/LLM classifiers.
"""

from abc import ABC, abstractmethod
import re
from typing import Any, Dict, List, Optional, Tuple

from app.models.enums import DocumentType
from app.models.requests import DocumentClassifyRequest
from app.models.responses import DocumentClassifyResponse
from app.utils.logging import get_logger

logger = get_logger(__name__)

# Keywords associated with each document type
DOCUMENT_KEYWORD_PATTERNS: Dict[DocumentType, List[re.Pattern]] = {
    DocumentType.PASSPORT: [
        re.compile(r"\bPASSPORT\b", re.IGNORECASE),
        re.compile(r"\bPASSEPORT\b", re.IGNORECASE),
        re.compile(r"\bREPUBLIC\b", re.IGNORECASE),
        re.compile(r"\bSURNAME\b", re.IGNORECASE),
        re.compile(r"\bGIVEN\s+NAMES?\b", re.IGNORECASE),
        re.compile(r"\bPASSPORT\s+NO\b", re.IGNORECASE),
        re.compile(r"P<[A-Z]{3}", re.IGNORECASE),  # MRZ format header
    ],
    DocumentType.DRIVING_LICENSE: [
        re.compile(r"\bDRIVER\s*LICEN[SC]E\b", re.IGNORECASE),
        re.compile(r"\bDRIVING\s*LICEN[SC]E\b", re.IGNORECASE),
        re.compile(r"\bDL\s*NO\b", re.IGNORECASE),
        re.compile(r"\bPERMIT\b", re.IGNORECASE),
        re.compile(r"\bCLASS\s+[A-Z0-9]\b", re.IGNORECASE),
        re.compile(r"\bMOTOR\s+VEHICLE\b", re.IGNORECASE),
        re.compile(r"\bDMV\b", re.IGNORECASE),
    ],
    DocumentType.NATIONAL_ID: [
        re.compile(r"\bNATIONAL\s+ID\b", re.IGNORECASE),
        re.compile(r"\bIDENTITY\s+CARD\b", re.IGNORECASE),
        re.compile(r"\bCITIZEN\s+CARD\b", re.IGNORECASE),
        re.compile(r"\bUNIQUE\s+IDENTIFICATION\b", re.IGNORECASE),
        re.compile(r"\bAADHAAR\b", re.IGNORECASE),
        re.compile(r"\bELECTOR\s+PHOTO\b", re.IGNORECASE),
    ],
    DocumentType.PROOF_OF_ADDRESS: [
        re.compile(r"\bUTILITY\s+BILL\b", re.IGNORECASE),
        re.compile(r"\bSERVICE\s+ADDRESS\b", re.IGNORECASE),
        re.compile(r"\bELECTRIC\b", re.IGNORECASE),
        re.compile(r"\bGAS\s+UTILITY\b", re.IGNORECASE),
        re.compile(r"\bWATER\s+BILL\b", re.IGNORECASE),
        re.compile(r"\bBILLING\s+STATEMENT\b", re.IGNORECASE),
        re.compile(r"\bRESIDENTIAL\s+ADDRESS\b", re.IGNORECASE),
        re.compile(r"\bMUNICIPAL\b", re.IGNORECASE),
    ],
    DocumentType.BANK_STATEMENT: [
        re.compile(r"\bBANK\b", re.IGNORECASE),
        re.compile(r"\bACCOUNT\s+STATEMENT\b", re.IGNORECASE),
        re.compile(r"\bCLOSING\s+BALANCE\b", re.IGNORECASE),
        re.compile(r"\bOPENING\s+BALANCE\b", re.IGNORECASE),
        re.compile(r"\bTRANSACTION\s+HISTORY\b", re.IGNORECASE),
        re.compile(r"\bCHECKING\s+ACCOUNT\b", re.IGNORECASE),
        re.compile(r"\bSAVINGS\s+ACCOUNT\b", re.IGNORECASE),
    ],
    DocumentType.TAX_DOCUMENT: [
        re.compile(r"\bINTERNAL\s+REVENUE\b", re.IGNORECASE),
        re.compile(r"\bFORM\s+1040\b", re.IGNORECASE),
        re.compile(r"\bW-?2\b", re.IGNORECASE),
        re.compile(r"\bTAX\s+RETURN\b", re.IGNORECASE),
        re.compile(r"\bINCOME\s+TAX\b", re.IGNORECASE),
        re.compile(r"\bTAX\s+YEAR\b", re.IGNORECASE),
        re.compile(r"\bASSESSMENT\s+YEAR\b", re.IGNORECASE),
    ],
}

# Filename keyword mappings
FILENAME_HINTS: Dict[DocumentType, List[str]] = {
    DocumentType.PASSPORT: ["passport", "pass_", "ppt_"],
    DocumentType.DRIVING_LICENSE: ["license", "licence", "dl_", "driving"],
    DocumentType.NATIONAL_ID: ["national_id", "id_card", "aadhaar", "nid_"],
    DocumentType.PROOF_OF_ADDRESS: ["utility", "bill", "electricity", "address_proof", "water_bill", "gas_bill"],
    DocumentType.BANK_STATEMENT: ["bank", "statement", "account_stmt", "bank_statement"],
    DocumentType.TAX_DOCUMENT: ["tax", "1040", "w2", "itr", "tax_return"],
}


class BaseClassifier(ABC):
    """Abstract base classifier class for pluggable architecture."""

    @abstractmethod
    def classify(self, request: DocumentClassifyRequest) -> DocumentClassifyResponse:
        """Classify document and return structured result."""
        pass


class RuleBasedDocumentClassifier(BaseClassifier):
    """
    Deterministic rule-based & heuristic classifier.
    Combines text regex pattern matches, keyword densities, and filename metadata.
    """

    def __init__(self, confidence_threshold: float = 0.65):
        self.confidence_threshold = confidence_threshold

    def classify(self, request: DocumentClassifyRequest) -> DocumentClassifyResponse:
        logger.info(f"Classifying document id={request.document_id} filename={request.filename}")

        matched_keywords: Dict[str, List[str]] = {}
        scores: Dict[DocumentType, float] = {dtype: 0.0 for dtype in DOCUMENT_KEYWORD_PATTERNS}

        # 1. Evaluate Document Text Content
        text = request.document_text or ""
        if text:
            for dtype, patterns in DOCUMENT_KEYWORD_PATTERNS.items():
                matches = []
                for pattern in patterns:
                    found = pattern.findall(text)
                    if found:
                        matches.extend(found)
                if matches:
                    matched_keywords[dtype.value] = list(set([m if isinstance(m, str) else m[0] for m in matches]))
                    # Score based on unique matched patterns (up to 0.80) + bonus for volume
                    unique_pattern_hits = len(matched_keywords[dtype.value])
                    scores[dtype] += min(0.80, (unique_pattern_hits / len(patterns)) * 0.90 + 0.15)

        # 2. Evaluate Filename Cues
        filename = (request.filename or "").lower()
        if filename:
            for dtype, hints in FILENAME_HINTS.items():
                for hint in hints:
                    if hint in filename:
                        scores[dtype] += 0.20
                        if dtype.value not in matched_keywords:
                            matched_keywords[dtype.value] = []
                        matched_keywords[dtype.value].append(f"filename_hint:{hint}")
                        break

        # 3. Determine best scoring candidate
        if not scores or max(scores.values()) == 0.0:
            logger.warning(f"No matching features found for document id={request.document_id}")
            return DocumentClassifyResponse(
                success=True,
                document_id=request.document_id,
                document_type=DocumentType.UNKNOWN,
                confidence=0.0,
                extracted_metadata={"raw_length": len(text), "has_filename": bool(filename)},
                requires_manual_review=True,
                warnings=["Document type could not be determined automatically"],
                message="Unable to determine document type. Manual classification recommended.",
            )

        best_type, best_score = max(scores.items(), key=lambda item: item[1])
        # Cap confidence between 0.0 and 0.98 (no 100% false certainty)
        normalized_confidence = round(min(0.98, max(0.10, best_score)), 2)

        requires_review = normalized_confidence < self.confidence_threshold
        warnings = []
        if requires_review:
            warnings.append(
                f"Low classification confidence ({normalized_confidence:.2f} < {self.confidence_threshold:.2f})"
            )

        metadata = {
            "matched_keywords": matched_keywords.get(best_type.value, []),
            "all_scores": {k.value: round(v, 2) for k, v in scores.items() if v > 0},
            "content_type": request.content_type,
            "filename": request.filename,
        }

        logger.info(
            f"Classification complete: id={request.document_id}, type={best_type.value}, "
            f"confidence={normalized_confidence}, manual_review={requires_review}"
        )

        return DocumentClassifyResponse(
            success=True,
            document_id=request.document_id,
            document_type=best_type,
            confidence=normalized_confidence,
            extracted_metadata=metadata,
            requires_manual_review=requires_review,
            warnings=warnings,
            message=f"Document classified as {best_type.value} with confidence {normalized_confidence:.2f}",
        )


# Singleton instance for route injection
default_classifier = RuleBasedDocumentClassifier()
