from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, status

from app.core.security import get_current_user
from app.schemas.user import UserResponse
from app.schemas.omnichannel_dispatch import (
    InboundMessageSimulateRequest,
    OmnichannelMessageResponse,
    StaffActionRequest,
    PostStaySurveyCreate,
    PostStaySurveyResponse,
    SurveySentimentSummary,
    ScheduleOptimizationResponse,
)
from app.services.omnichannel_service import OmnichannelService

router = APIRouter(prefix="/omnichannel", tags=["Omnichannel AI Concierge & Operations"])


# --- OMNICHANNEL MESSAGING & DISPATCH ---
@router.post(
    "/messages/inbound",
    response_model=OmnichannelMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Inbound Guest Message (WhatsApp/SMS/Email)",
)
async def process_inbound_message(
    payload: InboundMessageSimulateRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Classify message intent via NLP, generate instant AI reply, and auto-dispatch to staff if necessary."""
    return await OmnichannelService.process_inbound_message(payload.model_dump())


@router.get(
    "/messages",
    response_model=List[OmnichannelMessageResponse],
    summary="List Omnichannel Message Threads & Staff Dispatches",
)
async def list_omnichannel_messages(
    status: Optional[str] = Query(None, description="Status filter: AUTO_RESOLVED, DISPATCHED_TO_STAFF, STAFF_RESOLVED"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve message threads across WhatsApp, SMS, and In-App channels."""
    return await OmnichannelService.list_messages(status_filter=status)


@router.post(
    "/messages/{msg_id}/resolve",
    response_model=OmnichannelMessageResponse,
    summary="Staff Resolves Message Dispatch",
)
async def resolve_message(
    msg_id: str = Path(..., description="Message ID"),
    payload: StaffActionRequest = ...,
    current_user: UserResponse = Depends(get_current_user),
):
    """Hotel staff member logs fulfillment and marks inquiry or service task as resolved."""
    return await OmnichannelService.resolve_message(
        msg_id=msg_id,
        staff_name=payload.staff_name or current_user.name,
        notes=payload.staff_notes or payload.reply_message or "Resolved by staff.",
    )


# --- POST-STAY SURVEYS & SENTIMENT ---
@router.post(
    "/surveys",
    response_model=PostStaySurveyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Post-Stay Survey (NPS & CSAT)",
)
async def submit_survey(
    payload: PostStaySurveyCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    """Record guest feedback, categorize NPS, and trigger automated Service Recovery if rating is low."""
    return await OmnichannelService.submit_survey(payload.model_dump())


@router.get(
    "/surveys/sentiment",
    response_model=SurveySentimentSummary,
    summary="Get Net Promoter Score & Review Sentiment Analytics",
)
async def get_survey_sentiment(
    property_id: Optional[str] = Query(None, description="Optional property ID filter"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Calculate aggregate NPS, average CSAT, sentiment breakdown, and active service recovery tickets."""
    return await OmnichannelService.get_survey_sentiment_summary(property_id=property_id)


# --- SMART HOUSEKEEPING AUTO-SCHEDULER ---
@router.get(
    "/housekeeping/optimize",
    response_model=ScheduleOptimizationResponse,
    summary="Generate Optimized Housekeeping Cleaning Schedule",
)
async def optimize_housekeeping_schedule(
    property_id: str = Query("prop_101", description="Property ID"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Run intelligent algorithm to balance room turnarounds based on VIP tier and guest arrival schedule."""
    return OmnichannelService.optimize_housekeeping_schedule(property_id=property_id)
