"""
Product Categorization Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
import logging

from app.schemas.categorization import (
    ProductCategorizationRequest,
    ProductCategorizationResponse,
    BatchCategorizationRequest,
    BatchCategorizationResponse
)
from app.services.categorization_service import CategorizationService
from app.api.dependencies import get_categorization_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/categorize", response_model=ProductCategorizationResponse)
async def categorize_product(
    request: ProductCategorizationRequest,
    service: CategorizationService = Depends(get_categorization_service)
):
    """
    Automatically categorize a product using AI
    
    - **product_name**: Product name (required)
    - **product_description**: Product description (optional)
    - **image_url**: Product image URL (optional)
    - **use_vision**: Use computer vision for categorization
    - **use_nlp**: Use NLP for categorization
    """
    logger.info(f"Categorizing product: {request.product_name}")
    
    try:
        result = await service.categorize_product(request)
        return result
    except Exception as e:
        logger.error(f"Categorization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/categorize-batch", response_model=BatchCategorizationResponse)
async def categorize_batch(
    request: BatchCategorizationRequest,
    service: CategorizationService = Depends(get_categorization_service)
):
    """
    Categorize multiple products in batch
    """
    logger.info(f"Batch categorization for {len(request.products)} products")
    
    try:
        result = await service.categorize_batch(request)
        return result
    except Exception as e:
        logger.error(f"Batch categorization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
