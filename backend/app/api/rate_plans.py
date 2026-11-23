from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from app.core.security import get_current_user, require_role
from app.schemas.user import UserResponse, UserRole
from app.schemas.rate_plan import (
    RatePlanCreate,
    RatePlanUpdate,
    RatePlanResponse,
    StayValidationRequest,
    StayValidationResponse,
)
from app.services.rate_plan_service import RatePlanService

router = APIRouter(prefix="/rate-plans", tags=["Rate Plans & Stay Restrictions"])


@router.get(
    "",
    response_model=List[RatePlanResponse],
    summary="List Rate Plans & Packages",
)
async def list_rate_plans(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    room_type_id: Optional[str] = Query(None, description="Filter by room type ID"),
    active_only: bool = Query(False, description="Filter active plans only"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve rate plans, stay restrictions, and package inclusions for a property."""
    return await RatePlanService.list_rate_plans(
        property_id=property_id,
        room_type_id=room_type_id,
        active_only=active_only,
    )


@router.get(
    "/{rate_plan_id}",
    response_model=RatePlanResponse,
    summary="Get Rate Plan by ID",
)
async def get_rate_plan(
    rate_plan_id: str = Path(..., description="Rate plan ID"),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve detailed rate plan configuration and stay restrictions."""
    return await RatePlanService.get_rate_plan(rate_plan_id)


@router.post(
    "",
    response_model=RatePlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Rate Plan or Package",
)
async def create_rate_plan(
    payload: RatePlanCreate = ...,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER])),
):
    """Create a new rate plan with MinLOS, MaxLOS, CTA, CTD restrictions and package inclusions."""
    return await RatePlanService.create_rate_plan(payload.model_dump())


@router.put(
    "/{rate_plan_id}",
    response_model=RatePlanResponse,
    summary="Update Rate Plan or Stay Restrictions",
)
async def update_rate_plan(
    rate_plan_id: str = Path(..., description="Rate plan ID"),
    payload: RatePlanUpdate = ...,
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER])),
):
    """Update pricing multipliers, meal plans, or calendar restrictions."""
    return await RatePlanService.update_rate_plan(
        rate_plan_id=rate_plan_id,
        payload=payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/{rate_plan_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Rate Plan",
)
async def delete_rate_plan(
    rate_plan_id: str = Path(..., description="Rate plan ID"),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.REVENUE_MANAGER])),
):
    """Remove a rate plan."""
    await RatePlanService.delete_rate_plan(rate_plan_id)
    return None


@router.post(
    "/validate-stay",
    response_model=StayValidationResponse,
    summary="Validate Stay Against Rate Plan Restrictions",
)
async def validate_stay(
    payload: StayValidationRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Validate check-in and check-out dates against MinLOS, MaxLOS, CTA, CTD, and advance purchase rules."""
    return await RatePlanService.validate_stay_and_calculate(
        rate_plan_id=payload.rate_plan_id,
        check_in_str=payload.check_in_date,
        check_out_str=payload.check_out_date,
        base_nightly_rate=payload.base_nightly_rate,
    )
