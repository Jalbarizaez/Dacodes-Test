"""
Anomaly Detection Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
import logging

from app.schemas.anomalies import (
    AnomalyDetectionRequest,
    AnomalyDetectionResponse
)
from app.services.anomaly_service import AnomalyService
from app.api.dependencies import get_anomaly_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/detect", response_model=AnomalyDetectionResponse)
async def detect_anomalies(
    request: AnomalyDetectionRequest,
    service: AnomalyService = Depends(get_anomaly_service)
):
    """
    Detect anomalies in stock movements and levels
    
    - **detection_type**: Type of anomaly to detect (movement, stock_level, transaction)
    - **time_window_days**: Time window to analyze (default 7 days)
    - **product_ids**: Optional list of specific products
    - **location_ids**: Optional list of specific locations
    """
    logger.info(f"Detecting {request.detection_type} anomalies")
    
    try:
        result = await service.detect_anomalies(request)
        return result
    except Exception as e:
        logger.error(f"Anomaly detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent", response_model=AnomalyDetectionResponse)
async def get_recent_anomalies(
    hours: int = 24,
    severity: str = None,
    service: AnomalyService = Depends(get_anomaly_service)
):
    """
    Get recent anomalies detected in the last N hours
    
    - **hours**: Number of hours to look back (default 24)
    - **severity**: Filter by severity (critical, warning, info)
    """
    logger.info(f"Getting anomalies from last {hours} hours")
    
    try:
        result = await service.get_recent_anomalies(hours, severity)
        return result
    except Exception as e:
        logger.error(f"Get recent anomalies error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
