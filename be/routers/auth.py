"""
Example Protected Routes using PocketBase Authentication

This router demonstrates how to use the auth dependency to protect routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["auth"])


@router.get("/me")
async def get_current_user_info(user: dict = Depends(get_current_user)):
    """
    Example protected route that returns the current authenticated user.
    
    This endpoint requires a valid PocketBase JWT token in the Authorization header:
    Authorization: Bearer <token>
    
    Returns:
        dict: User information from the JWT payload
    """
    return {
        "user_id": user.get("id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "verified": user.get("verified", False),
    }


@router.get("/protected")
async def protected_example(user: dict = Depends(get_current_user)):
    """
    Another example of a protected route.
    
    All routes using `Depends(get_current_user)` require authentication.
    """
    return {
        "message": "This is a protected route",
        "user_id": user.get("id"),
        "authenticated": True,
    }
