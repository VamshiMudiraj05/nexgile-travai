from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.security import get_current_user, require_role
from app.schemas.reservation import (
    ReservationCreate,
    ReservationResponse,
    PaginatedReservationResponse,
    AvailabilityCheckRequest,
    AvailabilityResponse,
)
from app.schemas.user import UserResponse, UserRole
from app.services.reservation_service import reservation_service

router = APIRouter(prefix="/reservations", tags=["Reservations"])


@router.post(
    "",
    response_model=ReservationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new reservation"
)
async def create_reservation(
    res_in: ReservationCreate,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FRONT_DESK]))
):
    return await reservation_service.create_reservation(res_in, current_user.id)


@router.get(
    "/availability",
    response_model=AvailabilityResponse,
    summary="Check room availability for given dates and property"
)
async def check_availability(
    property_id: str = Query(..., description="Property ID"),
    check_in_date: date = Query(..., description="Check-in date YYYY-MM-DD"),
    check_out_date: date = Query(..., description="Check-out date YYYY-MM-DD"),
    room_type_id: Optional[str] = Query(None, description="Optional Room Type filter"),
    current_user: UserResponse = Depends(get_current_user)
):
    req = AvailabilityCheckRequest(
        property_id=property_id,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        room_type_id=room_type_id,
    )
    return await reservation_service.check_availability(req)


@router.get(
    "",
    response_model=PaginatedReservationResponse,
    summary="Get paginated list of reservations with multi-filtering"
)
async def get_reservations(
    property_id: Optional[str] = None,
    date: Optional[str] = Query(None, description="Filter by active date YYYY-MM-DD"),
    status: Optional[str] = None,
    guest_id: Optional[str] = None,
    room_id: Optional[str] = None,
    booking_reference: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user)
):
    return await reservation_service.get_reservations(
        property_id=property_id,
        date_filter=date,
        status_filter=status,
        guest_id=guest_id,
        room_id=room_id,
        booking_reference=booking_reference,
        search=search,
        page=page,
        limit=limit,
    )


@router.get(
    "/{reservation_id}",
    response_model=ReservationResponse,
    summary="Get reservation details by ID"
)
async def get_reservation(
    reservation_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    return await reservation_service.get_reservation_by_id(reservation_id)


@router.post(
    "/{reservation_id}/confirm",
    response_model=ReservationResponse,
    summary="Confirm a pending reservation"
)
async def confirm_reservation(
    reservation_id: str,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FRONT_DESK]))
):
    return await reservation_service.confirm_reservation(reservation_id, current_user.id)


@router.post(
    "/{reservation_id}/cancel",
    response_model=ReservationResponse,
    summary="Cancel a reservation and release room"
)
async def cancel_reservation(
    reservation_id: str,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FRONT_DESK]))
):
    return await reservation_service.cancel_reservation(reservation_id, current_user.id)


@router.post(
    "/{reservation_id}/check-in",
    response_model=ReservationResponse,
    summary="Check in guest (Moves reservation to CHECKED_IN and room to OCCUPIED)"
)
async def check_in_guest(
    reservation_id: str,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FRONT_DESK]))
):
    return await reservation_service.check_in_guest(reservation_id, current_user.id)


@router.post(
    "/{reservation_id}/check-out",
    response_model=ReservationResponse,
    summary="Check out guest (Moves reservation to CHECKED_OUT and room to CLEANING)"
)
async def check_out_guest(
    reservation_id: str,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FRONT_DESK]))
):
    return await reservation_service.check_out_guest(reservation_id, current_user.id)
