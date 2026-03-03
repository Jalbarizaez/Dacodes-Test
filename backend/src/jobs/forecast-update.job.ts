/**
 * Monthly Forecast Update Job
 * 
 * Scheduled to run on the 1st day of each month at 2:00 AM
 * Updates demand forecasts for all active products
 */
import { Job } from 'bull';
import { aiClientService } from '../services/ai-client.service';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { eventEmitter } from '../shared/events/event-emitter';

interface ForecastJobData {
  forecastHorizonDays?: number;
  includeSeasonality?: boolean;
  includeTrends?: boolean;
  includeEvents?: boolean;
}

export async function monthlyForecastUpdateJob(job: Job<ForecastJobData>) {
  const startTime = Date.now();
  logger.info('Starting monthly forecast update job');

  const {
    forecastHorizonDays = 30,
    includeSeasonality = true,
    includeTrends = true,
    includeEvents = false
  } = job.data;

  try {
    // Get all active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, sku: true, name: true }
    });

    logger.info(`Found ${products.length} active products to forecast`);

    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ productId: string; error: string }> = [];

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const productIds = batch.map(p => p.id);

      // Update progress
      const progress = Math.round((i / products.length) * 100);
      await job.progress(progress);

      try {
        // Call AI service for batch
        const batchResult = await aiClientService.forecastBatch({
          productIds,
          forecastHorizonDays,
          includeSeasonality,
          includeTrends,
          includeEvents
        });

        // Store successful forecasts
        for (const forecast of batchResult.forecasts) {
          try {
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

            successCount++;

            // Emit event for each successful forecast
            eventEmitter.emitForecastUpdated({
              productId: forecast.product_id,
              forecastDate: forecast.forecast_date,
              trendDirection: forecast.trend.direction,
              seasonalityDetected: forecast.seasonality.detected
            });

            logger.debug(`Forecast updated for product ${forecast.product_id}`);
          } catch (error: any) {
            failureCount++;
            errors.push({
              productId: forecast.product_id,
              error: error.message
            });
            logger.error(`Failed to store forecast for ${forecast.product_id}:`, error);
          }
        }

        // Track batch errors
        for (const error of batchResult.errors) {
          failureCount++;
          errors.push(error);
        }

      } catch (error: any) {
        logger.error(`Batch forecast failed for batch starting at index ${i}:`, error);
        failureCount += batch.length;
        batch.forEach(p => {
          errors.push({
            productId: p.id,
            error: error.message
          });
        });
      }
    }

    const duration = Date.now() - startTime;
    const result = {
      totalProducts: products.length,
      successCount,
      failureCount,
      errors: errors.slice(0, 10), // Only include first 10 errors
      durationMs: duration,
      completedAt: new Date()
    };

    logger.info('Monthly forecast update completed', result);

    // Store job execution record
    await prisma.jobExecution.create({
      data: {
        jobName: 'monthly-forecast-update',
        status: failureCount === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS',
        result: result as any,
        executedAt: new Date(),
        durationMs: duration
      }
    });

    return result;

  } catch (error: any) {
    logger.error('Monthly forecast update job failed:', error);

    // Store failure record
    await prisma.jobExecution.create({
      data: {
        jobName: 'monthly-forecast-update',
        status: 'FAILED',
        error: error.message,
        executedAt: new Date(),
        durationMs: Date.now() - startTime
      }
    });

    throw error;
  }
}

/**
 * Daily forecast update for high-priority products
 * Runs every day at 4:00 AM
 */
export async function dailyForecastUpdateJob(job: Job) {
  logger.info('Starting daily forecast update for high-priority products');

  try {
    // Get high-priority products (e.g., products with recent activity)
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        // Add criteria for high-priority products
        // e.g., recent movements, low stock, etc.
      },
      select: { id: true },
      take: 100 // Limit to top 100
    });

    if (products.length === 0) {
      logger.info('No high-priority products found');
      return { message: 'No products to update' };
    }

    const productIds = products.map(p => p.id);

    const batchResult = await aiClientService.forecastBatch({
      productIds,
      forecastHorizonDays: 7, // Shorter horizon for daily updates
      includeSeasonality: true,
      includeTrends: true
    });

    // Store results
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

    logger.info(`Daily forecast update completed: ${batchResult.successful} successful, ${batchResult.failed} failed`);

    return {
      totalProducts: batchResult.total_products,
      successful: batchResult.successful,
      failed: batchResult.failed
    };

  } catch (error: any) {
    logger.error('Daily forecast update failed:', error);
    throw error;
  }
}
