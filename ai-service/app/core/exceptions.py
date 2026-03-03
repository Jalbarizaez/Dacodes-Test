"""
Custom exceptions for AI Service
"""
from typing import Optional, Dict, Any


class AIServiceException(Exception):
    """Base exception for AI Service"""
    
    def __init__(
        self,
        message: str,
        error_code: str = "AI_SERVICE_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ModelNotFoundError(AIServiceException):
    """Model not found or not loaded"""
    
    def __init__(self, model_name: str):
        super().__init__(
            message=f"Model '{model_name}' not found or not loaded",
            error_code="MODEL_NOT_FOUND",
            status_code=404,
            details={"model_name": model_name}
        )


class InsufficientDataError(AIServiceException):
    """Insufficient data for prediction"""
    
    def __init__(self, message: str, required: int, available: int):
        super().__init__(
            message=message,
            error_code="INSUFFICIENT_DATA",
            status_code=400,
            details={"required": required, "available": available}
        )


class ValidationError(AIServiceException):
    """Input validation error"""
    
    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=400,
            details={"field": field} if field else {}
        )


class PredictionError(AIServiceException):
    """Error during prediction"""
    
    def __init__(self, message: str, model_name: str):
        super().__init__(
            message=message,
            error_code="PREDICTION_ERROR",
            status_code=500,
            details={"model_name": model_name}
        )


class DatabaseError(AIServiceException):
    """Database operation error"""
    
    def __init__(self, message: str):
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            status_code=500
        )
