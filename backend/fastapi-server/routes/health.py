import logging
from fastapi import APIRouter, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from fastapi.responses import JSONResponse
from common.database import engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/db")
def database_health_check():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT DATABASE() AS database_name, 1 AS result"))
            row = result.mappings().one()
        return {
            "success": True, "message": "MySQL connected successfully", 
            "database": row["database_name"], "data": {"result": row["result"]}
        }
    except SQLAlchemyError:
        logger.exception("Database health check failed")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            content={"success": False, "message": "Database connection failed"}
        )

@router.get("/examiners")
def get_all_examiners():
    """
    Fetch all records from the examiners table.
    """

    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT * FROM examiners")
            )

            examiners = [
                dict(row)
                for row in result.mappings().all()
            ]

        return {
            "success": True,
            "message": "Examiners fetched successfully",
            "count": len(examiners),
            "data": examiners
        }

    except SQLAlchemyError:
        logger.exception("Failed to fetch examiners")

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": "Unable to fetch examiners"
            }
        )