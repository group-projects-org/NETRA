import os

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


def test_root_endpoint_returns_welcome_message():
    response = TestClient(app).get("/")

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "message": "Welcome to NETRA API",
    }


def test_health_endpoint_reports_healthy_status():
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"success": True, "status": "healthy"}