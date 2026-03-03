"""
Waste Prediction Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
import logging

from app.schemas.waste import (
    WastePredictionRequest,
    WastePredictionResponse
)
from app.services.waste_service import WasteService
from app.api.dependencies import get_waste_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/predict", response_model=WastePredictionResponse)
async def predict_waste(
    request: WastePredictionRequest,
    service: WasteService = Depends(get_waste_service)
):
    """
    Predict products at risk of waste
    
    - **prediction_horizon_days**: Days to look ahead (default 30)
    - **product_ids**: Optional list of specific products
    - **min_risk_score**: Minimum risk score threshold (0-1)
    """
    logger.info(f"Predicting waste for {request.prediction_horizon_days} days")
    
    try:
        result = await service.predict_waste(request)
        return result
    except Exception as e:
        logger.error(f"Waste prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/at-risk", response_model=WastePredictionResponse)
async def get_at_risk_products(
    min_risk_score: float = 0.7,
    limit: int = 100,
    service: WasteService = Depends(get_waste_service)
):
    """
    Get products currently at high risk of waste
    
    - **min_risk_score**: Minimum risk score (default 0.7)
    - **limit**: Maximum number of products to return
    """
    logger.info(f"Getting at-risk products (threshold: {min_risk_score})")
    
    try:
        result = await service.get_at_risk_products(min_risk_score, limit)
        return result
    except Exception as e:
        logger.error(f"Get at-risk products error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
