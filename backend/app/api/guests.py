from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.security import get_current_user, require_role
from app.schemas.guest import (
    GuestCreate,
    GuestUpdate,
    GuestResponse,
    PaginatedGuestResponse,
)
from app.schemas.user import UserResponse, UserRole
from app.services.guest_service import guest_service

router = APIRouter(prefix="/guests", tags=["Guests"])


@router.post(
    "",
    response_model=GuestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new guest profile"
)
async def create_guest(
    guest_in: GuestCreate,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FRONT_DESK]))
):
    return await guest_service.create_guest(guest_in)


@router.get(
    "",
    response_model=PaginatedGuestResponse,
    summary="Get paginated list of guest profiles with search"
)
async def get_guests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    current_user: UserResponse = Depends(get_current_user)
):
    return await guest_service.get_guests(page=page, limit=limit, search=search)


@router.get(
    "/{guest_id}",
    response_model=GuestResponse,
    summary="Get guest profile details by ID"
)
async def get_guest(
    guest_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    return await guest_service.get_guest_by_id(guest_id)


@router.put(
    "/{guest_id}",
    response_model=GuestResponse,
    summary="Update guest profile details"
)
async def update_guest(
    guest_id: str,
    guest_in: GuestUpdate,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.FRONT_DESK]))
):
    return await guest_service.update_guest(guest_id, guest_in)


@router.delete(
    "/{guest_id}",
    summary="Delete guest profile (Admin only)"
)
async def delete_guest(
    guest_id: str,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    return await guest_service.delete_guest(guest_id)
