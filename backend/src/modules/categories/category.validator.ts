import { z } from 'zod';

/**
 * Category validation schemas using Zod
 */

// Create category schema
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  parentId: z
    .string()
    .uuid('Parent ID must be a valid UUID')
    .optional(),
});

// Update category schema (all fields optional)
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be at most 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .nullable(),
  parentId: z
    .string()
    .uuid('Parent ID must be a valid UUID')
    .optional()
    .nullable(),
  isActive: z
    .boolean()
    .optional(),
});

// Query parameters schema
export const categoryQuerySchema = z.object({
  parentId: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().optional(),
});

// UUID parameter schema
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
});
