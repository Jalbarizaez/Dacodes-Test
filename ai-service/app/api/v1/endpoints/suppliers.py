"""
Supplier Scoring Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Path
import logging

from app.schemas.suppliers import (
    SupplierScoringRequest,
    SupplierScoringResponse
)
from app.services.supplier_service import SupplierService
from app.api.dependencies import get_supplier_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/score", response_model=SupplierScoringResponse)
async def score_supplier(
    request: SupplierScoringRequest,
    service: SupplierService = Depends(get_supplier_service)
):
    """
    Calculate supplier performance score
    
    - **supplier_id**: Supplier UUID
    - **evaluation_period_days**: Period to evaluate (default 90 days)
    """
    logger.info(f"Scoring supplier {request.supplier_id}")
    
    try:
        result = await service.score_supplier(request)
        return result
    except Exception as e:
        logger.error(f"Supplier scoring error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{supplier_id}/score", response_model=SupplierScoringResponse)
async def get_supplier_score(
    supplier_id: str = Path(..., description="Supplier UUID"),
    evaluation_period_days: int = 90,
    service: SupplierService = Depends(get_supplier_service)
):
    """
    Get latest supplier score
    """
    logger.info(f"Getting score for supplier {supplier_id}")
    
    try:
        request = SupplierScoringRequest(
            supplier_id=supplier_id,
            evaluation_period_days=evaluation_period_days
        )
        result = await service.score_supplier(request)
        return result
    except Exception as e:
        logger.error(f"Get supplier score error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
