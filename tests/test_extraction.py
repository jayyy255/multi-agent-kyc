"""Tests for document field extraction service."""

from fastapi.testclient import TestClient
from app.models.enums import DocumentType


def test_extract_passport_success(client: TestClient, sample_passport_data: dict):
    """Test extracting fields from synthetic passport."""
    payload = {
        "document_id": sample_passport_data["document_id"],
        "document_type": DocumentType.PASSPORT.value,
        "document_text": sample_passport_data["document_text"],
    }
    response = client.post("/api/v1/documents/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["document_type"] == "passport"

    extracted = data["extracted_fields"]
    assert extracted["passport_number"] == "P98765432"
    assert "SMITH" in extracted["full_name"].upper()
    assert "ELEANOR" in extracted["full_name"].upper()
    assert extracted["date_of_birth"] == "1992-05-14"
    assert extracted["expiry_date"] == "2030-06-01"
    assert data["confidence"] > 0.70
    assert data["requires_manual_review"] is False


def test_extract_proof_of_address_success(client: TestClient, sample_address_proof_data: dict):
    """Test extracting fields from synthetic proof of address."""
    payload = {
        "document_id": sample_address_proof_data["document_id"],
        "document_type": DocumentType.PROOF_OF_ADDRESS.value,
        "document_text": sample_address_proof_data["document_text"],
    }
    response = client.post("/api/v1/documents/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    extracted = data["extracted_fields"]
    assert "ELEANOR" in extracted["full_name"].upper()
    assert "742 EVERGREEN TERRACE" in extracted["address"].upper()
    assert extracted["document_reference"] == "8492-3021-99"


def test_extract_driving_license(client: TestClient, sample_driving_license_data: dict):
    """Test extracting fields from driving license."""
    payload = {
        "document_id": sample_driving_license_data["document_id"],
        "document_type": DocumentType.DRIVING_LICENSE.value,
        "document_text": sample_driving_license_data["document_text"],
    }
    response = client.post("/api/v1/documents/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    extracted = data["extracted_fields"]
    assert extracted["license_number"] == "DL77391024"
    assert "SMITH" in extracted["full_name"].upper()
    assert extracted["expiry_date"] == "2029-05-14"


def test_extract_missing_critical_fields(client: TestClient):
    """Test extraction with partial text where critical fields are missing."""
    payload = {
        "document_id": "doc-partial-01",
        "document_type": DocumentType.PASSPORT.value,
        "document_text": "PASSPORT / PASSEPORT\nAuthority: United States\nType: P",
    }
    response = client.post("/api/v1/documents/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["requires_manual_review"] is True
    assert "passport_number" in data["missing_fields"]
    assert "full_name" in data["missing_fields"]


def test_extract_empty_text(client: TestClient):
    """Test extraction with blank text."""
    payload = {
        "document_id": "doc-empty-01",
        "document_type": DocumentType.PASSPORT.value,
        "document_text": "",
    }
    response = client.post("/api/v1/documents/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["requires_manual_review"] is True
    assert data["confidence"] == 0.0
    assert len(data["missing_fields"]) > 0
