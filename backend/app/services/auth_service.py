from datetime import datetime, timezone
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.logging import logger
from app.core.security import hash_password, verify_password, create_access_token
from app.database.mongodb import get_database
from app.models.user import user_helper
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserResponse


class AuthService:
    @staticmethod
    async def register_user(user_in: UserCreate) -> UserResponse:
        """Register a new user in MongoDB."""
        db = get_database()
        users_col = db.get_collection("users")
        
        # Check if email is already registered
        existing_user = await users_col.find_one({"email": user_in.email.lower()})
        if existing_user:
            logger.warning(f"Registration attempt with duplicate email: {user_in.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )
        
        now = datetime.now(timezone.utc)
        user_doc = {
            "name": user_in.name.strip(),
            "email": user_in.email.lower().strip(),
            "password_hash": hash_password(user_in.password),
            "role": user_in.role.value if hasattr(user_in.role, "value") else str(user_in.role),
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        
        try:
            result = await users_col.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            logger.info(f"Successfully registered user {user_in.email} with role {user_in.role}")
            
            serialized = user_helper(user_doc)
            return UserResponse(
                _id=serialized["id"],
                name=serialized["name"],
                email=serialized["email"],
                role=serialized["role"],
                is_active=serialized["is_active"],
                created_at=serialized["created_at"],
                updated_at=serialized["updated_at"],
            )
        except DuplicateKeyError:
            logger.warning(f"Duplicate key collision on email: {user_in.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while creating the user account."
            )

    @staticmethod
    async def authenticate_user(login_in: LoginRequest) -> TokenResponse:
        """Authenticate user credentials and issue a JWT token."""
        db = get_database()
        users_col = db.get_collection("users")
        
        user_doc = await users_col.find_one({"email": login_in.email.lower().strip()})
        if not user_doc:
            logger.warning(f"Login failed: User not found for email: {login_in.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not verify_password(login_in.password, user_doc.get("password_hash", "")):
            logger.warning(f"Login failed: Invalid password for email: {login_in.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user_doc.get("is_active", True):
            logger.warning(f"Login rejected: Account is inactive for user: {login_in.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please contact your system administrator.",
            )
        
        serialized = user_helper(user_doc)
        token_payload = {
            "sub": serialized["id"],
            "email": serialized["email"],
            "role": serialized["role"]
        }
        
        access_token = create_access_token(data=token_payload)
        logger.info(f"User {serialized['email']} ({serialized['role']}) logged in successfully")
        
        user_response = UserResponse(
            _id=serialized["id"],
            name=serialized["name"],
            email=serialized["email"],
            role=serialized["role"],
            is_active=serialized["is_active"],
            created_at=serialized["created_at"],
            updated_at=serialized["updated_at"],
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )


auth_service = AuthService()
