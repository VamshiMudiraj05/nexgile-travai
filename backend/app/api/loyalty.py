from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.core.security import get_current_user
from app.schemas.user import UserResponse
from app.schemas.loyalty import (
    LoyaltyAccountResponse,
    LoyaltyTransactionItem,
    LoyaltyRedeemRequest,
    LoyaltyRedeemResponse,
)
from app.services.loyalty_service import LoyaltyService

router = APIRouter(prefix="/loyalty", tags=["Loyalty Rewards & Tiers"])


@router.get(
    "/me",
    response_model=LoyaltyAccountResponse,
    summary="Get Authenticated Traveler's Loyalty Account",
)
async def get_my_loyalty(
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve loyalty points, lifetime points, current tier, and progress to next level."""
    return await LoyaltyService.get_or_create_loyalty_account(user_id=str(current_user.id))


@router.get(
    "/transactions",
    response_model=List[LoyaltyTransactionItem],
    summary="Get Loyalty Point History",
)
async def get_loyalty_transactions(
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
):
    """Retrieve historical point earnings and redemptions."""
    return await LoyaltyService.get_transactions(user_id=str(current_user.id), limit=limit)


@router.post(
    "/redeem",
    response_model=LoyaltyRedeemResponse,
    summary="Redeem Points for Rewards",
)
async def redeem_loyalty_points(
    payload: LoyaltyRedeemRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Redeem accumulated loyalty points for perks or discounts."""
    return await LoyaltyService.redeem_points(
        user_id=str(current_user.id),
        points=payload.points,
        reward_name=payload.reward_name,
        description=payload.description,
    )
