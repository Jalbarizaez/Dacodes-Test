import { z } from 'zod';

/**
 * Stock validation schemas using Zod
 */

// Stock query parameters schema
export const stockQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  productId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  hasStock: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  lowStock: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  sortBy: z
    .enum(['productName', 'locationCode', 'quantityTotal', 'updatedAt'])
    .optional()
    .default('productName'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// UUID parameter schemas
export const productIdParamSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
});

export const warehouseIdParamSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID'),
});

export const locationIdParamSchema = z.object({
  locationId: z.string().uuid('Invalid location ID'),
});

// Stock adjustment schema (for future use)
export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  locationId: z.string().uuid('Location ID must be a valid UUID'),
  quantityChange: z
    .number()
    .int('Quantity change must be an integer')
    .refine((val) => val !== 0, 'Quantity change cannot be zero'),
  fromStatus: z.enum(['AVAILABLE', 'RESERVED', 'DAMAGED']).optional(),
  toStatus: z.enum(['AVAILABLE', 'RESERVED', 'DAMAGED']).optional(),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be at most 500 characters'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
});
