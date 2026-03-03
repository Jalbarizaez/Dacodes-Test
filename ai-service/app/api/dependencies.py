"""
FastAPI Dependencies
"""
from typing import Generator
from app.services.forecast_service import ForecastService
from app.services.reorder_service import ReorderService
from app.services.supplier_service import SupplierService
from app.services.anomaly_service import AnomalyService
from app.services.categorization_service import CategorizationService
from app.services.visual_service import VisualService
from app.services.nlq_service import NLQService
from app.services.waste_service import WasteService


# Service instances (singleton pattern)
_forecast_service = None
_reorder_service = None
_supplier_service = None
_anomaly_service = None
_categorization_service = None
_visual_service = None
_nlq_service = None
_waste_service = None
_model_registry = None


def get_forecast_service() -> ForecastService:
    """Get forecast service instance"""
    global _forecast_service
    if _forecast_service is None:
        _forecast_service = ForecastService()
    return _forecast_service


def get_reorder_service() -> ReorderService:
    """Get reorder service instance"""
    global _reorder_service
    if _reorder_service is None:
        _reorder_service = ReorderService()
    return _reorder_service


def get_supplier_service() -> SupplierService:
    """Get supplier service instance"""
    global _supplier_service
    if _supplier_service is None:
        _supplier_service = SupplierService()
    return _supplier_service


def get_anomaly_service() -> AnomalyService:
    """Get anomaly service instance"""
    global _anomaly_service
    if _anomaly_service is None:
        _anomaly_service = AnomalyService()
    return _anomaly_service


def get_categorization_service() -> CategorizationService:
    """Get categorization service instance"""
    global _categorization_service
    if _categorization_service is None:
        _categorization_service = CategorizationService()
    return _categorization_service


def get_visual_service() -> VisualService:
    """Get visual service instance"""
    global _visual_service
    if _visual_service is None:
        _visual_service = VisualService()
    return _visual_service


def get_nlq_service() -> NLQService:
    """Get NLQ service instance"""
    global _nlq_service
    if _nlq_service is None:
        _nlq_service = NLQService()
    return _nlq_service


def get_waste_service() -> WasteService:
    """Get waste service instance"""
    global _waste_service
    if _waste_service is None:
        _waste_service = WasteService()
    return _waste_service


def get_model_registry():
    """Get model registry instance"""
    global _model_registry
    if _model_registry is None:
        # TODO: Initialize actual model registry
        _model_registry = {}
    return _model_registry
