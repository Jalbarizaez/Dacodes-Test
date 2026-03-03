"""
Smart Reorder Service
"""
import logging
import math
from scipy import stats

from app.schemas.reorder import (
    SmartReorderRequest,
    SmartReorderResponse,
    BatchReorderRequest,
    BatchReorderResponse
)
from app.core.exceptions import PredictionError

logger = logging.getLogger(__name__)


class ReorderService:
    """Service for smart reorder calculations"""
    
    def __init__(self):
        self.model_version = "v1.0"
    
    async def calculate_reorder(
        self,
        request: SmartReorderRequest
    ) -> SmartReorderResponse:
        """
        Calculate optimal reorder points
        
        TODO: Integrate with forecast service for demand prediction
        """
        logger.info(f"Calculating reorder for product {request.product_id}")
        
        try:
            # TODO: Get demand forecast from forecast service
            avg_daily_demand = 10  # Placeholder
            demand_std_dev = 3  # Placeholder
            
            # Calculate safety stock using service level
            z_score = stats.norm.ppf(request.target_service_level)
            safety_stock = int(z_score * demand_std_dev * math.sqrt(request.lead_time_days))
            
            # Calculate reorder point
            lead_time_demand = avg_daily_demand * request.lead_time_days
            reorder_point = int(lead_time_demand + safety_stock)
            
            # Calculate min/max stock levels
            recommended_min_stock = safety_stock
            recommended_max_stock = reorder_point + int(avg_daily_demand * 30)  # 30 days buffer
            
            # Calculate reorder quantity (Economic Order Quantity simplified)
            reorder_quantity = max(int(avg_daily_demand * 14), 1)  # 2 weeks supply
            
            # Check if urgent
            is_urgent = request.current_stock < reorder_point
            
            reasoning = (
                f"Based on average daily demand of {avg_daily_demand} units, "
                f"lead time of {request.lead_time_days} days, and "
                f"target service level of {request.target_service_level:.0%}, "
                f"we recommend maintaining stock between {recommended_min_stock} and {recommended_max_stock} units."
            )
            
            return SmartReorderResponse(
                product_id=request.product_id,
                recommended_min_stock=recommended_min_stock,
                recommended_max_stock=recommended_max_stock,
                reorder_point=reorder_point,
                reorder_quantity=reorder_quantity,
                safety_stock=safety_stock,
                reasoning=reasoning,
                is_urgent=is_urgent,
                model_version=self.model_version,
                is_fallback=True
            )
            
        except Exception as e:
            logger.error(f"Reorder calculation error: {str(e)}")
            raise PredictionError(str(e), "reorder_optimization")
    
    async def calculate_batch(
        self,
        request: BatchReorderRequest
    ) -> BatchReorderResponse:
        """Calculate reorder for multiple products"""
        results = []
        errors = []
        successful = 0
        
        for product_input in request.products:
            try:
                reorder_request = SmartReorderRequest(**product_input.dict())
                result = await self.calculate_reorder(reorder_request)
                results.append(result)
                successful += 1
            except Exception as e:
                errors.append({
                    "product_id": product_input.product_id,
                    "error": str(e)
                })
        
        return BatchReorderResponse(
            results=results,
            total_products=len(request.products),
            successful=successful,
            failed=len(errors),
            errors=errors
        )
