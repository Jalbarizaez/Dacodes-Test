import { z } from 'zod';

/**
 * Product validation schemas using Zod
 */

// Unit of measure enum
const unitOfMeasureEnum = z.enum(['UNIT', 'KG', 'LITER', 'METER', 'BOX', 'PALLET']);

// Create product schema
export const createProductSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be at most 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be at most 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),
  categoryId: z
    .string()
    .uuid('Category ID must be a valid UUID'),
  unitOfMeasure: unitOfMeasureEnum,
  minStock: z
    .number()
    .int('Minimum stock must be an integer')
    .min(0, 'Minimum stock must be non-negative')
    .optional(),
  maxStock: z
    .number()
    .int('Maximum stock must be an integer')
    .min(0, 'Maximum stock must be non-negative')
    .optional(),
  weight: z
    .number()
    .positive('Weight must be positive')
    .optional(),
  dimensions: z
    .string()
    .max(100, 'Dimensions must be at most 100 characters')
    .optional(),
  barcode: z
    .string()
    .max(50, 'Barcode must be at most 50 characters')
    .optional(),
}).refine(
  (data) => {
    // If both minStock and maxStock are provided, minStock must be <= maxStock
    if (data.minStock !== null && data.maxStock !== null && data.minStock !== undefined && data.maxStock !== undefined) {
      return data.minStock <= data.maxStock;
    }
    return true;
  },
  {
    message: 'Minimum stock must be less than or equal to maximum stock',
    path: ['minStock'],
  }
);

// Update product schema (all fields optional)
export const updateProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(200, 'Name must be at most 200 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .nullable(),
  categoryId: z
    .string()
    .uuid('Category ID must be a valid UUID')
    .optional(),
  unitOfMeasure: unitOfMeasureEnum.optional(),
  minStock: z
    .number()
    .int('Minimum stock must be an integer')
    .min(0, 'Minimum stock must be non-negative')
    .optional()
    .nullable(),
  maxStock: z
    .number()
    .int('Maximum stock must be an integer')
    .min(0, 'Maximum stock must be non-negative')
    .optional()
    .nullable(),
  weight: z
    .number()
    .positive('Weight must be positive')
    .optional()
    .nullable(),
  dimensions: z
    .string()
    .max(100, 'Dimensions must be at most 100 characters')
    .optional()
    .nullable(),
  barcode: z
    .string()
    .max(50, 'Barcode must be at most 50 characters')
    .optional()
    .nullable(),
}).refine(
  (data) => {
    // If both minStock and maxStock are provided, minStock must be <= maxStock
    if (data.minStock !== null && data.maxStock !== null && data.minStock !== undefined && data.maxStock !== undefined) {
      return data.minStock <= data.maxStock;
    }
    return true;
  },
  {
    message: 'Minimum stock must be less than or equal to maximum stock',
    path: ['minStock'],
  }
);

// Query parameters schema
export const productQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  categoryId: z.string().uuid().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'sku', 'createdAt', 'updatedAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// UUID parameter schema
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
});

// SKU parameter schema
export const skuParamSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
});
