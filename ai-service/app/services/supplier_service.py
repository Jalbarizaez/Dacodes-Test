"""
Supplier Scoring Service
"""
import logging
from datetime import date

from app.schemas.suppliers import SupplierScoringRequest, SupplierScoringResponse
from app.core.exceptions import PredictionError

logger = logging.getLogger(__name__)


class SupplierService:
    """Service for supplier performance scoring"""
    
    def __init__(self):
        self.model_version = "v1.0"
    
    async def score_supplier(self, request: SupplierScoringRequest) -> SupplierScoringResponse:
        """Calculate supplier performance score"""
        logger.info(f"Scoring supplier {request.supplier_id}")
        
        try:
            # TODO: Fetch actual data from database
            on_time_rate = 0.85
            defect_rate = 0.05
            price_comp = 0.90
            responsiveness = 0.88
            
            # Weighted average: on-time (35%), defect (25%), price (25%), responsiveness (15%)
            overall_score = (
                on_time_rate * 35 +
                (1 - defect_rate) * 25 +
                price_comp * 25 +
                responsiveness * 15
            )
            
            # Determine recommendation
            if overall_score >= 85:
                recommendation = "excellent"
                actions = ["Continue partnership", "Consider volume increase"]
            elif overall_score >= 70:
                recommendation = "good"
                actions = ["Maintain current relationship", "Monitor performance"]
            elif overall_score >= 55:
                recommendation = "acceptable"
                actions = ["Request performance improvement plan", "Increase monitoring"]
            else:
                recommendation = "review_needed"
                actions = ["Urgent review required", "Consider alternative suppliers"]
            
            return SupplierScoringResponse(
                supplier_id=request.supplier_id,
                score_date=date.today(),
                overall_score=overall_score,
                on_time_delivery_rate=on_time_rate,
                defect_rate=defect_rate,
                price_competitiveness=price_comp,
                responsiveness_score=responsiveness,
                recommendation=recommendation,
                suggested_actions=actions,
                model_version=self.model_version,
                is_fallback=True
            )
        except Exception as e:
            logger.error(f"Supplier scoring error: {str(e)}")
            raise PredictionError(str(e), "supplier_scoring")
