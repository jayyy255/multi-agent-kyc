"""Pytest configuration and shared test fixtures."""

import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app

SAMPLE_DATA_DIR = Path(__file__).parent.parent / "sample_data"


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)


@pytest.fixture
def sample_passport_data():
    """Load sample passport json fixture."""
    file_path = SAMPLE_DATA_DIR / "sample_passport.json"
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def sample_address_proof_data():
    """Load sample address proof json fixture."""
    file_path = SAMPLE_DATA_DIR / "sample_address_proof.json"
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def sample_customer_data():
    """Load sample customer profile fixture."""
    file_path = SAMPLE_DATA_DIR / "sample_customer.json"
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def sample_driving_license_data():
    """Load sample driving license json fixture."""
    file_path = SAMPLE_DATA_DIR / "sample_driving_license.json"
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)
