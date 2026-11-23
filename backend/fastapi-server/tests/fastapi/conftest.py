"""
Shared fixtures for FastAPI backend tests.

Environment variables are set BEFORE any application modules are imported
so that common.database does not raise RuntimeError for missing vars.
"""

import os

os.environ.update(
    {
        "DB_HOST": "127.0.0.1",
        "DB_USER": "netra_test",
        "DB_PASSWORD": "netra_test",
        "DB_NAME": "netra_test",
    }
)

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture()
def client() -> TestClient:
    """Provide a TestClient wired to the NETRA FastAPI app."""
    return TestClient(app)
