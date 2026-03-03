import { Router } from 'express';
import { HealthController } from './health.controller.js';

const router = Router();
const healthController = new HealthController();

/**
 * Health check routes
 */
router.get('/', (req, res) => healthController.check(req, res));
router.get('/ready', (req, res) => healthController.ready(req, res));

export default router;
