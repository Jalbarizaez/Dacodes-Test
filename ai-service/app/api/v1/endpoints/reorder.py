"""
Smart Reorder Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
import logging

from app.schemas.reorder import (
    SmartReorderRequest,
    SmartReorderResponse,
    BatchReorderRequest,
    BatchReorderResponse
)
from app.services.reorder_service import ReorderService
from app.api.dependencies import get_reorder_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/calculate", response_model=SmartReorderResponse)
async def calculate_reorder(
    request: SmartReorderRequest,
    service: ReorderService = Depends(get_reorder_service)
):
    """
    Calculate optimal reorder points and quantities
    
    - **product_id**: Product UUID
    - **current_stock**: Current stock level
    - **lead_time_days**: Supplier lead time in days
    - **target_service_level**: Target service level (0.5-0.99)
    """
    logger.info(f"Calculating reorder for product {request.product_id}")
    
    try:
        result = await service.calculate_reorder(request)
        return result
    except Exception as e:
        logger.error(f"Reorder calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=BatchReorderResponse)
async def calculate_batch_reorder(
    request: BatchReorderRequest,
    service: ReorderService = Depends(get_reorder_service)
):
    """
    Calculate reorder points for multiple products
    """
    logger.info(f"Batch reorder calculation for {len(request.products)} products")
    
    try:
        result = await service.calculate_batch(request)
        return result
    except Exception as e:
        logger.error(f"Batch reorder error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
