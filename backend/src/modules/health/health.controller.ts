import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/response.js';
import { env } from '../../config/env.js';
import { databaseHealthCheck } from '../../config/database.js';

/**
 * Health check controller
 */
export class HealthController {
  /**
   * GET /health
   * Basic health check endpoint
   */
  async check(_req: Request, res: Response): Promise<Response> {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: env.API_VERSION,
    };

    return sendSuccess(res, healthData);
  }

  /**
   * GET /health/ready
   * Readiness check (includes database connectivity)
   */
  async ready(_req: Request, res: Response): Promise<Response> {
    const isDatabaseHealthy = await databaseHealthCheck();
    
    const readyData = {
      status: isDatabaseHealthy ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      database: isDatabaseHealthy ? 'connected' : 'disconnected',
    };

    return sendSuccess(res, readyData);
  }
}
