"""Structured logging utility with PII sanitization for financial compliance."""

import logging
import re
import sys
from typing import Any, Dict
from app.config import get_settings

# Patterns to mask sensitive information
SENSITIVE_PATTERNS = [
    (re.compile(r"\b[A-Z][0-9]{7,8}\b", re.IGNORECASE), "[REDACTED_DOC_NUM]"),  # Passport/ID format
    (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "[REDACTED_SSN]"),  # SSN
    (re.compile(r"\b[0-9]{10,12}\b"), "[REDACTED_ACC_NUM]"),  # Bank account / Tax ID
]


def mask_sensitive_text(text: str) -> str:
    """Mask known sensitive patterns from logs."""
    if not text or not isinstance(text, str):
        return text
    masked = text
    for pattern, replacement in SENSITIVE_PATTERNS:
        masked = pattern.sub(replacement, masked)
    return masked


class PIIMaskingFormatter(logging.Formatter):
    """Custom logging formatter that strips/masks PII from log output."""

    def __init__(self, fmt: str = None, mask_pii: bool = True):
        super().__init__(fmt)
        self.mask_pii = mask_pii

    def format(self, record: logging.LogRecord) -> str:
        orig_msg = record.getMessage()
        if self.mask_pii and isinstance(orig_msg, str):
            record.msg = mask_sensitive_text(orig_msg)
            record.args = None  # Prevent double substitution
        return super().format(record)


def get_logger(name: str) -> logging.Logger:
    """Get a configured logger with PII masking."""
    settings = get_settings()
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        log_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
        formatter = PIIMaskingFormatter(
            fmt=log_format,
            mask_pii=settings.MASK_PII_LOGS,
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
    logger.propagate = False
    return logger
