from fastapi import APIRouter
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify backend service availability."""
    return HealthResponse(
        status="healthy",
        service="nexgile-travai-backend"
    )
