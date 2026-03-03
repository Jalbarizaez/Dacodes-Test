import { Router } from 'express';
import { SupplierController } from './supplier.controller.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { asyncHandler } from '../../shared/middleware/error.middleware.js';
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierQuerySchema,
  uuidParamSchema,
} from './supplier.validator.js';

const router = Router();
const controller = new SupplierController();

/**
 * Supplier Routes
 */

// GET /suppliers/active - Get all active suppliers (must be before /:id)
router.get(
  '/active',
  asyncHandler(controller.getActive.bind(controller))
);

// GET /suppliers/:id/statistics - Get supplier statistics
router.get(
  '/:id/statistics',
  validate(uuidParamSchema, 'params'),
  asyncHandler(controller.getStatistics.bind(controller))
);

// POST /suppliers/:id/activate - Activate supplier
router.post(
  '/:id/activate',
  validate(uuidParamSchema, 'params'),
  asyncHandler(controller.activate.bind(controller))
);

// GET /suppliers/:id - Get supplier by ID
router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(controller.getById.bind(controller))
);

// GET /suppliers - Get all suppliers with filters
router.get(
  '/',
  validate(supplierQuerySchema, 'query'),
  asyncHandler(controller.getAll.bind(controller))
);

// POST /suppliers - Create new supplier
router.post(
  '/',
  validate(createSupplierSchema, 'body'),
  asyncHandler(controller.create.bind(controller))
);

// PUT /suppliers/:id - Update supplier
router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateSupplierSchema, 'body'),
  asyncHandler(controller.update.bind(controller))
);

// DELETE /suppliers/:id - Deactivate supplier (soft delete)
router.delete(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(controller.deactivate.bind(controller))
);

export default router;
