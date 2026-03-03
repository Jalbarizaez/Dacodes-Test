"""
Tests for Forecast Service
"""
import pytest
from app.services.forecast_service import ForecastService
from app.schemas.forecast import DemandForecastRequest


@pytest.mark.asyncio
async def test_forecast_demand():
    """Test demand forecasting"""
    service = ForecastService()
    
    request = DemandForecastRequest(
        product_id="test-product-123",
        forecast_horizon_days=30,
        include_seasonality=True,
        include_trends=True
    )
    
    result = await service.forecast_demand(request)
    
    assert result.product_id == "test-product-123"
    assert len(result.forecasts) == 30
    assert result.model_version == "v1.0"
    assert 0 <= result.model_accuracy <= 1
    
    # Check forecast data points
    for forecast in result.forecasts:
        assert forecast.predicted_demand >= 0
        assert forecast.confidence_lower >= 0
        assert forecast.confidence_upper >= forecast.predicted_demand


@pytest.mark.asyncio
async def test_forecast_batch():
    """Test batch forecasting"""
    service = ForecastService()
    
    from app.schemas.forecast import BatchForecastRequest
    
    request = BatchForecastRequest(
        product_ids=["prod-1", "prod-2", "prod-3"],
        forecast_horizon_days=7
    )
    
    result = await service.forecast_batch(request)
    
    assert result.total_products == 3
    assert result.successful >= 0
    assert result.failed >= 0
    assert result.successful + result.failed == result.total_products
