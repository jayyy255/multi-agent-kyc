"""Tests for case-level worker endpoints."""

from fastapi.testclient import TestClient
from app.models.enums import DocumentType, ReviewRecommendation, RiskLevel


def test_check_requirements_complete(client: TestClient):
    """Test requirement check when identity and address documents are provided."""
    payload = {
        "case_id": "case-req-001",
        "provided_document_types": [
            DocumentType.PASSPORT.value,
            DocumentType.PROOF_OF_ADDRESS.value,
        ],
    }
    response = client.post("/api/v1/cases/check-requirements", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["satisfied"] is True
    assert data["recommendation"] == ReviewRecommendation.PROCEED.value


def test_check_requirements_incomplete(client: TestClient):
    """Test requirement check when address proof is missing."""
    payload = {
        "case_id": "case-req-002",
        "provided_document_types": [
            DocumentType.PASSPORT.value,
        ],
    }
    response = client.post("/api/v1/cases/check-requirements", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["satisfied"] is False
    assert DocumentType.PROOF_OF_ADDRESS.value in data["missing_document_types"]
    assert data["recommendation"] == ReviewRecommendation.REQUEST_ADDITIONAL_INFORMATION.value


def test_compare_customer_data(client: TestClient, sample_customer_data: dict):
    """Test customer data comparison tool across documents."""
    payload = {
        "case_id": "case-comp-001",
        "customer_record": sample_customer_data,
        "document_extractions": {
            "passport": {
                "full_name": "Eleanor Jane Smith",
                "date_of_birth": "1992-05-14",
            },
            "utility_bill": {
                "full_name": "Eleanor Jane Smith",
                "address": "742 Evergreen Terrace, Apt 4B, Springfield, OR 97477",
            }
        }
    }
    response = client.post("/api/v1/cases/compare-customer-data", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["all_matched"] is True
    assert data["risk_level"] == RiskLevel.LOW.value


def test_detect_cross_document_inconsistencies(client: TestClient):
    """Test detection of contradictory information between multiple uploaded documents."""
    payload = {
        "case_id": "case-incon-001",
        "documents_data": [
            {
                "document_type": "passport",
                "extracted_fields": {
                    "full_name": "Eleanor Jane Smith",
                    "date_of_birth": "1992-05-14"
                }
            },
            {
                "document_type": "driving_license",
                "extracted_fields": {
                    "full_name": "Arthur Pendelton",  # Different person
                    "date_of_birth": "1985-11-20"
                }
            }
        ]
    }
    response = client.post("/api/v1/cases/detect-inconsistencies", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["has_inconsistencies"] is True
    assert data["risk_level"] == RiskLevel.HIGH.value
    assert data["recommendation"] == ReviewRecommendation.ESCALATE_HUMAN_REVIEW.value
    assert len(data["inconsistencies"]) >= 1
