"""
Supplier Scoring Schemas
"""
from pydantic import BaseModel, Field, validator
from typing import List
from datetime import date


class SupplierScoringRequest(BaseModel):
    """Request for supplier scoring"""
    supplier_id: str = Field(..., description="Supplier UUID")
    evaluation_period_days: int = Field(90, ge=1, le=365, description="Evaluation period")


class SupplierScoringResponse(BaseModel):
    """Response with supplier score"""
    supplier_id: str
    score_date: date
    overall_score: float = Field(..., ge=0, le=100)
    on_time_delivery_rate: float = Field(..., ge=0, le=1)
    defect_rate: float = Field(..., ge=0, le=1)
    price_competitiveness: float = Field(..., ge=0, le=1)
    responsiveness_score: float = Field(..., ge=0, le=1)
    recommendation: str = Field(..., pattern="^(excellent|good|acceptable|review_needed)$")
    suggested_actions: List[str]
    model_version: str = "v1.0"
    is_fallback: bool = False
    
    @validator('recommendation')
    def validate_recommendation(cls, v, values):
        if 'overall_score' in values:
            score = values['overall_score']
            expected = (
                "excellent" if score >= 85 else
                "good" if score >= 70 else
                "acceptable" if score >= 55 else
                "review_needed"
            )
            if v != expected:
                raise ValueError(f'Recommendation {v} does not match score {score}')
        return v
