from fastapi import APIRouter
from app.api.v1 import pairs, drawings

api_router = APIRouter()

# Include routers
api_router.include_router(pairs.router, prefix="/pairs", tags=["pairs"])
api_router.include_router(drawings.router, prefix="/drawings", tags=["drawings"])

