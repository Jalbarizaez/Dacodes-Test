import { AuditAction } from '@prisma/client';

/**
 * Audit Types
 */

export interface AuditLogWithRelations {
  id: string;
  userId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  description: string | null;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface AuditLogStatistics {
  totalLogs: number;
  byAction: Record<AuditAction, number>;
  byEntityType: Record<string, number>;
  recentActivity: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
}
