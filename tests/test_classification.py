"""Tests for document classification service."""

from fastapi.testclient import TestClient
from app.models.enums import DocumentType


def test_classify_passport_with_full_text(client: TestClient, sample_passport_data: dict):
    """Test classifying a standard passport with full text content."""
    payload = {
        "document_id": sample_passport_data["document_id"],
        "filename": sample_passport_data["filename"],
        "content_type": sample_passport_data["content_type"],
        "document_text": sample_passport_data["document_text"],
    }
    response = client.post("/api/v1/documents/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["document_id"] == sample_passport_data["document_id"]
    assert data["document_type"] == DocumentType.PASSPORT.value
    assert data["confidence"] >= 0.70
    assert data["requires_manual_review"] is False


def test_classify_utility_bill_by_text(client: TestClient, sample_address_proof_data: dict):
    """Test classifying utility bill for proof of address."""
    payload = {
        "document_id": sample_address_proof_data["document_id"],
        "filename": sample_address_proof_data["filename"],
        "document_text": sample_address_proof_data["document_text"],
    }
    response = client.post("/api/v1/documents/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["document_type"] == DocumentType.PROOF_OF_ADDRESS.value
    assert data["confidence"] > 0.60


def test_classify_driving_license_by_filename_and_text(client: TestClient, sample_driving_license_data: dict):
    """Test classifying driving license."""
    payload = {
        "document_id": sample_driving_license_data["document_id"],
        "filename": sample_driving_license_data["filename"],
        "document_text": sample_driving_license_data["document_text"],
    }
    response = client.post("/api/v1/documents/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["document_type"] == DocumentType.DRIVING_LICENSE.value
    assert data["confidence"] >= 0.65


def test_classify_bank_statement(client: TestClient):
    """Test bank statement classification."""
    payload = {
        "document_id": "doc-bank-01",
        "filename": "bank_statement_august.pdf",
        "document_text": "BANK OF AMERICA\nACCOUNT STATEMENT\nCLOSING BALANCE: $4,500.00\nCHECKING ACCOUNT",
    }
    response = client.post("/api/v1/documents/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["document_type"] == DocumentType.BANK_STATEMENT.value


def test_classify_unknown_document(client: TestClient):
    """Test document that cannot be matched to any known category."""
    payload = {
        "document_id": "doc-unk-01",
        "filename": "random_notes.txt",
        "document_text": "Meeting agenda for project sync on Tuesday.",
    }
    response = client.post("/api/v1/documents/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["document_type"] == DocumentType.UNKNOWN.value
    assert data["confidence"] == 0.0
    assert data["requires_manual_review"] is True


def test_classify_empty_payload(client: TestClient):
    """Test document with empty text and no filename."""
    payload = {
        "document_id": "doc-empty-01",
        "document_text": "",
    }
    response = client.post("/api/v1/documents/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["document_type"] == DocumentType.UNKNOWN.value
    assert data["requires_manual_review"] is True
