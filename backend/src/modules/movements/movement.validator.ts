import { z } from 'zod';

/**
 * Movement validation schemas using Zod
 */

// Movement type enum
const movementTypeEnum = z.enum([
  'RECEIPT',
  'SHIPMENT',
  'ADJUSTMENT',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'EXPIRATION',
  'DAMAGE',
  'RETURN',
  'RESERVATION',
  'RELEASE',
]);

// Stock status enum
const stockStatusEnum = z.enum(['AVAILABLE', 'RESERVED', 'DAMAGED', 'QUARANTINE']);

// Create movement schema
export const createMovementSchema = z.object({
  type: movementTypeEnum,
  productId: z.string().uuid('Product ID must be a valid UUID'),
  locationId: z.string().uuid('Location ID must be a valid UUID'),
  lotId: z.string().uuid('Lot ID must be a valid UUID').optional(),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .refine((val) => val !== 0, 'Quantity cannot be zero'),
  fromStatus: stockStatusEnum.optional(),
  toStatus: stockStatusEnum.optional(),
  userId: z.string().uuid('User ID must be a valid UUID'),
  reason: z.string().max(500, 'Reason must be at most 500 characters').optional(),
  referenceType: z.string().max(50, 'Reference type must be at most 50 characters').optional(),
  referenceId: z.string().uuid('Reference ID must be a valid UUID').optional(),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
});

// Stock adjustment schema (simplified)
export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  locationId: z.string().uuid('Location ID must be a valid UUID'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .refine((val) => val !== 0, 'Quantity cannot be zero'),
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be at most 500 characters'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
});

// Stock status change schema
export const stockStatusChangeSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  locationId: z.string().uuid('Location ID must be a valid UUID'),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
  fromStatus: stockStatusEnum,
  toStatus: stockStatusEnum,
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be at most 500 characters'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
}).refine(
  (data) => data.fromStatus !== data.toStatus,
  {
    message: 'From status and to status must be different',
    path: ['toStatus'],
  }
);

// Movement query parameters schema
export const movementQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  productId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  lotId: z.string().uuid().optional(),
  type: movementTypeEnum.optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  dateTo: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
  sortBy: z.enum(['date', 'type', 'quantity']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// UUID parameter schema
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid movement ID'),
});
