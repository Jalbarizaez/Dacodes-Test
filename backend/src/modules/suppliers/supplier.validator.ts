import { z } from 'zod';

/**
 * Supplier validation schemas using Zod
 */

// Create supplier schema
export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be at most 200 characters'),
  contactName: z
    .string()
    .max(200, 'Contact name must be at most 200 characters')
    .optional(),
  email: z
    .string()
    .email('Invalid email format')
    .max(100, 'Email must be at most 100 characters')
    .optional(),
  phone: z
    .string()
    .max(50, 'Phone must be at most 50 characters')
    .optional(),
  address: z
    .string()
    .max(500, 'Address must be at most 500 characters')
    .optional(),
  paymentTerms: z
    .string()
    .max(200, 'Payment terms must be at most 200 characters')
    .optional(),
  leadTimeDays: z
    .number()
    .int('Lead time must be an integer')
    .min(0, 'Lead time must be non-negative')
    .optional(),
});

// Update supplier schema (all fields optional)
export const updateSupplierSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(200, 'Name must be at most 200 characters')
    .optional(),
  contactName: z
    .string()
    .max(200, 'Contact name must be at most 200 characters')
    .optional()
    .nullable(),
  email: z
    .string()
    .email('Invalid email format')
    .max(100, 'Email must be at most 100 characters')
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(50, 'Phone must be at most 50 characters')
    .optional()
    .nullable(),
  address: z
    .string()
    .max(500, 'Address must be at most 500 characters')
    .optional()
    .nullable(),
  paymentTerms: z
    .string()
    .max(200, 'Payment terms must be at most 200 characters')
    .optional()
    .nullable(),
  leadTimeDays: z
    .number()
    .int('Lead time must be an integer')
    .min(0, 'Lead time must be non-negative')
    .optional(),
});

// Query parameters schema
export const supplierQuerySchema = z.object({
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
  sortBy: z.enum(['name', 'leadTimeDays', 'createdAt', 'updatedAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// UUID parameter schema
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid supplier ID'),
});
