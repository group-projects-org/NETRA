import os
import importlib
import pytest
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
    with patch.dict(os.environ, {"DB_HOST": "", "DB_USER": "", "DB_NAME": ""}, clear=False), patch("dotenv.load_dotenv"):
        with pytest.raises(RuntimeError, match="Missing database environment variables"):
            import common.database
            importlib.reload(common.database)
    # Restore valid state for other tests
    os.environ.update(
        {
            "DB_HOST": "127.0.0.1",
            "DB_USER": "netra_test",
            "DB_PASSWORD": "netra_test",
            "DB_NAME": "netra_test",
        }
    )
    import common.database
    importlib.reload(common.database)
