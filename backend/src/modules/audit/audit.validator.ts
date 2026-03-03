import { z } from 'zod';
import { AuditAction } from '@prisma/client';

/**
 * Audit Validators
 */

export const auditLogFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
  sortBy: z.enum(['createdAt', 'action', 'entityType']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
