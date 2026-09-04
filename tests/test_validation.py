"""Tests for deterministic validation service."""

from fastapi.testclient import TestClient
from app.models.enums import DocumentType, ReviewRecommendation, RiskLevel, ValidationStatus


def test_validate_valid_passport(client: TestClient, sample_customer_data: dict):
    """Test validation of fully valid passport matching customer profile."""
    payload = {
        "case_id": "case-001",
        "customer_id": sample_customer_data["customer_id"],
        "document_type": DocumentType.PASSPORT.value,
        "extracted_fields": {
            "full_name": "Eleanor Jane Smith",
            "passport_number": "P98765432",
            "date_of_birth": "1992-05-14",
            "expiry_date": "2030-06-01",
            "nationality": "USA",
        },
        "customer_record": sample_customer_data,
        "reference_date": "2026-09-01",
    }
    response = client.post("/api/v1/documents/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["is_valid"] is True
    assert data["validation_status"] == ValidationStatus.VALID.value
    assert data["recommendation"] == ReviewRecommendation.PROCEED.value
    assert data["risk_level"] == RiskLevel.LOW.value
    assert len(data["missing_information"]) == 0
    assert len(data["inconsistencies"]) == 0


def test_validate_expired_passport(client: TestClient, sample_customer_data: dict):
    """Test validation of an expired passport."""
    payload = {
        "case_id": "case-002",
        "customer_id": sample_customer_data["customer_id"],
        "document_type": DocumentType.PASSPORT.value,
        "extracted_fields": {
            "full_name": "Eleanor Jane Smith",
            "passport_number": "P98765432",
            "date_of_birth": "1992-05-14",
            "expiry_date": "2020-01-01",  # Expired
        },
        "customer_record": sample_customer_data,
        "reference_date": "2026-09-01",
    }
    response = client.post("/api/v1/documents/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert data["requires_manual_review"] is True
    assert any("expired" in inc.lower() for inc in data["inconsistencies"])
    assert data["recommendation"] == ReviewRecommendation.ESCALATE_HUMAN_REVIEW.value


def test_validate_missing_required_fields(client: TestClient):
    """Test validation when required fields are missing."""
    payload = {
        "case_id": "case-003",
        "document_type": DocumentType.PASSPORT.value,
        "extracted_fields": {
            "full_name": "Jane Doe",
            # Missing passport_number, date_of_birth, expiry_date
        },
    }
    response = client.post("/api/v1/documents/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert data["validation_status"] == ValidationStatus.NEEDS_INFORMATION.value
    assert data["recommendation"] == ReviewRecommendation.REQUEST_ADDITIONAL_INFORMATION.value
    assert "passport_number" in data["missing_information"]
    assert "expiry_date" in data["missing_information"]


def test_validate_customer_name_mismatch(client: TestClient, sample_customer_data: dict):
    """Test validation when document name conflicts with customer record."""
    payload = {
        "case_id": "case-004",
        "customer_id": sample_customer_data["customer_id"],
        "document_type": DocumentType.PASSPORT.value,
        "extracted_fields": {
            "full_name": "Robert Christopher Johnson",  # Conflicting name
            "passport_number": "P98765432",
            "date_of_birth": "1992-05-14",
            "expiry_date": "2030-06-01",
        },
        "customer_record": sample_customer_data,
        "reference_date": "2026-09-01",
    }
    response = client.post("/api/v1/documents/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert data["requires_manual_review"] is True
    assert data["risk_level"] == RiskLevel.HIGH.value
    assert data["recommendation"] == ReviewRecommendation.ESCALATE_HUMAN_REVIEW.value
    assert any("mismatch" in inc.lower() for inc in data["inconsistencies"])


def test_validate_underage_customer(client: TestClient, sample_customer_data: dict):
    """Test validation when customer age is below 18."""
    payload = {
        "case_id": "case-005",
        "customer_id": sample_customer_data["customer_id"],
        "document_type": DocumentType.PASSPORT.value,
        "extracted_fields": {
            "full_name": "Eleanor Jane Smith",
            "passport_number": "P98765432",
            "date_of_birth": "2015-05-14",  # Age 11 in 2026
            "expiry_date": "2030-06-01",
        },
        "customer_record": sample_customer_data,
        "reference_date": "2026-09-01",
    }
    response = client.post("/api/v1/documents/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert data["requires_manual_review"] is True
    assert any("underage" in inc.lower() or "age" in inc.lower() for inc in data["inconsistencies"])


def test_validate_proof_of_address(client: TestClient, sample_customer_data: dict):
    """Test validation of utility bill address matching customer profile."""
    payload = {
        "case_id": "case-006",
        "customer_id": sample_customer_data["customer_id"],
        "document_type": DocumentType.PROOF_OF_ADDRESS.value,
        "extracted_fields": {
            "full_name": "Eleanor Jane Smith",
            "address": "742 Evergreen Terrace, Apt 4B, Springfield, OR 97477",
            "issue_date": "2026-08-15",
            "document_reference": "8492-3021-99",
        },
        "customer_record": sample_customer_data,
    }
    response = client.post("/api/v1/documents/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["validation_status"] == ValidationStatus.VALID.value
