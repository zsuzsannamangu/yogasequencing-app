from pydantic import BaseModel, EmailStr, validator
from typing import Optional

class UserRegister(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    password: str
    location: Optional[str] = None
    bio: Optional[str] = None
    business_name: Optional[str] = None
    business_category: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Schema for user response (without sensitive data)"""
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    business_name: Optional[str] = None
    business_category: Optional[str] = None
    profile_image: Optional[str] = None
    is_active: bool
    created_at: str

class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    """Schema for JWT token payload"""
    user_id: Optional[str] = None
    email: Optional[str] = None
