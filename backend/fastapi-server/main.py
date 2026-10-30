from contextlib import asynccontextmanager
import os
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.health import router as health_router

load_dotenv(Path(__file__).resolve().parent / ".env")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting FastAPI application...")
    yield
    print("Shutting down FastAPI application...")

app = FastAPI(title="NETRA API", description="Backend API Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "Internal Server Error"},
    )

@app.get("/")
async def root():
    return {"success": True, "message": "Welcome to NETRA API",}

@app.get("/health", tags=["Health"])
async def health_check():
    return {"success": True, "status": "healthy",}

app.include_router(health_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(__import__("os").getenv("PORT", 8000)), reload=True)