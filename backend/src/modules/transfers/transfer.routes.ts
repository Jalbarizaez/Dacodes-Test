import { Router } from 'express';
import { TransferController } from './transfer.controller.js';
import { asyncHandler } from '../../shared/middleware/error.middleware.js';
// import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = Router();
const controller = new TransferController();

/**
 * Transfer Routes
 * Base path: /api/v1/transfers
 */

// Get statistics (must be before /:id route)
router.get(
  '/statistics',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.getStatistics)
);

// Create transfer
router.post(
  '/',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.createTransfer)
);

// Get all transfers with filters
router.get(
  '/',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.getAllTransfers)
);

// Get transfer by ID
router.get(
  '/:id',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.getTransferById)
);

// Update transfer status
router.patch(
  '/:id/status',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.updateStatus)
);

// Ship transfer
router.post(
  '/:id/ship',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.shipTransfer)
);

// Complete transfer
router.post(
  '/:id/complete',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.completeTransfer)
);

// Cancel transfer
router.post(
  '/:id/cancel',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.cancelTransfer)
);

export default router;
