import { Router } from 'express';
import { ReceptionController } from './reception.controller.js';
import { asyncHandler } from '../../shared/middleware/error.middleware.js';
// import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = Router();
const controller = new ReceptionController();

/**
 * Reception Routes
 * Base path: /api/v1/receptions
 */

// Create reception
router.post(
  '/',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.createReception)
);

// Get all receptions with filters
router.get(
  '/',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.getAllReceptions)
);

// Get receptions by purchase order
router.get(
  '/purchase-order/:purchaseOrderId',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.getReceptionsByPurchaseOrder)
);

// Get reception by ID
router.get(
  '/:id',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.getReceptionById)
);

export default router;
