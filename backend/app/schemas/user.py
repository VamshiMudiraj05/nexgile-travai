from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    FRONT_DESK = "FRONT_DESK"
    REVENUE_MANAGER = "REVENUE_MANAGER"
    HOUSEKEEPING = "HOUSEKEEPING"
    MAINTENANCE = "MAINTENANCE"
    FINANCE = "FINANCE"
    TRAVELER = "TRAVELER"


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["John Doe"])
    email: EmailStr = Field(..., examples=["john@example.com"])
    role: UserRole = Field(default=UserRole.TRAVELER, examples=["TRAVELER"])


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128, examples=["secretpassword123"])


class UserResponse(BaseModel):
    id: str = Field(..., alias="_id", examples=["65e01234567890abcdef1234"])
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "65e01234567890abcdef1234",
                "name": "John Doe",
                "email": "john@example.com",
                "role": "TRAVELER",
                "is_active": True,
                "created_at": "2026-09-08T12:00:00Z"
            }
        }
    }


class UserInDB(UserBase):
    id: Optional[str] = None
    password_hash: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
