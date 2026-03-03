import { z } from 'zod';

/**
 * Reorder validation schemas using Zod
 */

// Create reorder rule schema
export const createReorderRuleSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  minimumQuantity: z
    .number()
    .int('Minimum quantity must be an integer')
    .nonnegative('Minimum quantity must be non-negative'),
  reorderQuantity: z
    .number()
    .int('Reorder quantity must be an integer')
    .positive('Reorder quantity must be positive'),
  isEnabled: z.boolean().optional().default(true),
  // Future AI fields
  maxQuantity: z
    .number()
    .int('Max quantity must be an integer')
    .positive('Max quantity must be positive')
    .optional(),
  safetyStock: z
    .number()
    .int('Safety stock must be an integer')
    .nonnegative('Safety stock must be non-negative')
    .optional(),
  leadTimeDays: z
    .number()
    .int('Lead time days must be an integer')
    .nonnegative('Lead time days must be non-negative')
    .optional(),
});

// Update reorder rule schema
export const updateReorderRuleSchema = z.object({
  minimumQuantity: z
    .number()
    .int('Minimum quantity must be an integer')
    .nonnegative('Minimum quantity must be non-negative')
    .optional(),
  reorderQuantity: z
    .number()
    .int('Reorder quantity must be an integer')
    .positive('Reorder quantity must be positive')
    .optional(),
  isEnabled: z.boolean().optional(),
  // Future AI fields
  maxQuantity: z
    .number()
    .int('Max quantity must be an integer')
    .positive('Max quantity must be positive')
    .optional(),
  safetyStock: z
    .number()
    .int('Safety stock must be an integer')
    .nonnegative('Safety stock must be non-negative')
    .optional(),
  leadTimeDays: z
    .number()
    .int('Lead time days must be an integer')
    .nonnegative('Lead time days must be non-negative')
    .optional(),
});

// Query parameters schema for reorder rules
export const reorderRuleQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  productId: z.string().uuid().optional(),
  isEnabled: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  sortBy: z.enum(['minimumQuantity', 'reorderQuantity', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Query parameters schema for reorder alerts
export const reorderAlertQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  productId: z.string().uuid().optional(),
  isResolved: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  createdDateFrom: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  createdDateTo: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  sortBy: z.enum(['createdAt', 'currentStock']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// UUID parameter schema
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID'),
});
