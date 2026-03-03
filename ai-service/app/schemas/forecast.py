"""
Demand Forecasting Schemas
"""
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
from datetime import date, datetime


class DemandForecastRequest(BaseModel):
    """Request for demand forecast"""
    product_id: str = Field(..., description="Product UUID")
    forecast_horizon_days: int = Field(30, ge=1, le=365, description="Number of days to forecast")
    include_seasonality: bool = Field(True, description="Include seasonality analysis")
    include_trends: bool = Field(True, description="Include trend analysis")
    include_events: bool = Field(False, description="Include special events impact")
    historical_days: int = Field(365, ge=30, le=730, description="Days of historical data to use")


class ForecastDataPoint(BaseModel):
    """Single forecast data point"""
    forecast_period: date = Field(..., description="Date of the forecast")
    predicted_demand: float = Field(..., ge=0, description="Predicted demand quantity")
    confidence_lower: float = Field(..., ge=0, description="Lower confidence bound")
    confidence_upper: float = Field(..., ge=0, description="Upper confidence bound")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")
    trend_component: Optional[float] = Field(None, description="Trend contribution")
    seasonal_component: Optional[float] = Field(None, description="Seasonal contribution")
    event_impact: Optional[float] = Field(None, description="Special event impact")


class SeasonalityInfo(BaseModel):
    """Seasonality analysis information"""
    detected: bool
    pattern_type: Optional[str] = Field(None, description="weekly, monthly, quarterly")
    strength: Optional[float] = Field(None, ge=0, le=1, description="Seasonality strength")
    peak_periods: Optional[List[str]] = Field(None, description="Peak demand periods")


class TrendInfo(BaseModel):
    """Trend analysis information"""
    direction: str = Field(..., pattern="^(increasing|decreasing|stable)$")
    slope: float = Field(..., description="Trend slope (units per day)")
    strength: float = Field(..., ge=0, le=1, description="Trend strength")
    change_percentage: float = Field(..., description="Percentage change over period")


class DemandForecastResponse(BaseModel):
    """Response with demand forecast"""
    product_id: str
    forecast_date: datetime
    forecast_horizon_days: int
    forecasts: List[ForecastDataPoint]
    
    # Seasonality information
    seasonality: SeasonalityInfo
    
    # Trend information
    trend: TrendInfo
    
    # Model metadata
    model_version: str = "v1.0"
    model_type: str = Field(..., description="heuristic, prophet, arima, lstm")
    model_accuracy: float = Field(..., ge=0, le=1, description="Model accuracy (MAPE)")
    is_fallback: bool = False
    
    # Historical context
    historical_avg_demand: float = Field(..., ge=0)
    historical_std_dev: float = Field(..., ge=0)
    data_quality_score: float = Field(..., ge=0, le=1)
    
    # Metadata
    created_at: datetime
    computation_time_ms: int


class BatchForecastRequest(BaseModel):
    """Request for batch forecasting"""
    product_ids: List[str] = Field(..., min_items=1, max_items=100)
    forecast_horizon_days: int = Field(30, ge=1, le=365)
    include_seasonality: bool = True
    include_trends: bool = True
    include_events: bool = False


class BatchForecastResponse(BaseModel):
    """Response for batch forecasting"""
    forecasts: List[DemandForecastResponse]
    total_products: int
    successful: int
    failed: int
    errors: List[Dict[str, str]] = []
    total_computation_time_ms: int
    started_at: datetime
    completed_at: datetime
