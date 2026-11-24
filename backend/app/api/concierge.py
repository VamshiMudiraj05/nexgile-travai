import asyncio
import json
from typing import Optional
from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
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


@router.post(
    "/chat/stream",
    summary="Chat with AI Concierge via Server-Sent Events (SSE) Stream",
)
async def chat_with_concierge_stream(
    payload: ConciergeChatRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    High-responsiveness streaming endpoint yielding Server-Sent Events (SSE)
    tokens with natural typewriter cadence, eliminating waiting perception.
    """
    user_dict = {
        "_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
    }

    async def event_generator():
        result = await ConciergeService.chat(
            user=user_dict,
            message=payload.message,
            reservation_id=payload.reservation_id,
            history=payload.history,
        )
        full_text = result.get("message", "")
        words = full_text.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"
            await asyncio.sleep(0.012)

        final_payload = {
            "token": "",
            "done": True,
            "full_message": full_text,
            "suggested_action": result.get("suggested_action"),
            "quick_replies": result.get("quick_replies", []),
        }
        yield f"data: {json.dumps(final_payload)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
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
