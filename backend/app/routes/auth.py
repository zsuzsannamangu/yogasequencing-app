from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from databases import Database
from typing import Optional
import uuid
from datetime import timedelta

from ..database import database
from ..schemas import UserRegister, UserLogin, UserResponse, Token
from ..auth import get_password_hash, verify_password, create_access_token
# We're using raw SQL queries instead of SQLAlchemy models
from ..config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegister):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = await database.fetch_one(
            "SELECT * FROM users WHERE email = :email",
            {"email": user_data.email}
        )
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Generate unique user ID
        user_id = str(uuid.uuid4())
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        
        # Create user data
        user_dict = {
            "id": user_id,
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "password_hash": hashed_password,
            "location": user_data.location,
            "bio": user_data.bio,
            "business_name": user_data.business_name,
            "business_category": user_data.business_category,
            "is_active": True
        }
        
        # Insert user into database
        query = """
            INSERT INTO users (id, email, first_name, last_name, password_hash, location, bio, business_name, business_category, is_active)
            VALUES (:id, :email, :first_name, :last_name, :password_hash, :location, :bio, :business_name, :business_category, :is_active)
        """
        await database.execute(query, user_dict)
        
        # Return user data (without password)
        return UserResponse(
            id=user_id,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            location=user_data.location,
            bio=user_data.bio,
            business_name=user_data.business_name,
            business_category=user_data.business_category,
            is_active=True,
            created_at="2024-12-01T00:00:00"  # Default timestamp
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login_user(user_data: UserLogin):
    """Login user and return JWT token"""
    try:
        # Find user by email
        user = await database.fetch_one(
            "SELECT * FROM users WHERE email = :email",
            {"email": user_data.email}
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(user_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if user is active
        if not user["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.jwt_expire_minutes)
        access_token = create_access_token(
            data={"user_id": user["id"], "email": user["email"]},
            expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.jwt_expire_minutes * 60  # Convert to seconds
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get current user information"""
    try:
        # Verify token and get user ID
        from ..auth import get_current_user_id
        user_id = get_current_user_id(credentials.credentials)
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Get user from database
        user = await database.fetch_one(
            "SELECT * FROM users WHERE id = :user_id",
            {"user_id": user_id}
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=user["id"],
            email=user["email"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            location=user["location"],
            bio=user["bio"],
            business_name=user["business_name"],
            business_category=user["business_category"],
            is_active=user["is_active"],
            created_at=str(user["created_at"]) if user["created_at"] else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user: {str(e)}"
        )
