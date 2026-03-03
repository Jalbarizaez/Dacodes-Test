import { z } from 'zod';

/**
 * Purchase Order validation schemas using Zod
 */

// Purchase order status enum
const purchaseOrderStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
]);

// Line item schema
const lineItemSchema = z.object({
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
  unitPrice: z
    .number()
    .nonnegative('Unit price must be non-negative')
    .refine((val) => Number.isFinite(val), 'Unit price must be a valid number'),
});

// Create purchase order schema
export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Supplier ID must be a valid UUID'),
  orderDate: z
    .string()
    .datetime('Order date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val)),
  expectedDeliveryDate: z
    .string()
    .datetime('Expected delivery date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val)),
  lineItems: z
    .array(lineItemSchema)
    .min(1, 'At least one line item is required')
    .max(100, 'Maximum 100 line items allowed'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
}).refine(
  (data) => data.expectedDeliveryDate >= data.orderDate,
  {
    message: 'Expected delivery date must be on or after order date',
    path: ['expectedDeliveryDate'],
  }
);

// Update line item schema
const updateLineItemSchema = z.object({
  id: z.string().uuid('Line item ID must be a valid UUID').optional(),
  productId: z.string().uuid('Product ID must be a valid UUID'),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
  unitPrice: z
    .number()
    .nonnegative('Unit price must be non-negative')
    .refine((val) => Number.isFinite(val), 'Unit price must be a valid number'),
  _delete: z.boolean().optional(),
});

// Update purchase order schema
export const updatePurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Supplier ID must be a valid UUID').optional(),
  orderDate: z
    .string()
    .datetime('Order date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val))
    .optional(),
  expectedDeliveryDate: z
    .string()
    .datetime('Expected delivery date must be a valid ISO 8601 datetime')
    .transform((val) => new Date(val))
    .optional(),
  lineItems: z
    .array(updateLineItemSchema)
    .min(1, 'At least one line item is required')
    .max(100, 'Maximum 100 line items allowed')
    .optional(),
});

// Update status schema
export const updateStatusSchema = z.object({
  status: purchaseOrderStatusEnum,
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
});

// Query parameters schema
export const purchaseOrderQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  supplierId: z.string().uuid().optional(),
  status: z.any().optional(),
  orderDateFrom: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  orderDateTo: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  expectedDeliveryDateFrom: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  expectedDeliveryDateTo: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  search: z.string().optional(),
  sortBy: z
    .enum(['orderNumber', 'orderDate', 'expectedDeliveryDate', 'totalValue', 'createdAt'])
    .optional()
    .default('orderDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// UUID parameter schema
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid purchase order ID'),
});
