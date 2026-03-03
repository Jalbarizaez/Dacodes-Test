"""
Forecast Data Repository

Handles database operations for demand forecasting:
- Fetch historical demand data
- Store forecast results
- Query existing forecasts
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta, date
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class ForecastRepository:
    """Repository for forecast data operations"""
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
    
    async def get_historical_demand(
        self,
        product_id: str,
        days: int
    ) -> List[Dict]:
        """
        Fetch historical demand data from stock_movements
        
        Returns list of {date, demand} dictionaries
        """
        query = text("""
            SELECT 
                DATE(date) as demand_date,
                SUM(ABS(quantity)) as daily_demand
            FROM stock_movements
            WHERE 
                product_id = :product_id
                AND type IN ('SHIPMENT', 'TRANSFER_OUT', 'SALE')
                AND date >= NOW() - INTERVAL ':days days'
            GROUP BY DATE(date)
            ORDER BY demand_date ASC
        """)
        
        try:
            result = await self.db.execute(
                query,
                {"product_id": product_id, "days": days}
            )
            rows = result.fetchall()
            
            return [
                {
                    "date": row.demand_date,
                    "demand": float(row.daily_demand)
                }
                for row in rows
            ]
        except Exception as e:
            logger.error(f"Error fetching historical demand: {str(e)}")
            return []
    
    async def save_forecast(
        self,
        product_id: str,
        forecast_data: Dict,
        model_version: str
    ) -> str:
        """
        Save forecast results to demand_forecasts table
        
        Returns forecast ID
        """
        query = text("""
            INSERT INTO demand_forecasts (
                id,
                product_id,
                forecast_date,
                forecast_horizon_days,
                forecast_data,
                model_version,
                model_type,
                model_accuracy,
                is_fallback,
                created_at
            ) VALUES (
                gen_random_uuid(),
                :product_id,
                :forecast_date,
                :horizon_days,
                :forecast_data::jsonb,
                :model_version,
                :model_type,
                :model_accuracy,
                :is_fallback,
                NOW()
            )
            RETURNING id
        """)
        
        try:
            result = await self.db.execute(query, {
                "product_id": product_id,
                "forecast_date": forecast_data["forecast_date"],
                "horizon_days": forecast_data["forecast_horizon_days"],
                "forecast_data": forecast_data,
                "model_version": model_version,
                "model_type": forecast_data.get("model_type", "heuristic"),
                "model_accuracy": forecast_data.get("model_accuracy", 0.0),
                "is_fallback": forecast_data.get("is_fallback", True)
            })
            
            row = result.fetchone()
            await self.db.commit()
            
            return str(row.id)
        except Exception as e:
            logger.error(f"Error saving forecast: {str(e)}")
            await self.db.rollback()
            raise
    
    async def get_latest_forecast(
        self,
        product_id: str
    ) -> Optional[Dict]:
        """Get most recent forecast for a product"""
        query = text("""
            SELECT 
                id,
                forecast_date,
                forecast_data,
                model_version,
                created_at
            FROM demand_forecasts
            WHERE product_id = :product_id
            ORDER BY forecast_date DESC
            LIMIT 1
        """)
        
        try:
            result = await self.db.execute(query, {"product_id": product_id})
            row = result.fetchone()
            
            if row:
                return {
                    "id": str(row.id),
                    "forecast_date": row.forecast_date,
                    "forecast_data": row.forecast_data,
                    "model_version": row.model_version,
                    "created_at": row.created_at
                }
            return None
        except Exception as e:
            logger.error(f"Error fetching latest forecast: {str(e)}")
            return None
    
    async def get_active_products(self) -> List[str]:
        """Get list of active product IDs for batch processing"""
        query = text("""
            SELECT id
            FROM products
            WHERE is_active = true
            ORDER BY id
        """)
        
        try:
            result = await self.db.execute(query)
            rows = result.fetchall()
            return [str(row.id) for row in rows]
        except Exception as e:
            logger.error(f"Error fetching active products: {str(e)}")
            return []
