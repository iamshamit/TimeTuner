"""Timetable Solver API - OR-Tools based constraint programming solver."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.routes import router
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Starting Timetable Solver Service...")
    yield
    logger.info("Shutting down Timetable Solver Service...")


app = FastAPI(
    title="Timetable Solver API",
    description="OR-Tools based constraint programming solver for class scheduling",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Basic health check."""
    return {"status": "healthy", "service": "timetable-solver"}


@app.get("/ready")
async def readiness_check():
    """Readiness check - verify solver is ready."""
    try:
        from ortools.sat.python import cp_model
        model = cp_model.CpModel()
        return {"status": "ready", "ortools": "available"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Solver not ready: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG
    )
