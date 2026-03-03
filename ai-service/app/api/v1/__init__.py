"""
API v1 Router
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    forecast,
    reorder,
    suppliers,
    anomalies,
    categorization,
    visual,
    nlq,
    waste,
    health
)

api_router = APIRouter()

# Include all module routers
api_router.include_router(forecast.router, prefix="/forecast", tags=["Demand Forecasting"])
api_router.include_router(reorder.router, prefix="/reorder", tags=["Smart Reorder"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Supplier Scoring"])
api_router.include_router(anomalies.router, prefix="/anomalies", tags=["Anomaly Detection"])
api_router.include_router(categorization.router, prefix="/products", tags=["Product Categorization"])
api_router.include_router(visual.router, prefix="/visual", tags=["Visual Counting"])
api_router.include_router(nlq.router, prefix="/nlq", tags=["Natural Language Queries"])
api_router.include_router(waste.router, prefix="/waste", tags=["Waste Prediction"])
api_router.include_router(health.router, tags=["Health & Status"])
