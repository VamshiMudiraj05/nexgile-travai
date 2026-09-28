from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.security import get_current_user, require_role
from app.schemas.room import (
    RoomCreate,
    RoomUpdate,
    RoomStatusUpdate,
    RoomResponse,
    PaginatedRoomResponse,
)
from app.schemas.user import UserResponse, UserRole
from app.services.room_service import room_service

router = APIRouter(tags=["Rooms"])


@router.post(
    "/properties/{property_id}/rooms",
    response_model=RoomResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new room in a property (Admin only)"
)
async def create_room(
    property_id: str,
    room_in: RoomCreate,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    return await room_service.create_room(property_id, room_in)


@router.get(
    "/properties/{property_id}/rooms",
    response_model=PaginatedRoomResponse,
    summary="Get paginated list of rooms for a property"
)
async def get_rooms_by_property(
    property_id: str,
    status: Optional[str] = None,
    room_type_id: Optional[str] = None,
    floor: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_current_user)
):
    return await room_service.get_rooms(
        property_id=property_id,
        status_filter=status,
        room_type_id=room_type_id,
        floor=floor,
        search=search,
        page=page,
        limit=limit,
    )


@router.get(
    "/rooms",
    response_model=PaginatedRoomResponse,
    summary="Get all rooms across properties (filter-enabled)"
)
async def get_all_rooms(
    property_id: Optional[str] = None,
    status: Optional[str] = None,
    room_type_id: Optional[str] = None,
    floor: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(get_current_user)
):
    return await room_service.get_rooms(
        property_id=property_id,
        status_filter=status,
        room_type_id=room_type_id,
        floor=floor,
        search=search,
        page=page,
        limit=limit,
    )


@router.get(
    "/rooms/{room_id}",
    response_model=RoomResponse,
    summary="Get room details by ID"
)
async def get_room(
    room_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    return await room_service.get_room_by_id(room_id)


@router.put(
    "/rooms/{room_id}",
    response_model=RoomResponse,
    summary="Update room details (Admin only)"
)
async def update_room(
    room_id: str,
    room_in: RoomUpdate,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    return await room_service.update_room(room_id, room_in)


@router.patch(
    "/rooms/{room_id}/status",
    response_model=RoomResponse,
    summary="Update room status (Validates transition & logs audit history)"
)
async def update_room_status(
    room_id: str,
    status_in: RoomStatusUpdate,
    current_user: UserResponse = Depends(require_role([
        UserRole.ADMIN,
        UserRole.FRONT_DESK,
        UserRole.HOUSEKEEPING,
        UserRole.MAINTENANCE,
    ]))
):
    return await room_service.update_room_status(room_id, status_in, current_user.id)


@router.delete(
    "/rooms/{room_id}",
    summary="Delete room (Admin only)"
)
async def delete_room(
    room_id: str,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN]))
):
    return await room_service.delete_room(room_id)
