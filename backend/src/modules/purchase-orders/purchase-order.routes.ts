import { Router } from 'express';
import { PurchaseOrderController } from './purchase-order.controller.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { asyncHandler } from '../../shared/middleware/error.middleware.js';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updateStatusSchema,
  purchaseOrderQuerySchema,
  uuidParamSchema,
} from './purchase-order.validator.js';

const router = Router();
const controller = new PurchaseOrderController();

/**
 * Purchase Order Routes
 */

// GET /purchase-orders/statistics - Get statistics (must be before /:id)
router.get(
  '/statistics',
  asyncHandler(controller.getStatistics.bind(controller))
);

// POST /purchase-orders/:id/cancel - Cancel purchase order
router.post(
  '/:id/cancel',
  validate(uuidParamSchema, 'params'),
  asyncHandler(controller.cancel.bind(controller))
);

// PATCH /purchase-orders/:id/status - Update status
router.patch(
  '/:id/status',
  validate(uuidParamSchema, 'params'),
  validate(updateStatusSchema, 'body'),
  asyncHandler(controller.updateStatus.bind(controller))
);

// GET /purchase-orders/:id - Get purchase order by ID
router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(controller.getById.bind(controller))
);

// GET /purchase-orders - Get all purchase orders with filters
router.get(
  '/',
  validate(purchaseOrderQuerySchema, 'query'),
  asyncHandler(controller.getAll.bind(controller))
);

// POST /purchase-orders - Create new purchase order
router.post(
  '/',
  validate(createPurchaseOrderSchema, 'body'),
  asyncHandler(controller.create.bind(controller))
);

// PUT /purchase-orders/:id - Update purchase order
router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updatePurchaseOrderSchema, 'body'),
  asyncHandler(controller.update.bind(controller))
);

export default router;
