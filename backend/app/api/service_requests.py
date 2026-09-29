from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from app.core.security import get_current_user
from app.schemas.user import UserResponse
from app.schemas.service_request import (
    ServiceRequestCreate,
    ServiceRequestResponse,
)
from app.services.service_request_service import ServiceRequestService

router = APIRouter(prefix="/service-requests", tags=["Guest Service Requests"])


@router.post(
    "",
    response_model=ServiceRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a Guest Service Request",
)
async def create_service_request(
    payload: ServiceRequestCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    """Submit a housekeeping, maintenance, transportation, or concierge service request."""
    user_dict = {
        "_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
    }
    return await ServiceRequestService.create_service_request(
        user=user_dict,
        payload=payload.model_dump(),
    )


@router.get(
    "",
    response_model=List[ServiceRequestResponse],
    summary="List Service Requests for Authenticated User",
)
async def list_service_requests(
    reservation_id: Optional[str] = Query(None, description="Optional reservation filter"),
    status: Optional[str] = Query(None, description="Filter by status (OPEN, IN_PROGRESS, COMPLETED)"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve service requests submitted by the traveler or relevant to their stay."""
    return await ServiceRequestService.list_service_requests(
        user_id=str(current_user.id),
        reservation_id=reservation_id,
        status_filter=status,
    )


@router.get(
    "/{request_id}",
    response_model=Optional[ServiceRequestResponse],
    summary="Get Service Request Details",
)
async def get_service_request(
    request_id: str = Path(..., description="Service request ID"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve details and live status of a specific service request."""
    return await ServiceRequestService.get_service_request(request_id)
