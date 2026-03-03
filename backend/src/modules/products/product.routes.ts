import { Router } from 'express';
import { ProductController } from './product.controller.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  uuidParamSchema,
  skuParamSchema,
} from './product.validator.js';
// import { authenticate, authorize } from '../../shared/middleware/auth.middleware.js';
// import { UserRole } from '../../shared/types/index.js';

const router = Router();
const productController = new ProductController();

/**
 * Product Routes
 * All routes are prefixed with /api/v1/products
 */

// Note: Authentication middleware commented out for initial testing
// Uncomment when auth module is implemented

/**
 * POST /api/v1/products
 * Create a new product
 * Access: Admin, Manager
 */
router.post(
  '/',
  // authenticate,
  // authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(createProductSchema, 'body'),
  (req, res, next) => productController.create(req, res).catch(next)
);

/**
 * GET /api/v1/products
 * Get all products with filters and pagination
 * Access: All authenticated users
 */
router.get(
  '/',
  // authenticate,
  validate(productQuerySchema, 'query'),
  (req, res, next) => productController.getAll(req, res).catch(next)
);

/**
 * GET /api/v1/products/sku/:sku
 * Get product by SKU
 * Access: All authenticated users
 * Note: This route must be before /:id to avoid conflicts
 */
router.get(
  '/sku/:sku',
  // authenticate,
  validate(skuParamSchema, 'params'),
  (req, res, next) => productController.getBySku(req, res).catch(next)
);

/**
 * GET /api/v1/products/:id
 * Get product by ID
 * Access: All authenticated users
 */
router.get(
  '/:id',
  // authenticate,
  validate(uuidParamSchema, 'params'),
  (req, res, next) => productController.getById(req, res).catch(next)
);

/**
 * PUT /api/v1/products/:id
 * Update product
 * Access: Admin, Manager
 */
router.put(
  '/:id',
  // authenticate,
  // authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(uuidParamSchema, 'params'),
  validate(updateProductSchema, 'body'),
  (req, res, next) => productController.update(req, res).catch(next)
);

/**
 * DELETE /api/v1/products/:id
 * Deactivate product (soft delete)
 * Access: Admin only
 */
router.delete(
  '/:id',
  // authenticate,
  // authorize(UserRole.ADMIN),
  validate(uuidParamSchema, 'params'),
  (req, res, next) => productController.deactivate(req, res).catch(next)
);

export default router;
