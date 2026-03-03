import { z } from 'zod';

/**
 * Warehouse and Location validation schemas using Zod
 */

// ============================================================================
// WAREHOUSE VALIDATORS
// ============================================================================

// Create warehouse schema
export const createWarehouseSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be at most 200 characters'),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(500, 'Address must be at most 500 characters'),
});

// Update warehouse schema
export const updateWarehouseSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(200, 'Name must be at most 200 characters')
    .optional(),
  address: z
    .string()
    .min(1, 'Address cannot be empty')
    .max(500, 'Address must be at most 500 characters')
    .optional(),
});

// Warehouse query parameters schema
export const warehouseQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// ============================================================================
// LOCATION VALIDATORS
// ============================================================================

// Location type enum
const locationTypeEnum = z.enum(['ZONE', 'RACK', 'SHELF', 'BIN', 'PALLET', 'FLOOR', 'OTHER']);

// Create location schema
export const createLocationSchema = z.object({
  warehouseId: z
    .string()
    .uuid('Warehouse ID must be a valid UUID'),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be at most 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
  name: z
    .string()
    .max(200, 'Name must be at most 200 characters')
    .optional(),
  type: locationTypeEnum.optional(),
  capacity: z
    .number()
    .int('Capacity must be an integer')
    .positive('Capacity must be positive')
    .optional(),
});

// Update location schema
export const updateLocationSchema = z.object({
  code: z
    .string()
    .min(1, 'Code cannot be empty')
    .max(50, 'Code must be at most 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens')
    .optional(),
  name: z
    .string()
    .max(200, 'Name must be at most 200 characters')
    .optional()
    .nullable(),
  type: locationTypeEnum.optional().nullable(),
  capacity: z
    .number()
    .int('Capacity must be an integer')
    .positive('Capacity must be positive')
    .optional()
    .nullable(),
});

// Location query parameters schema
export const locationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  warehouseId: z.string().uuid().optional(),
  type: locationTypeEnum.optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().optional(),
  sortBy: z.enum(['code', 'name', 'createdAt', 'updatedAt']).optional().default('code'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// UUID parameter schema
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// Warehouse ID parameter schema
export const warehouseIdParamSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID format'),
});
