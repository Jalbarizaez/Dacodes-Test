"""
Visual Stock Counting Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
import logging

from app.schemas.visual import (
    VisualCountingRequest,
    VisualCountingResponse,
    ImageQualityRequest,
    ImageQualityResponse
)
from app.services.visual_service import VisualService
from app.api.dependencies import get_visual_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/count", response_model=VisualCountingResponse)
async def count_visual_stock(
    request: VisualCountingRequest,
    service: VisualService = Depends(get_visual_service)
):
    """
    Count items in shelf image using computer vision
    
    - **image_url**: URL of the shelf image
    - **expected_product_id**: Expected product UUID (optional)
    - **location_id**: Location UUID
    """
    logger.info(f"Visual counting for location {request.location_id}")
    
    try:
        result = await service.count_items(request)
        return result
    except Exception as e:
        logger.error(f"Visual counting error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify", response_model=VisualCountingResponse)
async def verify_count(
    request: VisualCountingRequest,
    service: VisualService = Depends(get_visual_service)
):
    """
    Verify a manual count against visual detection
    """
    logger.info(f"Verifying count for location {request.location_id}")
    
    try:
        result = await service.verify_count(request)
        return result
    except Exception as e:
        logger.error(f"Count verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quality", response_model=ImageQualityResponse)
async def assess_image_quality(
    request: ImageQualityRequest,
    service: VisualService = Depends(get_visual_service)
):
    """
    Assess image quality before processing
    """
    logger.info("Assessing image quality")
    
    try:
        result = await service.assess_quality(request)
        return result
    except Exception as e:
        logger.error(f"Quality assessment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
