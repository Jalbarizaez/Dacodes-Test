import { z } from 'zod';
import { TransferStatus } from '@prisma/client';

/**
 * Transfer validation schemas using Zod
 */

// Transfer item schema
const transferItemSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  lotId: z.string().uuid('Lot ID must be a valid UUID').optional(),
  quantityRequested: z
    .number()
    .int('Quantity requested must be an integer')
    .positive('Quantity requested must be positive'),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
});

// Create transfer schema
export const createTransferSchema = z.object({
  sourceLocationId: z.string().uuid('Source location ID must be a valid UUID'),
  destinationLocationId: z.string().uuid('Destination location ID must be a valid UUID'),
  requestedDate: z
    .string()
    .datetime('Requested date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val)),
  requestedBy: z.string().uuid('Requested by must be a valid UUID'),
  items: z
    .array(transferItemSchema)
    .min(1, 'At least one transfer item is required')
    .max(100, 'Maximum 100 transfer items allowed'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
});

// Update transfer status schema
export const updateTransferStatusSchema = z.object({
  status: z.nativeEnum(TransferStatus, {
    errorMap: () => ({ message: 'Invalid transfer status' }),
  }),
  approvedBy: z.string().uuid('Approved by must be a valid UUID').optional(),
});

// Ship transfer item schema
const shipTransferItemSchema = z.object({
  itemId: z.string().uuid('Item ID must be a valid UUID'),
  quantityShipped: z
    .number()
    .int('Quantity shipped must be an integer')
    .nonnegative('Quantity shipped must be non-negative'),
});

// Ship transfer schema
export const shipTransferSchema = z.object({
  shippedDate: z
    .string()
    .datetime('Shipped date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val)),
  items: z
    .array(shipTransferItemSchema)
    .min(1, 'At least one item must be shipped')
    .max(100, 'Maximum 100 items allowed'),
});

// Complete transfer item schema
const completeTransferItemSchema = z.object({
  itemId: z.string().uuid('Item ID must be a valid UUID'),
  quantityReceived: z
    .number()
    .int('Quantity received must be an integer')
    .nonnegative('Quantity received must be non-negative'),
});

// Complete transfer schema
export const completeTransferSchema = z.object({
  completedDate: z
    .string()
    .datetime('Completed date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val)),
  items: z
    .array(completeTransferItemSchema)
    .min(1, 'At least one item must be received')
    .max(100, 'Maximum 100 items allowed'),
});

// Query parameters schema
export const transferQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  status: z.nativeEnum(TransferStatus).optional(),
  sourceLocationId: z.string().uuid().optional(),
  destinationLocationId: z.string().uuid().optional(),
  requestedDateFrom: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  requestedDateTo: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  requestedBy: z.string().uuid().optional(),
  sortBy: z.enum(['requestedDate', 'createdAt', 'status']).optional().default('requestedDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// UUID parameter schema
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid transfer ID'),
});
