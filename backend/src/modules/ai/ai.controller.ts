/**
 * AI Integration Controller
 * 
 * Handles requests to AI Service for forecasting and other AI features
 */
import { Request, Response } from 'express';
import { aiClientService } from '../../services/ai-client.service';
import { asyncHandler } from '../../shared/middleware/async-handler';
import { logger } from '../../config/logger';
import { prisma } from '../../config/database';
import { eventEmitter } from '../../shared/events/event-emitter';

export class AIController {
  /**
   * Get demand forecast for a product
   * GET /api/v1/ai/products/:productId/forecast
   */
  getForecast = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const {
      forecastHorizonDays = 30,
      includeSeasonality = true,
      includeTrends = true,
      includeEvents = false
    } = req.query;

    logger.info(`Requesting forecast for product ${productId}`);

    try {
      // Call AI service
      const forecast = await aiClientService.forecastDemand({
        productId,
        forecastHorizonDays: parseInt(forecastHorizonDays as string),
        includeSeasonality: includeSeasonality === 'true',
        includeTrends: includeTrends === 'true',
        includeEvents: includeEvents === 'true'
      });

      // Store forecast in database
      await prisma.demandForecast.create({
        data: {
          productId,
          forecastDate: new Date(forecast.forecast_date),
          forecastHorizonDays: forecast.forecast_horizon_days,
          forecastData: forecast as any,
          modelVersion: forecast.model_version,
          modelType: forecast.model_type,
          modelAccuracy: forecast.model_accuracy,
          isFallback: forecast.is_fallback,
          createdAt: new Date()
        }
      });

      // Emit real-time event
      eventEmitter.emitForecastUpdated({
        productId,
        forecastDate: forecast.forecast_date,
        trendDirection: forecast.trend.direction,
        seasonalityDetected: forecast.seasonality.detected
      });

      res.json({
        success: true,
        data: forecast
      });
    } catch (error: any) {
      logger.error(`Forecast error for product ${productId}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate forecast',
        message: error.message
      });
    }
  });

  /**
   * Get latest forecast for a product
   * GET /api/v1/ai/products/:productId/forecast/latest
   */
  getLatestForecast = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;

    const forecast = await prisma.demandForecast.findFirst({
      where: { productId },
      orderBy: { forecastDate: 'desc' }
    });

    if (!forecast) {
      return res.status(404).json({
        success: false,
        error: 'No forecast found for this product'
      });
    }

    res.json({
      success: true,
      data: forecast.forecastData
    });
  });

  /**
   * Trigger batch forecast update for all active products
   * POST /api/v1/ai/forecast/batch
   */
  triggerBatchForecast = asyncHandler(async (req: Request, res: Response) => {
    const {
      forecastHorizonDays = 30,
      includeSeasonality = true,
      includeTrends = true
    } = req.body;

    logger.info('Triggering batch forecast update');

    try {
      // Get all active products
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true }
      });

      const productIds = products.map(p => p.id);

      // Call AI service for batch processing
      const batchResult = await aiClientService.forecastBatch({
        productIds,
        forecastHorizonDays,
        includeSeasonality,
        includeTrends
      });

      // Store successful forecasts
      for (const forecast of batchResult.forecasts) {
        await prisma.demandForecast.create({
          data: {
            productId: forecast.product_id,
            forecastDate: new Date(forecast.forecast_date),
            forecastHorizonDays: forecast.forecast_horizon_days,
            forecastData: forecast as any,
            modelVersion: forecast.model_version,
            modelType: forecast.model_type,
            modelAccuracy: forecast.model_accuracy,
            isFallback: forecast.is_fallback,
            createdAt: new Date()
          }
        });
      }

      res.json({
        success: true,
        data: {
          totalProducts: batchResult.total_products,
          successful: batchResult.successful,
          failed: batchResult.failed,
          errors: batchResult.errors,
          computationTimeMs: batchResult.total_computation_time_ms
        }
      });
    } catch (error: any) {
      logger.error('Batch forecast error:', error);
      res.status(500).json({
        success: false,
        error: 'Batch forecast failed',
        message: error.message
      });
    }
  });

  /**
   * Get forecast statistics for dashboard
   * GET /api/v1/ai/forecast/stats
   */
  getForecastStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await prisma.demandForecast.groupBy({
      by: ['modelType', 'isFallback'],
      _count: true,
      _avg: {
        modelAccuracy: true
      }
    });

    const totalForecasts = await prisma.demandForecast.count();
    const recentForecasts = await prisma.demandForecast.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalForecasts,
        recentForecasts,
        byModelType: stats
      }
    });
  });
}

export const aiController = new AIController();
