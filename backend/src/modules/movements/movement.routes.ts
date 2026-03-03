import { Router } from 'express';
import { MovementController } from './movement.controller.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { asyncHandler } from '../../shared/middleware/error.middleware.js';
import {
  createMovementSchema,
  stockAdjustmentSchema,
  stockStatusChangeSchema,
  movementQuerySchema,
  uuidParamSchema,
} from './movement.validator.js';

const router = Router();
const controller = new MovementController();

/**
 * Movement Routes
 */

// GET /movements/summary - Get movement summary (must be before /:id)
router.get(
  '/summary',
  validate(movementQuerySchema, 'query'),
  asyncHandler(controller.getMovementSummary.bind(controller))
);

// GET /movements/history/:productId/:locationId - Get movement history
router.get(
  '/history/:productId/:locationId',
  asyncHandler(controller.getMovementHistory.bind(controller))
);

// GET /movements/:id - Get movement by ID
router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(controller.getMovementById.bind(controller))
);

// GET /movements - Get all movements with filters
router.get(
  '/',
  validate(movementQuerySchema, 'query'),
  asyncHandler(controller.getAllMovements.bind(controller))
);

// POST /movements - Create new movement
router.post(
  '/',
  validate(createMovementSchema, 'body'),
  asyncHandler(controller.createMovement.bind(controller))
);

// POST /movements/adjust - Create stock adjustment (simplified)
router.post(
  '/adjust',
  validate(stockAdjustmentSchema, 'body'),
  asyncHandler(controller.createStockAdjustment.bind(controller))
);

// POST /movements/change-status - Change stock status
router.post(
  '/change-status',
  validate(stockStatusChangeSchema, 'body'),
  asyncHandler(controller.changeStockStatus.bind(controller))
);

export default router;
