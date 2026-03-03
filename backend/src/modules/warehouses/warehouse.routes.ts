import { Router } from 'express';
import { WarehouseController } from './warehouse.controller.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  warehouseQuerySchema,
  createLocationSchema,
  updateLocationSchema,
  locationQuerySchema,
  uuidParamSchema,
  warehouseIdParamSchema,
} from './warehouse.validator.js';
// import { authenticate, authorize } from '../../shared/middleware/auth.middleware.js';
// import { UserRole } from '../../shared/types/index.js';

const router = Router();
const warehouseController = new WarehouseController();

/**
 * Warehouse and Location Routes
 * Warehouses: /api/v1/warehouses
 * Locations: /api/v1/locations
 */

// Note: Authentication middleware commented out for initial testing
// Uncomment when auth module is implemented

// ============================================================================
// WAREHOUSE ROUTES
// ============================================================================

/**
 * POST /api/v1/warehouses
 * Create a new warehouse
 * Access: Admin, Manager
 */
router.post(
  '/warehouses',
  // authenticate,
  // authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(createWarehouseSchema, 'body'),
  (req, res, next) => warehouseController.createWarehouse(req, res).catch(next)
);

/**
 * GET /api/v1/warehouses
 * Get all warehouses with filters and pagination
 * Access: All authenticated users
 */
router.get(
  '/warehouses',
  // authenticate,
  validate(warehouseQuerySchema, 'query'),
  (req, res, next) => warehouseController.getAllWarehouses(req, res).catch(next)
);

/**
 * GET /api/v1/warehouses/:id
 * Get warehouse by ID
 * Access: All authenticated users
 */
router.get(
  '/warehouses/:id',
  // authenticate,
  validate(uuidParamSchema, 'params'),
  (req, res, next) => warehouseController.getWarehouseById(req, res).catch(next)
);

/**
 * GET /api/v1/warehouses/:warehouseId/locations
 * Get all locations for a specific warehouse
 * Access: All authenticated users
 */
router.get(
  '/warehouses/:warehouseId/locations',
  // authenticate,
  validate(warehouseIdParamSchema, 'params'),
  (req, res, next) => warehouseController.getLocationsByWarehouse(req, res).catch(next)
);

/**
 * PUT /api/v1/warehouses/:id
 * Update warehouse
 * Access: Admin, Manager
 */
router.put(
  '/warehouses/:id',
  // authenticate,
  // authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(uuidParamSchema, 'params'),
  validate(updateWarehouseSchema, 'body'),
  (req, res, next) => warehouseController.updateWarehouse(req, res).catch(next)
);

/**
 * DELETE /api/v1/warehouses/:id
 * Deactivate warehouse (soft delete)
 * Access: Admin only
 */
router.delete(
  '/warehouses/:id',
  // authenticate,
  // authorize(UserRole.ADMIN),
  validate(uuidParamSchema, 'params'),
  (req, res, next) => warehouseController.deactivateWarehouse(req, res).catch(next)
);

// ============================================================================
// LOCATION ROUTES
// ============================================================================

/**
 * POST /api/v1/locations
 * Create a new location
 * Access: Admin, Manager
 */
router.post(
  '/locations',
  // authenticate,
  // authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(createLocationSchema, 'body'),
  (req, res, next) => warehouseController.createLocation(req, res).catch(next)
);

/**
 * GET /api/v1/locations
 * Get all locations with filters and pagination
 * Access: All authenticated users
 */
router.get(
  '/locations',
  // authenticate,
  validate(locationQuerySchema, 'query'),
  (req, res, next) => warehouseController.getAllLocations(req, res).catch(next)
);

/**
 * GET /api/v1/locations/:id
 * Get location by ID
 * Access: All authenticated users
 */
router.get(
  '/locations/:id',
  // authenticate,
  validate(uuidParamSchema, 'params'),
  (req, res, next) => warehouseController.getLocationById(req, res).catch(next)
);

/**
 * PUT /api/v1/locations/:id
 * Update location
 * Access: Admin, Manager
 */
router.put(
  '/locations/:id',
  // authenticate,
  // authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(uuidParamSchema, 'params'),
  validate(updateLocationSchema, 'body'),
  (req, res, next) => warehouseController.updateLocation(req, res).catch(next)
);

/**
 * DELETE /api/v1/locations/:id
 * Deactivate location (soft delete)
 * Access: Admin only
 */
router.delete(
  '/locations/:id',
  // authenticate,
  // authorize(UserRole.ADMIN),
  validate(uuidParamSchema, 'params'),
  (req, res, next) => warehouseController.deactivateLocation(req, res).catch(next)
);

export default router;
