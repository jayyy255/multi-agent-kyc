"""Tests for health and version endpoints."""

from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """Verify /health returns 200 and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert data["service"] == "multi-agent-kyc-backend"


def test_version_endpoint(client: TestClient):
    """Verify /api/v1/version returns service details."""
    response = client.get("/api/v1/version")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "0.1.0"
    assert data["api_prefix"] == "/api/v1"
    assert "environment" in data


def test_root_endpoint(client: TestClient):
    """Verify root endpoint provides basic info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["docs"] == "/docs"
    assert data["health"] == "/health"
