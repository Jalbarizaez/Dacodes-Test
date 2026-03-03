"""
Visual Stock Counting Schemas
"""
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict


class BoundingBox(BaseModel):
    """Bounding box coordinates"""
    x: int = Field(..., ge=0)
    y: int = Field(..., ge=0)
    width: int = Field(..., ge=1)
    height: int = Field(..., ge=1)
    confidence: float = Field(..., ge=0, le=1)


class ProductMatch(BaseModel):
    """Product match result"""
    product_id: str
    confidence: float = Field(..., ge=0, le=1)


class VisualCountingRequest(BaseModel):
    """Request for visual counting"""
    image_url: HttpUrl
    expected_product_id: Optional[str] = None
    location_id: str


class VisualCountingResponse(BaseModel):
    """Response with visual count"""
    detected_count: int = Field(..., ge=0)
    confidence: float = Field(..., ge=0, le=1)
    bounding_boxes: List[BoundingBox]
    product_matches: List[ProductMatch]
    quality_score: float = Field(..., ge=0, le=1)
    model_version: str = "v1.0"


class ImageQualityRequest(BaseModel):
    """Request for image quality assessment"""
    image_url: HttpUrl


class ImageQualityResponse(BaseModel):
    """Response with quality assessment"""
    quality_score: float = Field(..., ge=0, le=1)
    brightness_score: float = Field(..., ge=0, le=1)
    blur_score: float = Field(..., ge=0, le=1)
    resolution_score: float = Field(..., ge=0, le=1)
    contrast_score: float = Field(..., ge=0, le=1)
    is_acceptable: bool
    issues: List[str] = []
