"""Tests for API error handling and envelope consistency."""

from fastapi.testclient import TestClient


def test_classify_missing_mandatory_field(client: TestClient):
    """Test 422 error response structure when document_id is missing."""
    payload = {
        "filename": "passport.pdf"
        # document_id is missing
    }
    response = client.post("/api/v1/documents/classify", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "VALIDATION_ERROR"
    assert "errors" in data["details"]


def test_extract_invalid_document_type(client: TestClient):
    """Test 422 error response when an unsupported enum value is supplied."""
    payload = {
        "document_id": "doc-01",
        "document_type": "space_passport",  # Invalid enum
        "document_text": "Sample text",
    }
    response = client.post("/api/v1/documents/extract", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "VALIDATION_ERROR"


def test_validate_missing_extracted_fields(client: TestClient):
    """Test 422 error when extracted_fields dictionary is omitted."""
    payload = {
        "case_id": "case-01",
        "document_type": "passport"
        # extracted_fields is missing
    }
    response = client.post("/api/v1/documents/validate", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "VALIDATION_ERROR"


def test_404_not_found_handling(client: TestClient):
    """Test standard 404 behavior on nonexistent routes."""
    response = client.get("/api/v1/nonexistent-endpoint")
    assert response.status_code == 404
