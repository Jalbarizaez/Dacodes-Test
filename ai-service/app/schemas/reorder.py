"""
Smart Reorder Schemas
"""
from pydantic import BaseModel, Field, validator
from typing import List, Dict


class SmartReorderRequest(BaseModel):
    """Request for reorder calculation"""
    product_id: str = Field(..., description="Product UUID")
    current_stock: int = Field(..., ge=0, description="Current stock level")
    lead_time_days: int = Field(..., ge=1, le=365, description="Supplier lead time")
    target_service_level: float = Field(0.95, ge=0.5, le=0.99, description="Target service level")


class SmartReorderResponse(BaseModel):
    """Response with reorder calculation"""
    product_id: str
    recommended_min_stock: int = Field(..., ge=0)
    recommended_max_stock: int = Field(..., ge=0)
    reorder_point: int = Field(..., ge=0)
    reorder_quantity: int = Field(..., ge=1)
    safety_stock: int = Field(..., ge=0)
    reasoning: str
    is_urgent: bool = False
    model_version: str = "v1.0"
    is_fallback: bool = False
    
    @validator('recommended_max_stock')
    def max_greater_than_reorder(cls, v, values):
        if 'reorder_point' in values and v <= values['reorder_point']:
            raise ValueError('recommended_max_stock must be greater than reorder_point')
        return v


class ReorderProductInput(BaseModel):
    """Single product for batch reorder"""
    product_id: str
    current_stock: int = Field(..., ge=0)
    lead_time_days: int = Field(..., ge=1, le=365)
    target_service_level: float = Field(0.95, ge=0.5, le=0.99)


class BatchReorderRequest(BaseModel):
    """Request for batch reorder calculation"""
    products: List[ReorderProductInput] = Field(..., min_items=1, max_items=100)


class BatchReorderResponse(BaseModel):
    """Response for batch reorder"""
    results: List[SmartReorderResponse]
    total_products: int
    successful: int
    failed: int
    errors: List[Dict[str, str]] = []
