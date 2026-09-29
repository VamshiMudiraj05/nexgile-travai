from typing import Optional
from fastapi import APIRouter, Depends, status
from app.core.security import get_current_user
from app.schemas.user import UserResponse
from app.schemas.concierge import (
    ConciergeChatRequest,
    ConciergeChatResponse,
    ConciergeWelcomeResponse,
)
from app.services.concierge_service import ConciergeService

router = APIRouter(prefix="/concierge", tags=["AI Concierge"])


@router.post(
    "/chat",
    response_model=ConciergeChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with AI Concierge",
)
async def chat_with_concierge(
    payload: ConciergeChatRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Conversational assistant for authenticated travelers grounded in actual stay, reservation, and property data."""
    user_dict = {
        "_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
    }
    return await ConciergeService.chat(
        user=user_dict,
        message=payload.message,
        reservation_id=payload.reservation_id,
        history=payload.history,
    )


@router.get(
    "/welcome",
    response_model=ConciergeWelcomeResponse,
    summary="Get Concierge Welcome Context & Active Stay Summary",
)
async def get_concierge_welcome(
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve traveler summary, current/upcoming stay details, and suggested quick prompts."""
    user_dict = {
        "_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
    }
    return await ConciergeService.get_welcome_summary(user=user_dict)
