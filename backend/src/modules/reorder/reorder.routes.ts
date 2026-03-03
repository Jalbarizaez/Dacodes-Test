import { Router } from 'express';
import { ReorderController } from './reorder.controller.js';
import { asyncHandler } from '../../shared/middleware/error.middleware.js';
// import { authenticate } from '../../shared/middleware/auth.middleware.js';

const router = Router();
const controller = new ReorderController();

/**
 * Reorder Routes
 * Base path: /api/v1/reorder
 */

// Get statistics (must be before /:id route)
router.get(
  '/statistics',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.getStatistics)
);

// Get reorder suggestions
router.get(
  '/suggestions',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.getReorderSuggestions)
);

// Evaluate reorder rules and create alerts
router.post(
  '/evaluate',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.evaluateReorderRules)
);

// Get all reorder alerts
router.get(
  '/alerts',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.getAllReorderAlerts)
);

// Resolve reorder alert
router.post(
  '/alerts/:id/resolve',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.resolveAlert)
);

// Create reorder rule
router.post(
  '/rules',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.createReorderRule)
);

// Get all reorder rules
router.get(
  '/rules',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.getAllReorderRules)
);

// Get reorder rule by product ID
router.get(
  '/rules/product/:productId',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.getReorderRuleByProductId)
);

// Get reorder rule by ID
router.get(
  '/rules/:id',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.getReorderRuleById)
);

// Update reorder rule
router.put(
  '/rules/:id',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.updateReorderRule)
);

// Delete reorder rule
router.delete(
  '/rules/:id',
  // authenticate, // TODO: Uncomment when authentication is implemented
  asyncHandler(controller.deleteReorderRule)
);

export default router;
