from typing import List, Optional
from pydantic import BaseModel, Field


class LoyaltyAccountResponse(BaseModel):
    user_id: str
    points: int
    lifetime_points: int
    tier: str  # STANDARD, SILVER, GOLD, PLATINUM
    points_to_next_tier: int
    next_tier: Optional[str] = None


class LoyaltyTransactionItem(BaseModel):
    id: str
    user_id: str
    type: str  # EARNED, REDEEMED, ADJUSTED
    points: int
    reference: Optional[str] = None
    description: str
    created_at: str


class LoyaltyTransactionsResponse(BaseModel):
    transactions: List[LoyaltyTransactionItem]
    total: int


class LoyaltyRedeemRequest(BaseModel):
    points: int = Field(gt=0)
    reward_name: str
    description: Optional[str] = None


class LoyaltyRedeemResponse(BaseModel):
    success: bool
    redeemed_points: int
    remaining_points: int
    reward_name: str
    message: str
