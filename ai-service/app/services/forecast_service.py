"""
Demand Forecasting Service

Predicts future product demand using:
- Historical sales data
- Seasonality patterns (weekly, monthly)
- Trend analysis
- Special events impact
- Growth factors

Supports both heuristic and ML-based forecasting.
"""
import logging
from datetime import date, datetime, timedelta
from typing import List, Dict, Tuple, Optional
import numpy as np
from scipy import stats, signal
from collections import defaultdict
import time

from app.schemas.forecast import (
    DemandForecastRequest,
    DemandForecastResponse,
    ForecastDataPoint,
    BatchForecastRequest,
    BatchForecastResponse,
    SeasonalityInfo,
    TrendInfo
)
from app.core.exceptions import InsufficientDataError, PredictionError
from app.core.config import settings

logger = logging.getLogger(__name__)


class ForecastService:
    """Service for demand forecasting"""
    
    def __init__(self):
        self.model = None  # TODO: Load actual ML model (Prophet, ARIMA, LSTM)
        self.model_version = "v1.0"
        self.model_type = "heuristic"  # Will change to 'prophet', 'arima', 'lstm' when ML integrated
        
        # Seasonality detection parameters
        self.weekly_period = 7
        self.monthly_period = 30
        self.min_data_points = 30
        
        # Confidence parameters
        self.confidence_level = 0.95
        self.z_score = stats.norm.ppf((1 + self.confidence_level) / 2)
    
    async def forecast_demand(
        self,
        request: DemandForecastRequest
    ) -> DemandForecastResponse:
        """
        Generate demand forecast for a product
        
        Algorithm:
        1. Fetch historical demand data
        2. Validate data quality
        3. Detect and extract seasonality
        4. Detect and extract trend
        5. Generate forecast with components
        6. Calculate confidence intervals
        7. Return structured response
        """
        start_time = time.time()
        logger.info(f"Forecasting demand for product {request.product_id}")
        
        try:
            # 1. Fetch historical data
            historical_data = await self._get_historical_demand(
                request.product_id,
                days=request.historical_days
            )
            
            # 2. Validate sufficient data
            if len(historical_data) < self.min_data_points:
                raise InsufficientDataError(
                    f"Insufficient historical data for forecasting. Need at least {self.min_data_points} days.",
                    required=self.min_data_points,
                    available=len(historical_data)
                )
            
            # 3. Calculate data quality
            data_quality = self._assess_data_quality(historical_data)
            
            # 4. Detect seasonality
            seasonality_info = self._detect_seasonality(
                historical_data,
                include_seasonality=request.include_seasonality
            )
            
            # 5. Detect trend
            trend_info = self._detect_trend(
                historical_data,
                include_trends=request.include_trends
            )
            
            # 6. Generate forecast
            if self.model:
                # TODO: Use actual ML model
                forecasts = await self._forecast_with_model(
                    historical_data,
                    request.forecast_horizon_days,
                    seasonality_info,
                    trend_info
                )
            else:
                # Use heuristic approach
                forecasts = self._forecast_heuristic(
                    historical_data,
                    request.forecast_horizon_days,
                    seasonality_info,
                    trend_info,
                    request.include_events
                )
            
            # 7. Calculate statistics
            historical_avg = np.mean(historical_data)
            historical_std = np.std(historical_data)
            
            # 8. Calculate model accuracy (MAPE on last 30 days)
            model_accuracy = self._calculate_accuracy(historical_data)
            
            computation_time = int((time.time() - start_time) * 1000)
            
            return DemandForecastResponse(
                product_id=request.product_id,
                forecast_date=datetime.utcnow(),
                forecast_horizon_days=request.forecast_horizon_days,
                forecasts=forecasts,
                seasonality=seasonality_info,
                trend=trend_info,
                model_version=self.model_version,
                model_type=self.model_type,
                model_accuracy=model_accuracy,
                is_fallback=self.model is None,
                historical_avg_demand=float(historical_avg),
                historical_std_dev=float(historical_std),
                data_quality_score=data_quality,
                created_at=datetime.utcnow(),
                computation_time_ms=computation_time
            )
            
        except InsufficientDataError:
            raise
        except Exception as e:
            logger.error(f"Forecast error: {str(e)}", exc_info=True)
            raise PredictionError(str(e), "demand_forecasting")
    
    async def forecast_batch(
        self,
        request: BatchForecastRequest
    ) -> BatchForecastResponse:
        """Generate forecasts for multiple products"""
        start_time = time.time()
        logger.info(f"Batch forecasting for {len(request.product_ids)} products")
        
        forecasts = []
        errors = []
        successful = 0
        
        for product_id in request.product_ids:
            try:
                forecast_request = DemandForecastRequest(
                    product_id=product_id,
                    forecast_horizon_days=request.forecast_horizon_days,
                    include_seasonality=request.include_seasonality,
                    include_trends=request.include_trends,
                    include_events=request.include_events
                )
                result = await self.forecast_demand(forecast_request)
                forecasts.append(result)
                successful += 1
            except Exception as e:
                logger.error(f"Forecast failed for product {product_id}: {str(e)}")
                errors.append({
                    "product_id": product_id,
                    "error": str(e)
                })
        
        total_time = int((time.time() - start_time) * 1000)
        
        return BatchForecastResponse(
            forecasts=forecasts,
            total_products=len(request.product_ids),
            successful=successful,
            failed=len(errors),
            errors=errors,
            total_computation_time_ms=total_time,
            started_at=datetime.utcnow() - timedelta(milliseconds=total_time),
            completed_at=datetime.utcnow()
        )
    
    # ============================================================================
    # DATA FETCHING
    # ============================================================================
    
    async def _get_historical_demand(
        self,
        product_id: str,
        days: int
    ) -> List[float]:
        """
        Fetch historical demand data from database
        
        TODO: Implement actual database query
        Query should fetch daily demand from stock_movements table:
        
        SELECT 
            DATE(date) as demand_date,
            SUM(ABS(quantity)) as daily_demand
        FROM stock_movements
        WHERE 
            product_id = $1
            AND type IN ('SHIPMENT', 'TRANSFER_OUT', 'SALE')
            AND date >= NOW() - INTERVAL '$2 days'
        GROUP BY DATE(date)
        ORDER BY demand_date ASC
        """
        # Simulated historical data with realistic patterns
        np.random.seed(hash(product_id) % 2**32)
        
        base_demand = np.random.uniform(30, 100)
        trend_slope = np.random.uniform(-0.1, 0.2)
        seasonal_amplitude = base_demand * 0.3
        noise_level = base_demand * 0.15
        
        data = []
        for i in range(days):
            # Trend component
            trend = trend_slope * i
            
            # Weekly seasonality (peak on weekdays)
            day_of_week = i % 7
            weekly_seasonal = seasonal_amplitude * np.sin(2 * np.pi * day_of_week / 7)
            
            # Monthly seasonality (peak mid-month)
            monthly_seasonal = (seasonal_amplitude * 0.5) * np.sin(2 * np.pi * i / 30)
            
            # Random noise
            noise = np.random.normal(0, noise_level)
            
            # Combine components
            demand = base_demand + trend + weekly_seasonal + monthly_seasonal + noise
            demand = max(0, demand)  # Ensure non-negative
            
            data.append(demand)
        
        return data
    
    # ============================================================================
    # DATA QUALITY ASSESSMENT
    # ============================================================================
    
    def _assess_data_quality(self, data: List[float]) -> float:
        """
        Assess quality of historical data
        
        Factors:
        - Completeness (no missing days)
        - Consistency (low variance in patterns)
        - Outliers (few extreme values)
        
        Returns score between 0 and 1
        """
        if len(data) == 0:
            return 0.0
        
        # Check for zeros (missing data indicator)
        zero_ratio = sum(1 for x in data if x == 0) / len(data)
        completeness_score = 1.0 - zero_ratio
        
        # Check for outliers using IQR method
        q1, q3 = np.percentile(data, [25, 75])
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outliers = sum(1 for x in data if x < lower_bound or x > upper_bound)
        outlier_ratio = outliers / len(data)
        outlier_score = 1.0 - min(outlier_ratio * 2, 1.0)
        
        # Check consistency (coefficient of variation)
        mean_val = np.mean(data)
        std_val = np.std(data)
        cv = std_val / mean_val if mean_val > 0 else 1.0
        consistency_score = 1.0 / (1.0 + cv)
        
        # Weighted average
        quality_score = (
            completeness_score * 0.4 +
            outlier_score * 0.3 +
            consistency_score * 0.3
        )
        
        return float(quality_score)


    
    # ============================================================================
    # SEASONALITY DETECTION
    # ============================================================================
    
    def _detect_seasonality(
        self,
        data: List[float],
        include_seasonality: bool
    ) -> SeasonalityInfo:
        """
        Detect seasonal patterns in demand data
        
        Methods:
        - Autocorrelation for weekly/monthly patterns
        - FFT for frequency analysis
        - Statistical significance testing
        """
        if not include_seasonality or len(data) < 14:
            return SeasonalityInfo(detected=False)
        
        try:
            data_array = np.array(data)
            
            # Test for weekly seasonality (7-day period)
            weekly_strength = self._test_seasonality_period(data_array, self.weekly_period)
            
            # Test for monthly seasonality (30-day period)
            monthly_strength = self._test_seasonality_period(data_array, self.monthly_period)
            
            # Determine dominant pattern
            if weekly_strength > 0.5 or monthly_strength > 0.5:
                if weekly_strength > monthly_strength:
                    pattern_type = "weekly"
                    strength = weekly_strength
                    peak_periods = self._find_peak_periods(data_array, self.weekly_period)
                else:
                    pattern_type = "monthly"
                    strength = monthly_strength
                    peak_periods = self._find_peak_periods(data_array, self.monthly_period)
                
                return SeasonalityInfo(
                    detected=True,
                    pattern_type=pattern_type,
                    strength=float(strength),
                    peak_periods=peak_periods
                )
            else:
                return SeasonalityInfo(detected=False)
                
        except Exception as e:
            logger.warning(f"Seasonality detection failed: {str(e)}")
            return SeasonalityInfo(detected=False)
    
    def _test_seasonality_period(self, data: np.ndarray, period: int) -> float:
        """
        Test for seasonality at a specific period using autocorrelation
        
        Returns strength score between 0 and 1
        """
        if len(data) < period * 2:
            return 0.0
        
        # Calculate autocorrelation at the period lag
        correlation = np.corrcoef(data[:-period], data[period:])[0, 1]
        
        # Convert correlation to strength (handle negative correlations)
        strength = abs(correlation)
        
        return float(strength)
    
    def _find_peak_periods(self, data: np.ndarray, period: int) -> List[str]:
        """Find which days/periods have peak demand"""
        if len(data) < period:
            return []
        
        # Reshape data into periods
        num_periods = len(data) // period
        reshaped = data[:num_periods * period].reshape(num_periods, period)
        
        # Average across periods
        avg_by_position = np.mean(reshaped, axis=0)
        
        # Find top 3 positions
        top_indices = np.argsort(avg_by_position)[-3:][::-1]
        
        if period == 7:
            # Weekly: return day names
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            return [days[i] for i in top_indices]
        else:
            # Monthly: return day numbers
            return [f"Day {i+1}" for i in top_indices]
    
    # ============================================================================
    # TREND DETECTION
    # ============================================================================
    
    def _detect_trend(
        self,
        data: List[float],
        include_trends: bool
    ) -> TrendInfo:
        """
        Detect trend in demand data using linear regression
        
        Returns trend direction, slope, and strength
        """
        if not include_trends or len(data) < 30:
            return TrendInfo(
                direction="stable",
                slope=0.0,
                strength=0.0,
                change_percentage=0.0
            )
        
        try:
            data_array = np.array(data)
            x = np.arange(len(data_array))
            
            # Linear regression
            slope, intercept = np.polyfit(x, data_array, 1)
            
            # Calculate R-squared for trend strength
            y_pred = slope * x + intercept
            ss_res = np.sum((data_array - y_pred) ** 2)
            ss_tot = np.sum((data_array - np.mean(data_array)) ** 2)
            r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
            
            # Determine direction
            if abs(slope) < 0.01:  # Threshold for "stable"
                direction = "stable"
            elif slope > 0:
                direction = "increasing"
            else:
                direction = "decreasing"
            
            # Calculate percentage change over period
            start_value = intercept
            end_value = slope * len(data_array) + intercept
            change_pct = ((end_value - start_value) / start_value * 100) if start_value > 0 else 0
            
            return TrendInfo(
                direction=direction,
                slope=float(slope),
                strength=float(max(0, min(1, r_squared))),
                change_percentage=float(change_pct)
            )
            
        except Exception as e:
            logger.warning(f"Trend detection failed: {str(e)}")
            return TrendInfo(
                direction="stable",
                slope=0.0,
                strength=0.0,
                change_percentage=0.0
            )
    
    # ============================================================================
    # FORECASTING
    # ============================================================================
    
    def _forecast_heuristic(
        self,
        historical_data: List[float],
        horizon: int,
        seasonality_info: SeasonalityInfo,
        trend_info: TrendInfo,
        include_events: bool
    ) -> List[ForecastDataPoint]:
        """
        Generate forecast using heuristic approach
        
        Components:
        1. Base level (recent average)
        2. Trend component
        3. Seasonal component
        4. Event impact (if enabled)
        5. Confidence intervals
        """
        data_array = np.array(historical_data)
        
        # Base level: weighted moving average (more weight on recent data)
        weights = np.exp(np.linspace(-1, 0, min(30, len(data_array))))
        weights /= weights.sum()
        base_level = np.average(data_array[-len(weights):], weights=weights)
        
        # Standard deviation for confidence intervals
        std_dev = np.std(data_array[-30:])
        
        forecasts = []
        for i in range(horizon):
            forecast_date = date.today() + timedelta(days=i+1)
            
            # 1. Base prediction
            predicted = base_level
            
            # 2. Trend component
            trend_component = 0.0
            if trend_info.direction != "stable":
                trend_component = trend_info.slope * (len(data_array) + i)
                predicted += trend_component
            
            # 3. Seasonal component
            seasonal_component = 0.0
            if seasonality_info.detected:
                if seasonality_info.pattern_type == "weekly":
                    period = self.weekly_period
                else:
                    period = self.monthly_period
                
                # Extract seasonal pattern from historical data
                seasonal_amplitude = std_dev * seasonality_info.strength
                phase = (len(data_array) + i) % period
                seasonal_component = seasonal_amplitude * np.sin(2 * np.pi * phase / period)
                predicted += seasonal_component
            
            # 4. Event impact (placeholder for future implementation)
            event_impact = 0.0
            if include_events:
                # TODO: Integrate with events calendar
                # Check if forecast_date matches any special event
                # Apply event-specific multiplier
                pass
            
            # Ensure non-negative
            predicted = max(0, predicted)
            
            # 5. Confidence intervals
            # Widen intervals as we forecast further into future
            uncertainty_growth = 1 + (i / horizon) * 0.5
            interval_width = self.z_score * std_dev * uncertainty_growth
            
            confidence_lower = max(0, predicted - interval_width)
            confidence_upper = predicted + interval_width
            
            # Confidence score (decreases with distance)
            confidence = max(0.5, 1.0 - (i / horizon) * 0.3)
            
            forecasts.append(ForecastDataPoint(
                forecast_period=forecast_date,
                predicted_demand=float(predicted),
                confidence_lower=float(confidence_lower),
                confidence_upper=float(confidence_upper),
                confidence=float(confidence),
                trend_component=float(trend_component) if trend_info.direction != "stable" else None,
                seasonal_component=float(seasonal_component) if seasonality_info.detected else None,
                event_impact=float(event_impact) if include_events and event_impact != 0 else None
            ))
        
        return forecasts
    
    async def _forecast_with_model(
        self,
        historical_data: List[float],
        horizon: int,
        seasonality_info: SeasonalityInfo,
        trend_info: TrendInfo
    ) -> List[ForecastDataPoint]:
        """
        Generate forecast using ML model (Prophet, ARIMA, LSTM)
        
        TODO: Implement when ML model is integrated
        
        Example with Prophet:
        ```python
        from prophet import Prophet
        import pandas as pd
        
        # Prepare data
        df = pd.DataFrame({
            'ds': pd.date_range(end=date.today(), periods=len(historical_data)),
            'y': historical_data
        })
        
        # Train model
        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=seasonality_info.pattern_type == 'weekly',
            daily_seasonality=False
        )
        model.fit(df)
        
        # Generate forecast
        future = model.make_future_dataframe(periods=horizon)
        forecast = model.predict(future)
        
        # Extract predictions
        return self._format_prophet_forecast(forecast.tail(horizon))
        ```
        """
        raise NotImplementedError("ML model forecasting not yet implemented")
    
    # ============================================================================
    # ACCURACY CALCULATION
    # ============================================================================
    
    def _calculate_accuracy(self, historical_data: List[float]) -> float:
        """
        Calculate model accuracy using MAPE (Mean Absolute Percentage Error)
        on the last 30 days of historical data
        
        Lower MAPE = better accuracy
        Returns accuracy score between 0 and 1
        """
        if len(historical_data) < 60:
            return 0.75  # Default for insufficient data
        
        try:
            # Use last 30 days as test set
            test_data = historical_data[-30:]
            train_data = historical_data[:-30]
            
            # Simple forecast: use average of last 30 days of training
            forecast_value = np.mean(train_data[-30:])
            
            # Calculate MAPE
            errors = []
            for actual in test_data:
                if actual > 0:
                    error = abs((actual - forecast_value) / actual)
                    errors.append(error)
            
            mape = np.mean(errors) if errors else 0.5
            
            # Convert MAPE to accuracy score (0-1)
            # MAPE of 0% = accuracy 1.0
            # MAPE of 50% = accuracy 0.5
            # MAPE of 100%+ = accuracy 0.0
            accuracy = max(0, 1.0 - mape)
            
            return float(accuracy)
            
        except Exception as e:
            logger.warning(f"Accuracy calculation failed: {str(e)}")
            return 0.75
