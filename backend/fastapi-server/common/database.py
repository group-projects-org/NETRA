import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.exc import SQLAlchemyError

BASE_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BASE_DIR / ".env")

required_variables = ["DB_HOST", "DB_USER", "DB_NAME"]
missing_variables = [key for key in required_variables if not os.getenv(key)]
if missing_variables:
    raise RuntimeError(f"Missing database environment variables: " f"{', '.join(missing_variables)}")

database_url = URL.create(
    drivername="mysql+pymysql",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD", ""),
    host=os.getenv("DB_HOST"),
    port=int(os.getenv("DB_PORT", 3306)),
    database=os.getenv("DB_NAME"),
)

connect_args = {}
if os.getenv("DB_SSL", "false").lower() == "true":
    ca_path = Path(os.getenv("DB_SSL_CA", "./certs/ca.pem"))
    if not ca_path.is_absolute():
        ca_path = BASE_DIR / ca_path
    if not ca_path.is_file():
        raise FileNotFoundError(f"MySQL CA certificate not found: {ca_path}")
    connect_args["ssl"] = {"ca": str(ca_path)}

engine = create_engine(database_url, connect_args=connect_args, pool_pre_ping=True, pool_size=5, max_overflow=5, pool_recycle=1800)

def check_database_connection() -> bool:
    try:
        with engine.connect() as connection: connection.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError: return False