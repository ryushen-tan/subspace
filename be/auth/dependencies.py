"""
PocketBase JWT Authentication Dependency (v0.36.1)

This module provides a reusable FastAPI dependency for verifying PocketBase JWTs.

IMPORTANT: PocketBase v0.36.1 uses HS256 (symmetric secret), NOT RS256.
- JWTs are signed with a server-side secret
- JWTs CANNOT be verified client-side
- JWTs are OPAQUE tokens - only PocketBase can verify them
- No public keys exist - tokens must be validated via PocketBase API

Architecture:
- FastAPI NEVER handles passwords or login
- FastAPI ONLY trusts PocketBase JWTs sent via Authorization: Bearer <token>
- Token verification is done by calling PocketBase's API
- Auth logic is centralized and reusable

Usage:
    from auth.dependencies import get_current_user
    
    @app.get("/api/protected")
    async def protected_route(user: dict = Depends(get_current_user)):
        return {"user_id": user["id"], "email": user["email"]}
"""

import os
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config.settings import get_settings

# Security scheme for extracting Bearer token
security = HTTPBearer()


async def verify_pocketbase_token(token: str) -> dict:
    """
    Verify a PocketBase JWT token by calling PocketBase's API.
    
    PocketBase v0.36.1 uses HS256 (symmetric secret), so tokens are opaque.
    We validate tokens by making an authenticated request to PocketBase.
    
    Args:
        token: JWT token string (opaque, cannot be decoded client-side)
        
    Returns:
        dict: User information from PocketBase
        
    Raises:
        HTTPException: If token is invalid, expired, or verification fails
    """
    settings = get_settings()
    pb_url = settings.pocketbase_url or os.getenv('POCKETBASE_URL', 'http://127.0.0.1:8090')
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Validate token by calling PocketBase's auth refresh endpoint
            # This endpoint validates the token and returns user data if valid
            response = await client.post(
                f'{pb_url}/api/collections/users/auth-refresh',
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json',
                },
                json={}  # Empty body for refresh endpoint
            )
            
            if response.status_code == 200:
                data = response.json()
                record = data.get('record', {})
                
                # Return user data from PocketBase response
                return {
                    'id': record.get('id'),
                    'email': record.get('email'),
                    'name': record.get('name', ''),
                    'verified': record.get('verified', False),
                    'created': record.get('created', ''),
                    'updated': record.get('updated', ''),
                }
            elif response.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token"
                )
            else:
                error_detail = response.text
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Token validation failed: {error_detail}"
                )
                
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PocketBase service timeout - token validation failed"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to connect to PocketBase: {str(e)}"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    FastAPI dependency that extracts and verifies PocketBase JWT.
    
    This validates the token by calling PocketBase's API (since tokens are opaque).
    
    Usage:
        @app.get("/api/protected")
        async def protected_route(user: dict = Depends(get_current_user)):
            return {"user_id": user["id"], "email": user["email"]}
    
    Returns:
        dict: Authenticated user payload from PocketBase
        
    Raises:
        HTTPException: 401 if token is missing, invalid, or expired
    """
    token = credentials.credentials
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token missing"
        )
    
    # Verify token via PocketBase API (tokens are opaque, cannot decode)
    user_payload = await verify_pocketbase_token(token)
    
    return user_payload
