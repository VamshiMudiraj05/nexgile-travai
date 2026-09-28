from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user"
)
async def register(user_in: UserCreate):
    """
    Register a new user in the platform.
    
    - Validates email and password requirements
    - Rejects duplicate email registrations
    - Securely hashes password before storing in MongoDB
    - Returns safe user representation (no password hash)
    """
    return await auth_service.register_user(user_in)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and obtain JWT token"
)
async def login(login_in: LoginRequest):
    """
    Authenticate a user with email and password.
    
    - Verifies bcrypt hashed password
    - Generates and returns a signed JWT access token
    - Returns authenticated user details and role
    """
    return await auth_service.authenticate_user(login_in)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user details"
)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """
    Retrieve the current logged-in user's profile.
    
    - Requires a valid Bearer JWT token in Authorization header
    - Validates token expiration and signature
    - Returns current user details
    """
    return current_user
