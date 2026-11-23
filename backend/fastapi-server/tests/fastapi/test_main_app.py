"""
Comprehensive tests for main.py – the NETRA FastAPI application.

Covers:
  • Root endpoint (GET /)
  • Health endpoint (GET /health)
  • CORS middleware behaviour
  • Global exception handler
  • Application metadata (title, version)
  • Router inclusion
"""

import os

# Env vars MUST be set before importing app/database modules.
os.environ.update(
    {
        "DB_HOST": "127.0.0.1",
        "DB_USER": "netra_test",
        "DB_PASSWORD": "netra_test",
        "DB_NAME": "netra_test",
    }
)

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from main import app


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


# ---------------------------------------------------------------------------
# App metadata
# ---------------------------------------------------------------------------

class TestAppMetadata:
    """Verify FastAPI application-level configuration."""

    def test_app_title_is_netra_api(self):
        assert app.title == "NETRA API"

    def test_app_version_is_1_0_0(self):
        assert app.version == "1.0.0"

    def test_app_description_is_set(self):
        assert app.description == "Backend API Service"


# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------

class TestRootEndpoint:
    """GET / must return the welcome payload."""

    def test_returns_200(self, client: TestClient):
        response = client.get("/")
        assert response.status_code == 200

    def test_returns_welcome_message(self, client: TestClient):
        body = client.get("/").json()
        assert body == {"success": True, "message": "Welcome to NETRA API"}

    def test_success_flag_is_true(self, client: TestClient):
        assert client.get("/").json()["success"] is True

    def test_content_type_is_json(self, client: TestClient):
        response = client.get("/")
        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    """GET /health must report healthy status."""

    def test_returns_200(self, client: TestClient):
        response = client.get("/health")
        assert response.status_code == 200

    def test_returns_healthy_status(self, client: TestClient):
        body = client.get("/health").json()
        assert body == {"success": True, "status": "healthy"}

    def test_status_field_equals_healthy(self, client: TestClient):
        assert client.get("/health").json()["status"] == "healthy"


# ---------------------------------------------------------------------------
# CORS middleware
# ---------------------------------------------------------------------------

class TestCORSMiddleware:
    """CORS headers must be present when a valid Origin is supplied."""

    @pytest.fixture()
    def allowed_origin(self) -> str:
        return os.getenv("FRONTEND_URL", "http://localhost:5173")

    def test_access_control_allow_origin_header(
        self, client: TestClient, allowed_origin: str
    ):
        response = client.get("/", headers={"Origin": allowed_origin})
        assert response.headers.get("access-control-allow-origin") == allowed_origin

    def test_access_control_allow_credentials(
        self, client: TestClient, allowed_origin: str
    ):
        response = client.get("/", headers={"Origin": allowed_origin})
        assert response.headers.get("access-control-allow-credentials") == "true"

    def test_preflight_options_request(
        self, client: TestClient, allowed_origin: str
    ):
        response = client.options(
            "/",
            headers={
                "Origin": allowed_origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == allowed_origin
        assert "POST" in response.headers.get("access-control-allow-methods", "")

    def test_disallowed_origin_does_not_get_cors_header(self, client: TestClient):
        response = client.get(
            "/", headers={"Origin": "http://evil-site.example.com"}
        )
        # The header should either be absent or not reflect the disallowed origin.
        acao = response.headers.get("access-control-allow-origin")
        assert acao != "http://evil-site.example.com"


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------

class TestGlobalExceptionHandler:
    """The app-wide Exception handler must catch unhandled errors and return 500."""

    def test_unhandled_exception_returns_500(self):
        # Register a temporary route that always raises.
        @app.get("/_test_error")
        async def _blow_up():
            raise RuntimeError("Boom!")

        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/_test_error")
        assert response.status_code == 500

    def test_unhandled_exception_returns_error_body(self):
        # The route was registered in the previous test; reuse it.
        client = TestClient(app, raise_server_exceptions=False)
        body = client.get("/_test_error").json()
        assert body == {"success": False, "message": "Internal Server Error"}

    def test_error_response_content_type_is_json(self):
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/_test_error")
        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# Router inclusion
# ---------------------------------------------------------------------------

class TestRouterInclusion:
    """Verify that expected routers / paths are mounted."""

    def test_health_db_route_exists(self, client: TestClient):
        """The /health/db route should be reachable (may fail at DB, but not 404)."""
        from unittest.mock import patch, MagicMock

        mock_conn = MagicMock()
        mock_result = MagicMock()
        mock_result.mappings.return_value.one.return_value = {
            "database_name": "netra_test",
            "result": 1,
        }
        mock_conn.__enter__ = MagicMock(return_value=mock_conn)
        mock_conn.__exit__ = MagicMock(return_value=False)
        mock_conn.execute.return_value = mock_result

        with patch("routes.health.engine") as mock_engine:
            mock_engine.connect.return_value = mock_conn
            response = client.get("/health/db")

        assert response.status_code != 404

    def test_health_examiners_route_exists(self, client: TestClient):
        """The /health/examiners route should be reachable (may fail at DB, but not 404)."""
        from unittest.mock import patch, MagicMock

        mock_conn = MagicMock()
        mock_result = MagicMock()
        mock_result.mappings.return_value.all.return_value = []
        mock_conn.__enter__ = MagicMock(return_value=mock_conn)
        mock_conn.__exit__ = MagicMock(return_value=False)
        mock_conn.execute.return_value = mock_result

        with patch("routes.health.engine") as mock_engine:
            mock_engine.connect.return_value = mock_conn
            response = client.get("/health/examiners")

        assert response.status_code != 404

    def test_registered_routes_contain_expected_paths(self):
        from routes.health import router as health_router
        route_paths = [route.path for route in app.routes if hasattr(route, "path")]
        assert "/" in route_paths
        assert "/health" in route_paths
        health_paths = [route.path for route in health_router.routes]
        assert "/db" in health_paths or "/health/db" in health_paths
        assert "/examiners" in health_paths or "/health/examiners" in health_paths
