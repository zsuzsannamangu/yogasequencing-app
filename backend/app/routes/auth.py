from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from databases import Database
from typing import Optional
import uuid
from datetime import timedelta, datetime

from ..database import database
from ..schemas import UserRegister, UserLogin, UserResponse, Token
from ..auth import get_password_hash, verify_password, create_access_token, get_current_user_id, refresh_token, create_long_lived_token
from typing import Optional
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
            "phone": user_data.phone if user_data.phone and user_data.phone.strip() else None,
            "password_hash": hashed_password,
            "location": user_data.location if user_data.location and user_data.location.strip() else None,
            "bio": user_data.bio if user_data.bio and user_data.bio.strip() else None,
            "business_name": user_data.business_name if user_data.business_name and user_data.business_name.strip() else None,
            "business_category": user_data.business_category if user_data.business_category and user_data.business_category.strip() else None,
            "is_active": True
        }
        
        # Insert user into database
        query = """
            INSERT INTO users (id, email, first_name, last_name, phone, password_hash, location, bio, business_name, business_category, is_active)
            VALUES (:id, :email, :first_name, :last_name, :phone, :password_hash, :location, :bio, :business_name, :business_category, :is_active)
        """
        await database.execute(query, user_dict)
        
        # Return user data (without password)
        return UserResponse(
            id=user_id,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            location=user_data.location,
            bio=user_data.bio,
            business_name=user_data.business_name,
            business_category=user_data.business_category,
            profile_image=None,  # New users don't have profile images initially
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

@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Refresh an access token with extended expiration for video processing"""
    try:
        # Try to refresh the token
        new_token = refresh_token(credentials.credentials)
        
        if not new_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        return Token(
            access_token=new_token,
            token_type="bearer",
            expires_in=settings.jwt_video_processing_expire_minutes * 60  # Convert to seconds
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )

@router.post("/video-processing-token", response_model=Token)
async def create_video_processing_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a long-lived token specifically for video processing sessions"""
    try:
        # Verify current token and get user ID
        user_id = get_current_user_id(credentials.credentials)
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        # Create long-lived token
        long_token = create_long_lived_token({"user_id": user_id})
        
        return Token(
            access_token=long_token,
            token_type="bearer",
            expires_in=settings.jwt_video_processing_expire_minutes * 60  # Convert to seconds
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create video processing token: {str(e)}"
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
            phone=user["phone"],
            location=user["location"],
            bio=user["bio"],
            business_name=user["business_name"],
            business_category=user["business_category"],
            profile_image=user["profile_image"],
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

@router.get("/users/{user_id}")
async def get_user_profile(user_id: str):
    """Get public user profile by ID"""
    try:
        query = """
        SELECT id, email, first_name, last_name, location, bio, business_name, 
               business_category, profile_image, created_at
        FROM users 
        WHERE id = :user_id AND is_active = true
        """
        
        result = await database.fetch_one(query, {"user_id": user_id})
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "id": result["id"],
            "email": result["email"],
            "first_name": result["first_name"],
            "last_name": result["last_name"],
            "location": result["location"],
            "bio": result["bio"],
            "business_name": result["business_name"],
            "business_category": result["business_category"],
            "profile_image": result["profile_image"],
            "created_at": result["created_at"].isoformat() if result["created_at"] else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user profile: {str(e)}"
        )

@router.put("/users/{user_id}")
async def update_user_profile(
    user_id: str,
    user_data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update user profile"""
    try:
        # Get current user ID from JWT token
        current_user_id = get_current_user_id(credentials.credentials)
        if not current_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        # Check if user is updating their own profile
        if current_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own profile"
            )
        
        # Update user profile
        update_query = """
        UPDATE users 
        SET first_name = :first_name,
            last_name = :last_name,
            phone = :phone,
            location = :location,
            bio = :bio,
            business_name = :business_name,
            business_category = :business_category
        WHERE id = :user_id
        """
        
        await database.execute(update_query, {
            "user_id": user_id,
            "first_name": user_data.get("first_name"),
            "last_name": user_data.get("last_name"),
            "phone": user_data.get("phone") if user_data.get("phone") and user_data.get("phone").strip() else None,
            "location": user_data.get("location") if user_data.get("location") and user_data.get("location").strip() else None,
            "bio": user_data.get("bio") if user_data.get("bio") and user_data.get("bio").strip() else None,
            "business_name": user_data.get("business_name") if user_data.get("business_name") and user_data.get("business_name").strip() else None,
            "business_category": user_data.get("business_category") if user_data.get("business_category") and user_data.get("business_category").strip() else None
        })
        
        return {"message": "Profile updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )
