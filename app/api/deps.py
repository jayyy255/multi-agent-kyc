"""API dependencies injection module."""

from app.services.case_analyzer import CaseAnalyzer, default_case_analyzer
from app.services.classifier import BaseClassifier, default_classifier
from app.services.extractor import BaseExtractor, default_extractor
from app.services.validator import DocumentValidator, default_validator
from app.utils.security import verify_api_key


def get_classifier() -> BaseClassifier:
    """Dependency provider for document classifier."""
    return default_classifier


def get_extractor() -> BaseExtractor:
    """Dependency provider for field extractor."""
    return default_extractor


def get_validator() -> DocumentValidator:
    """Dependency provider for document validator."""
    return default_validator


def get_case_analyzer() -> CaseAnalyzer:
    """Dependency provider for case analyzer."""
    return default_case_analyzer
