import { z } from 'zod';

/**
 * Reception validation schemas using Zod
 */

// Reception item schema
const receptionItemSchema = z.object({
  lineItemId: z.string().uuid('Line item ID must be a valid UUID'),
  receivedQuantity: z
    .number()
    .int('Received quantity must be an integer')
    .positive('Received quantity must be positive'),
  locationId: z.string().uuid('Location ID must be a valid UUID'),
  batchNumber: z.string().max(100, 'Batch number must be at most 100 characters').optional(),
  expirationDate: z
    .string()
    .datetime('Expiration date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val))
    .optional(),
});

// Create reception schema
export const createReceptionSchema = z.object({
  purchaseOrderId: z.string().uuid('Purchase order ID must be a valid UUID'),
  receivedDate: z
    .string()
    .datetime('Received date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val)),
  receivedBy: z
    .string()
    .min(1, 'Received by is required')
    .max(200, 'Received by must be at most 200 characters'),
  items: z
    .array(receptionItemSchema)
    .min(1, 'At least one reception item is required')
    .max(100, 'Maximum 100 reception items allowed'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
});

// Query parameters schema
export const receptionQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  purchaseOrderId: z.string().uuid().optional(),
  receivedDateFrom: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  receivedDateTo: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  receivedBy: z.string().optional(),
  sortBy: z.enum(['receivedDate', 'createdAt']).optional().default('receivedDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// UUID parameter schema
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid reception ID'),
});
