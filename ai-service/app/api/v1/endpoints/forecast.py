"""
Demand Forecasting Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List
import logging

from app.schemas.forecast import (
    DemandForecastRequest,
    DemandForecastResponse,
    BatchForecastRequest,
    BatchForecastResponse
)
from app.services.forecast_service import ForecastService
from app.api.dependencies import get_forecast_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/demand", response_model=DemandForecastResponse)
async def forecast_demand(
    request: DemandForecastRequest,
    service: ForecastService = Depends(get_forecast_service)
):
    """
    Generate demand forecast for a product
    
    - **product_id**: Product UUID
    - **forecast_horizon_days**: Number of days to forecast (1-365)
    - **include_seasonality**: Detect seasonal patterns
    - **include_trends**: Analyze trends
    """
    logger.info(f"Forecasting demand for product {request.product_id}")
    
    try:
        result = await service.forecast_demand(request)
        return result
    except Exception as e:
        logger.error(f"Forecast error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=BatchForecastResponse)
async def forecast_batch(
    request: BatchForecastRequest,
    service: ForecastService = Depends(get_forecast_service)
):
    """
    Generate forecasts for multiple products in batch
    
    - **product_ids**: List of product UUIDs
    - **forecast_horizon_days**: Number of days to forecast
    """
    logger.info(f"Batch forecasting for {len(request.product_ids)} products")
    
    try:
        result = await service.forecast_batch(request)
        return result
    except Exception as e:
        logger.error(f"Batch forecast error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
