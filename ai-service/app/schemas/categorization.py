"""
Product Categorization Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class ProductCategorizationRequest(BaseModel):
    """Request for product categorization"""
    product_name: str = Field(..., min_length=1, max_length=200)
    product_description: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = None
    use_vision: bool = False
    use_nlp: bool = True


class ProductCategorizationResponse(BaseModel):
    """Response with categorization"""
    suggested_category_id: str
    category_name: str
    confidence: float = Field(..., ge=0, le=1)
    suggested_attributes: Dict[str, str]
    reasoning: str
    model_version: str = "v1.0"


class ProductInput(BaseModel):
    """Single product for batch categorization"""
    product_name: str = Field(..., min_length=1, max_length=200)
    product_description: Optional[str] = None
    image_url: Optional[str] = None


class BatchCategorizationRequest(BaseModel):
    """Request for batch categorization"""
    products: List[ProductInput] = Field(..., min_items=1, max_items=50)
    use_vision: bool = False
    use_nlp: bool = True


class BatchCategorizationResponse(BaseModel):
    """Response for batch categorization"""
    results: List[ProductCategorizationResponse]
    total_products: int
    successful: int
    failed: int
    errors: List[Dict[str, str]] = []
