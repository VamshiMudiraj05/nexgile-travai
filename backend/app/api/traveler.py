from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Path, Query, HTTPException, status
from app.core.security import get_current_user
from app.schemas.user import UserResponse
from app.schemas.marketplace import (
    TravelerBookingCreateRequest,
    TravelerBookingResponse,
)
from app.schemas.traveler_profile import (
    TravelerProfileResponse,
    UpdateTravelerProfileRequest,
    TravelerRecommendationsResponse,
    RecommendationItem,
)
from app.services.traveler_booking_service import TravelerBookingService
from app.services.traveler_profile_service import TravelerProfileService

router = APIRouter(prefix="/traveler", tags=["Traveler Operations & Trips"])


@router.post(
    "/bookings",
    response_model=TravelerBookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Traveler Booking",
)
async def create_traveler_booking(
    payload: TravelerBookingCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Create a reservation for the authenticated traveler, preventing double bookings."""
    user_dict = {
        "_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    }
    return await TravelerBookingService.create_booking(
        user=user_dict,
        booking_data=payload.model_dump(),
    )


@router.get(
    "/bookings",
    summary="List Authenticated Traveler's Trips",
)
async def get_my_trips(
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve the traveler's trips grouped into upcoming, current, past, and cancelled."""
    return await TravelerBookingService.get_traveler_trips(user_id=str(current_user.id))


@router.get(
    "/bookings/{reservation_id}",
    summary="Get Detailed Stay Folio for a Trip",
)
async def get_trip_detail(
    reservation_id: str = Path(..., description="Reservation ID"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve full stay folio and details."""
    return await TravelerBookingService.get_trip_detail(
        user_id=str(current_user.id),
        reservation_id=reservation_id,
    )


@router.post(
    "/bookings/{reservation_id}/cancel",
    summary="Cancel a Traveler Reservation",
)
async def cancel_my_booking(
    reservation_id: str = Path(..., description="Reservation ID"),
    reason: Optional[str] = Query(None, description="Reason for cancellation"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Cancel upcoming booking and release room."""
    return await TravelerBookingService.cancel_traveler_booking(
        user_id=str(current_user.id),
        reservation_id=reservation_id,
        reason=reason,
    )


@router.get(
    "/profile",
    response_model=TravelerProfileResponse,
    summary="Get Traveler Profile & Preferences",
)
async def get_traveler_profile(
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve traveler preferences, travel statistics, and loyalty status."""
    return await TravelerProfileService.get_traveler_profile(user_id=str(current_user.id))


@router.put(
    "/profile",
    response_model=TravelerProfileResponse,
    summary="Update Traveler Profile Preferences",
)
async def update_traveler_profile(
    payload: UpdateTravelerProfileRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Update contact information and travel preferences."""
    return await TravelerProfileService.update_traveler_profile(
        user_id=str(current_user.id),
        data=payload.model_dump(exclude_unset=True),
    )


@router.get(
    "/recommendations",
    response_model=List[RecommendationItem],
    summary="Get Personalized 'For You' Recommendations",
)
async def get_personalized_recommendations(
    current_user: UserResponse = Depends(get_current_user),
):
    """Inference from traveler profile model returning tailored property recommendations."""
    return await TravelerProfileService.get_personalized_recommendations(user_id=str(current_user.id))
