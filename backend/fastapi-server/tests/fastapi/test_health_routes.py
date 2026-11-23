import os
import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy.exc import SQLAlchemyError
from fastapi.testclient import TestClient

os.environ.update(
    {
        "DB_HOST": "127.0.0.1",
        "DB_USER": "netra_test",
        "DB_PASSWORD": "netra_test",
        "DB_NAME": "netra_test",
    }
)

from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_database_health_check_success(client):
    mock_row = {"database_name": "netra_db", "result": 1}
    mock_mappings = MagicMock()
    mock_mappings.one.return_value = mock_row

    mock_result = MagicMock()
    mock_result.mappings.return_value = mock_mappings

    mock_conn = MagicMock()
    mock_conn.execute.return_value = mock_result
    mock_conn.__enter__.return_value = mock_conn

    with patch("routes.health.engine.connect", return_value=mock_conn):
        response = client.get("/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["database"] == "netra_db"
        assert data["data"] == {"result": 1}

def test_database_health_check_failure(client):
    with patch("routes.health.engine.connect", side_effect=SQLAlchemyError("Connection refused")):
        response = client.get("/health/db")
        assert response.status_code == 503
        data = response.json()
        assert data["success"] is False
        assert "Database connection failed" in data["message"]

def test_get_all_examiners_success(client):
    mock_examiners = [
        {"id": 1, "examiner_id": "EXM-001", "full_name": "Examiner One", "department": "Computer Science"},
        {"id": 2, "examiner_id": "EXM-002", "full_name": "Examiner Two", "department": "Electronics"},
    ]
    mock_mappings = MagicMock()
    mock_mappings.all.return_value = mock_examiners

    mock_result = MagicMock()
    mock_result.mappings.return_value = mock_mappings

    mock_conn = MagicMock()
    mock_conn.execute.return_value = mock_result
    mock_conn.__enter__.return_value = mock_conn

    with patch("routes.health.engine.connect", return_value=mock_conn):
        response = client.get("/health/examiners")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["count"] == 2
        assert len(data["data"]) == 2

def test_get_all_examiners_empty(client):
    mock_mappings = MagicMock()
    mock_mappings.all.return_value = []

    mock_result = MagicMock()
    mock_result.mappings.return_value = mock_mappings

    mock_conn = MagicMock()
    mock_conn.execute.return_value = mock_result
    mock_conn.__enter__.return_value = mock_conn

    with patch("routes.health.engine.connect", return_value=mock_conn):
        response = client.get("/health/examiners")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["count"] == 0
        assert data["data"] == []

def test_get_all_examiners_failure(client):
    with patch("routes.health.engine.connect", side_effect=SQLAlchemyError("Query error")):
        response = client.get("/health/examiners")
        assert response.status_code == 500
        data = response.json()
        assert data["success"] is False
        assert "Unable to fetch examiners" in data["message"]
