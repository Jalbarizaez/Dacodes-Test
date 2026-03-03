import { Router } from 'express';
import { StockController } from './stock.controller.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import {
  stockQuerySchema,
  productIdParamSchema,
  warehouseIdParamSchema,
  locationIdParamSchema,
} from './stock.validator.js';
// import { authenticate, authorize } from '../../shared/middleware/auth.middleware.js';
// import { UserRole } from '../../shared/types/index.js';

const router = Router();
const stockController = new StockController();

/**
 * Stock Routes
 * All routes are prefixed with /api/v1/stock
 */

// Note: Authentication middleware commented out for initial testing
// Uncomment when auth module is implemented

/**
 * GET /api/v1/stock
 * Get all stock levels with filters and pagination
 * Access: All authenticated users
 */
router.get(
  '/',
  // authenticate,
  validate(stockQuerySchema, 'query'),
  (req, res, next) => stockController.getAllStockLevels(req, res).catch(next)
);

/**
 * GET /api/v1/stock/alerts/low-stock
 * Get low stock alerts
 * Access: All authenticated users
 * Note: This route must be before /:productId to avoid conflicts
 */
router.get(
  '/alerts/low-stock',
  // authenticate,
  (req, res, next) => stockController.getLowStockAlerts(req, res).catch(next)
);

/**
 * GET /api/v1/stock/product/:productId
 * Get consolidated stock by product
 * Access: All authenticated users
 */
router.get(
  '/product/:productId',
  // authenticate,
  validate(productIdParamSchema, 'params'),
  (req, res, next) => stockController.getStockByProduct(req, res).catch(next)
);

/**
 * GET /api/v1/stock/warehouse/:warehouseId
 * Get consolidated stock by warehouse
 * Access: All authenticated users
 */
router.get(
  '/warehouse/:warehouseId',
  // authenticate,
  validate(warehouseIdParamSchema, 'params'),
  (req, res, next) => stockController.getStockByWarehouse(req, res).catch(next)
);

/**
 * GET /api/v1/stock/location/:locationId
 * Get consolidated stock by location
 * Access: All authenticated users
 */
router.get(
  '/location/:locationId',
  // authenticate,
  validate(locationIdParamSchema, 'params'),
  (req, res, next) => stockController.getStockByLocation(req, res).catch(next)
);

export default router;
