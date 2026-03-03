"""
Anomaly Detection Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class AnomalyDetectionRequest(BaseModel):
    """Request for anomaly detection"""
    detection_type: str = Field(..., pattern="^(movement|stock_level|transaction)$")
    time_window_days: int = Field(7, ge=1, le=90)
    product_ids: Optional[List[str]] = None
    location_ids: Optional[List[str]] = None


class AnomalyDetail(BaseModel):
    """Single anomaly detail"""
    type: str
    severity: str = Field(..., pattern="^(critical|warning|info)$")
    description: str
    affected_entity: Dict[str, Any]
    timestamp: datetime
    confidence: float = Field(..., ge=0, le=1)


class AnomalyDetectionResponse(BaseModel):
    """Response with detected anomalies"""
    anomalies: List[AnomalyDetail]
    total_anomalies: int
    critical_count: int
    warning_count: int
    info_count: int = 0
    detection_date: datetime
    model_version: str = "v1.0"
