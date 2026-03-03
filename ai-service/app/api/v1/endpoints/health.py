"""
Health Check and Status Endpoints
"""
from fastapi import APIRouter, Depends
import logging
from datetime import datetime

from app.core.config import settings
from app.api.dependencies import get_model_registry

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
async def health_check():
    """
    Basic health check endpoint
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/models/status")
async def models_status(
    model_registry = Depends(get_model_registry)
):
    """
    Get status of all loaded ML models
    """
    try:
        # TODO: Implement actual model registry
        models_info = {
            "demand_forecasting": {
                "loaded": True,
                "version": "v1.0",
                "last_trained": "2024-01-15",
                "accuracy": 0.85
            },
            "anomaly_detection": {
                "loaded": True,
                "version": "v1.0",
                "last_trained": "2024-01-15",
                "accuracy": 0.92
            },
            "visual_counting": {
                "loaded": True,
                "version": "v1.0",
                "last_trained": "2024-01-15",
                "accuracy": 0.88
            },
            "nlp_categorization": {
                "loaded": True,
                "version": "v1.0",
                "last_trained": "2024-01-15",
                "accuracy": 0.90
            }
        }
        
        return {
            "status": "ok",
            "models": models_info,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting models status: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


@router.post("/models/reload")
async def reload_models(
    model_registry = Depends(get_model_registry)
):
    """
    Reload all ML models from storage
    """
    try:
        # TODO: Implement model reloading
        logger.info("Reloading all models...")
        
        return {
            "status": "success",
            "message": "Models reloaded successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error reloading models: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }
