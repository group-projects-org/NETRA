import os
import sys
import subprocess
from unittest.mock import MagicMock, patch
from sqlalchemy.exc import SQLAlchemyError

os.environ.update(
    {
        "DB_HOST": "127.0.0.1",
        "DB_USER": "netra_test",
        "DB_PASSWORD": "netra_test",
        "DB_NAME": "netra_test",
    }
)

from common.database import check_database_connection

def test_check_database_connection_true():
    mock_conn = MagicMock()
    mock_conn.__enter__.return_value = mock_conn

    with patch("common.database.engine.connect", return_value=mock_conn):
        assert check_database_connection() is True

def test_check_database_connection_false():
    with patch("common.database.engine.connect", side_effect=SQLAlchemyError("Connection refused")):
        assert check_database_connection() is False

def test_missing_database_variables_raises_runtime_error():
    # Run a python command without DB_HOST to verify RuntimeError is raised
    env = os.environ.copy()
    env.pop("DB_HOST", None)
    env.pop("DB_USER", None)
    env.pop("DB_NAME", None)

    code = "import common.database"
    proc = subprocess.run(
        [sys.executable, "-c", code],
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")),
        env=env,
        capture_output=True,
        text=True,
    )
    assert proc.returncode != 0
    assert "Missing database environment variables" in proc.stderr
