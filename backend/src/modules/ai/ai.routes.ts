/**
 * AI Integration Routes
 */
import { Router } from 'express';
import { aiController } from './ai.controller';

const router = Router();

// Forecast routes
router.get('/products/:productId/forecast', aiController.getForecast);
router.get('/products/:productId/forecast/latest', aiController.getLatestForecast);
router.post('/forecast/batch', aiController.triggerBatchForecast);
router.get('/forecast/stats', aiController.getForecastStats);

export default router;
