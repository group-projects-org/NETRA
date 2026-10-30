from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting FastAPI application...")
    yield
    print("Shutting down FastAPI application...")

app = FastAPI(title="NETRA API", description="Backend API Service", version="1.0.0", lifespan=lifespan,)

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception,):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "Internal Server Error",},
    )

@app.get("/")
async def root():
    return {"success": True, "message": "Welcome to NETRA API",}

@app.get("/health", tags=["Health"])
async def health_check():
    return {"success": True, "status": "healthy",}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True,)