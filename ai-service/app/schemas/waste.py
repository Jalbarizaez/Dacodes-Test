"""
Waste Prediction Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import date


class WastePredictionRequest(BaseModel):
    """Request for waste prediction"""
    prediction_horizon_days: int = Field(30, ge=1, le=365)
    product_ids: Optional[List[str]] = None
    min_risk_score: float = Field(0.5, ge=0, le=1)


class WastePrediction(BaseModel):
    """Single waste prediction"""
    product_id: str
    risk_score: float = Field(..., ge=0, le=1)
    reason: str
    expiration_date: Optional[date] = None
    suggested_action: str
    priority: str = Field(..., pattern="^(urgent|high|medium|low)$")
    estimated_loss_value: float = Field(..., ge=0)


class RecommendedAction(BaseModel):
    """Recommended action to prevent waste"""
    action_type: str
    product_id: str
    priority: str
    details: str


class WastePredictionResponse(BaseModel):
    """Response with waste predictions"""
    predictions: List[WastePrediction]
    total_at_risk_value: float = Field(..., ge=0)
    total_at_risk_units: int = Field(..., ge=0)
    recommended_actions: List[RecommendedAction]
    prediction_date: date
    model_version: str = "v1.0"
