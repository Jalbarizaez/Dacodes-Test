import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
  uuidParamSchema,
} from './category.validator.js';

const router = Router();

/**
 * Category Routes
 * All routes are prefixed with /api/v1/categories
 */

/**
 * POST /api/v1/categories
 * Create a new category
 */
router.post(
  '/',
  validate(createCategorySchema, 'body'),
  categoryController.create
);

/**
 * GET /api/v1/categories
 * Get all categories with filters
 */
router.get(
  '/',
  validate(categoryQuerySchema, 'query'),
  categoryController.getAll
);

/**
 * GET /api/v1/categories/:id
 * Get category by ID
 */
router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  categoryController.getById
);

/**
 * PUT /api/v1/categories/:id
 * Update category
 */
router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateCategorySchema, 'body'),
  categoryController.update
);

/**
 * DELETE /api/v1/categories/:id
 * Deactivate category (soft delete)
 */
router.delete(
  '/:id',
  validate(uuidParamSchema, 'params'),
  categoryController.delete
);

export default router;
