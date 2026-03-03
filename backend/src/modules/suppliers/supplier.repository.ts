import { Supplier, Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { SupplierFilters, SupplierWithRelations } from './supplier.types.js';

/**
 * Supplier Repository
 * Handles all database operations for suppliers
 */
export class SupplierRepository {
  /**
   * Find supplier by ID
   */
  async findById(id: string, includeRelations: boolean = false): Promise<SupplierWithRelations | null> {
    return prisma.supplier.findUnique({
      where: { id },
      include: includeRelations ? {
        _count: {
          select: {
            purchaseOrders: true,
            lots: true,
          },
        },
      } : undefined,
    });
  }

  /**
   * Find supplier by name
   */
  async findByName(name: string): Promise<Supplier | null> {
    return prisma.supplier.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
  }

  /**
   * Find all suppliers with filters and pagination
   */
  async findAll(
    filters: SupplierFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    includeRelations: boolean = false
  ): Promise<{ suppliers: SupplierWithRelations[]; total: number }> {
    const where: Prisma.SupplierWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          contactName: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy = { name: sortOrder };
        break;
      case 'leadTimeDays':
        orderBy = { leadTimeDays: sortOrder };
        break;
      case 'createdAt':
        orderBy = { createdAt: sortOrder };
        break;
      case 'updatedAt':
        orderBy = { updatedAt: sortOrder };
        break;
      default:
        orderBy = { name: sortOrder };
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: includeRelations ? {
          _count: {
            select: {
              purchaseOrders: true,
              lots: true,
            },
          },
        } : undefined,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.supplier.count({ where }),
    ]);

    return { suppliers, total };
  }

  /**
   * Create supplier
   */
  async create(data: Prisma.SupplierCreateInput): Promise<Supplier> {
    return prisma.supplier.create({
      data,
    });
  }

  /**
   * Update supplier
   */
  async update(id: string, data: Prisma.SupplierUpdateInput): Promise<Supplier> {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  }

  /**
   * Deactivate supplier (soft delete)
   */
  async deactivate(id: string): Promise<Supplier> {
    return prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Activate supplier
   */
  async activate(id: string): Promise<Supplier> {
    return prisma.supplier.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Check if supplier has active purchase orders
   */
  async hasActivePurchaseOrders(id: string): Promise<boolean> {
    const count = await prisma.purchaseOrder.count({
      where: {
        supplierId: id,
        status: {
          in: ['DRAFT', 'SUBMITTED', 'PARTIALLY_RECEIVED'],
        },
      },
    });

    return count > 0;
  }

  /**
   * Get supplier statistics (for future supplier scoring)
   */
  async getSupplierStatistics(id: string): Promise<{
    totalPurchaseOrders: number;
    totalLots: number;
    completedOrders: number;
    cancelledOrders: number;
  }> {
    const [totalPurchaseOrders, totalLots, completedOrders, cancelledOrders] = await Promise.all([
      prisma.purchaseOrder.count({
        where: { supplierId: id },
      }),
      prisma.lot.count({
        where: { supplierId: id },
      }),
      prisma.purchaseOrder.count({
        where: {
          supplierId: id,
          status: 'RECEIVED',
        },
      }),
      prisma.purchaseOrder.count({
        where: {
          supplierId: id,
          status: 'CANCELLED',
        },
      }),
    ]);

    return {
      totalPurchaseOrders,
      totalLots,
      completedOrders,
      cancelledOrders,
    };
  }

  /**
   * Get active suppliers count
   */
  async getActiveCount(): Promise<number> {
    return prisma.supplier.count({
      where: { isActive: true },
    });
  }

  /**
   * Get all active suppliers (for dropdowns)
   */
  async findAllActive(): Promise<Supplier[]> {
    return prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
