import { ReorderRule, ReorderAlert, Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import {
  ReorderRuleFilters,
  ReorderAlertFilters,
  ReorderRuleWithRelations,
} from './reorder.types.js';

/**
 * Reorder Repository
 * Handles all database operations for reorder rules and alerts
 */
export class ReorderRepository {
  /**
   * Find reorder rule by ID
   */
  async findById(
    id: string,
    includeRelations: boolean = true
  ): Promise<ReorderRuleWithRelations | null> {
    return prisma.reorderRule.findUnique({
      where: { id },
      include: includeRelations
        ? {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unitOfMeasure: true,
              },
            },
            alerts: {
              where: {
                isResolved: false,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
          }
        : undefined,
    });
  }

  /**
   * Find reorder rule by product ID
   */
  async findByProductId(productId: string): Promise<ReorderRuleWithRelations | null> {
    return prisma.reorderRule.findUnique({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            unitOfMeasure: true,
          },
        },
      },
    });
  }

  /**
   * Find all reorder rules with filters and pagination
   */
  async findAll(
    filters: ReorderRuleFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    includeRelations: boolean = true
  ): Promise<{ rules: ReorderRuleWithRelations[]; total: number }> {
    const where: Prisma.ReorderRuleWhereInput = {};

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.isEnabled !== undefined) {
      where.isEnabled = filters.isEnabled;
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'minimumQuantity':
        orderBy = { minimumQuantity: sortOrder };
        break;
      case 'reorderQuantity':
        orderBy = { reorderQuantity: sortOrder };
        break;
      case 'createdAt':
        orderBy = { createdAt: sortOrder };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    const [rules, total] = await Promise.all([
      prisma.reorderRule.findMany({
        where,
        include: includeRelations
          ? {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  unitOfMeasure: true,
                },
              },
            }
          : undefined,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.reorderRule.count({ where }),
    ]);

    return { rules, total };
  }

  /**
   * Create reorder rule
   */
  async create(
    productId: string,
    minimumQuantity: number,
    reorderQuantity: number,
    isEnabled: boolean = true
  ): Promise<ReorderRule> {
    return prisma.reorderRule.create({
      data: {
        productId,
        minimumQuantity,
        reorderQuantity,
        isEnabled,
      },
    });
  }

  /**
   * Update reorder rule
   */
  async update(id: string, data: Partial<ReorderRule>): Promise<ReorderRule> {
    return prisma.reorderRule.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete reorder rule
   */
  async delete(id: string): Promise<ReorderRule> {
    return prisma.reorderRule.delete({
      where: { id },
    });
  }

  /**
   * Get all enabled reorder rules
   */
  async findAllEnabled(): Promise<ReorderRuleWithRelations[]> {
    return prisma.reorderRule.findMany({
      where: {
        isEnabled: true,
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            unitOfMeasure: true,
          },
        },
      },
    });
  }

  /**
   * Create reorder alert
   */
  async createAlert(
    reorderRuleId: string,
    productId: string,
    currentStock: number,
    minimumQuantity: number,
    suggestedOrderQuantity: number
  ): Promise<ReorderAlert> {
    return prisma.reorderAlert.create({
      data: {
        reorderRuleId,
        productId,
        currentStock,
        minimumQuantity,
        suggestedOrderQuantity,
      },
    });
  }

  /**
   * Find all reorder alerts with filters and pagination
   */
  async findAllAlerts(
    filters: ReorderAlertFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ alerts: ReorderAlert[]; total: number }> {
    const where: Prisma.ReorderAlertWhereInput = {};

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.isResolved !== undefined) {
      where.isResolved = filters.isResolved;
    }

    if (filters.createdDateFrom || filters.createdDateTo) {
      where.createdAt = {};
      if (filters.createdDateFrom) {
        where.createdAt.gte = filters.createdDateFrom;
      }
      if (filters.createdDateTo) {
        where.createdAt.lte = filters.createdDateTo;
      }
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'createdAt':
        orderBy = { createdAt: sortOrder };
        break;
      case 'currentStock':
        orderBy = { currentStock: sortOrder };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    const [alerts, total] = await Promise.all([
      prisma.reorderAlert.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.reorderAlert.count({ where }),
    ]);

    return { alerts, total };
  }

  /**
   * Resolve reorder alert
   */
  async resolveAlert(id: string): Promise<ReorderAlert> {
    return prisma.reorderAlert.update({
      where: { id },
      data: {
        isResolved: true,
      },
    });
  }

  /**
   * Get reorder statistics
   */
  async getStatistics(filters?: ReorderRuleFilters): Promise<any> {
    const where: Prisma.ReorderRuleWhereInput = {};

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.isEnabled !== undefined) {
      where.isEnabled = filters.isEnabled;
    }

    const [totalRules, enabledRules, totalAlerts, unresolvedAlerts] = await Promise.all([
      prisma.reorderRule.count({ where }),
      prisma.reorderRule.count({ where: { ...where, isEnabled: true } }),
      prisma.reorderAlert.count(),
      prisma.reorderAlert.count({ where: { isResolved: false } }),
    ]);

    return {
      totalRules,
      enabledRules,
      disabledRules: totalRules - enabledRules,
      totalAlerts,
      unresolvedAlerts,
      resolvedAlerts: totalAlerts - unresolvedAlerts,
    };
  }
}
