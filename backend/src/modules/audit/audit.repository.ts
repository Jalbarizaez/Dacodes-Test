import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AuditLogFilters, AuditLogWithRelations } from './audit.types.js';

/**
 * Audit Repository
 * Handles all database operations for audit logs
 */
export class AuditRepository {
  /**
   * Find audit log by ID
   */
  async findById(id: string): Promise<AuditLogWithRelations | null> {
    return prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Find all audit logs with filters and pagination
   */
  async findAll(
    filters: AuditLogFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ logs: AuditLogWithRelations[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    if (filters.search) {
      where.OR = [
        { entityType: { contains: filters.search, mode: 'insensitive' } },
        { entityId: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'createdAt':
        orderBy = { createdAt: sortOrder };
        break;
      case 'action':
        orderBy = { action: sortOrder };
        break;
      case 'entityType':
        orderBy = { entityType: sortOrder };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Get audit logs by entity
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<AuditLogWithRelations[]> {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get audit logs by user
   */
  async findByUser(userId: string, limit: number = 50): Promise<AuditLogWithRelations[]> {
    return prisma.auditLog.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get audit statistics
   */
  async getStatistics(filters?: AuditLogFilters): Promise<any> {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalLogs, byAction, byEntityType, recent24h, recent7d, recent30d] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true,
      }),
      prisma.auditLog.count({
        where: {
          ...where,
          createdAt: { gte: last24Hours },
        },
      }),
      prisma.auditLog.count({
        where: {
          ...where,
          createdAt: { gte: last7Days },
        },
      }),
      prisma.auditLog.count({
        where: {
          ...where,
          createdAt: { gte: last30Days },
        },
      }),
    ]);

    const actionCounts: Record<string, number> = {};
    byAction.forEach((item) => {
      actionCounts[item.action] = item._count;
    });

    const entityTypeCounts: Record<string, number> = {};
    byEntityType.forEach((item) => {
      entityTypeCounts[item.entityType] = item._count;
    });

    return {
      totalLogs,
      byAction: actionCounts,
      byEntityType: entityTypeCounts,
      recentActivity: {
        last24Hours: recent24h,
        last7Days: recent7d,
        last30Days: recent30d,
      },
    };
  }
}
