from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.properties import router as properties_router
from app.api.room_types import router as room_types_router
from app.api.rooms import router as rooms_router
from app.api.guests import router as guests_router
from app.api.reservations import router as reservations_router
from app.api.dashboard import router as dashboard_router
from app.api.analytics import router as analytics_router
from app.api.revenue import router as revenue_router
from app.api.marketplace import router as marketplace_router
from app.api.traveler import router as traveler_router
from app.api.loyalty import router as loyalty_router
from app.api.payments import router as payments_router
from app.core.config import settings
from app.core.logging import logger
from app.database.mongodb import connect_to_mongo, close_mongo_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI startup and shutdown."""
    logger.info("Initializing Nexgile-TravAI Backend...")
    await connect_to_mongo()
    yield
    logger.info("Shutting down Nexgile-TravAI Backend...")
    await close_mongo_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="4.5.0",
    description="Nexgile-TravAI - Enterprise Travel & Hospitality Management Platform API",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS Configuration
allow_all_origins = "*" in settings.CORS_ORIGINS or any(o.strip() == "*" for o in settings.CORS_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[] if allow_all_origins else settings.CORS_ORIGINS,
    allow_origin_regex=r"https?://.*" if allow_all_origins else r"https://.*\.vercel\.app|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = " -> ".join([str(loc) for loc in error["loc"] if loc != "body"])
        errors.append({"field": field, "message": error["msg"]})
    
    logger.warning(f"Validation error on {request.method} {request.url.path}: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors},
    )


# Catch-all exception handler to prevent leaking stack traces
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# Mount API Routers under /api/v1/
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(properties_router, prefix=settings.API_V1_STR)
app.include_router(room_types_router, prefix=settings.API_V1_STR)
app.include_router(rooms_router, prefix=settings.API_V1_STR)
app.include_router(guests_router, prefix=settings.API_V1_STR)
app.include_router(reservations_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(revenue_router, prefix=settings.API_V1_STR)
app.include_router(marketplace_router, prefix=settings.API_V1_STR)
app.include_router(traveler_router, prefix=settings.API_V1_STR)
app.include_router(loyalty_router, prefix=settings.API_V1_STR)
app.include_router(payments_router, prefix=settings.API_V1_STR)



@app.get("/")
async def root():
    return {
        "platform": "Nexgile-TravAI",
        "phases": "Phase 1 (Foundation) | Phase 2 (PMS) | Phase 4 (BI) | Phase 5 (Traveler)",
        "status": "online",
        "health_check": f"{settings.API_V1_STR}/health",
        "documentation": "/api/docs"
    }
