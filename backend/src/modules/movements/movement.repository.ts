import { StockMovement, Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { MovementFilters, MovementWithRelations, CreateMovementDTO } from './movement.types.js';
import { auditCreate, createAuditSummary } from '../../shared/utils/audit.js';

/**
 * Movement Repository
 * Handles all database operations for stock movements
 */
export class MovementRepository {
  /**
   * Find movement by ID
   */
  async findById(id: string): Promise<MovementWithRelations | null> {
    return prisma.stockMovement.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        lot: {
          select: {
            id: true,
            lotNumber: true,
          },
        },
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
   * Find all movements with filters and pagination
   */
  async findAll(
    filters: MovementFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ movements: MovementWithRelations[]; total: number }> {
    const where: Prisma.StockMovementWhereInput = {};

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    if (filters.warehouseId) {
      where.location = {
        warehouseId: filters.warehouseId,
      };
    }

    if (filters.lotId) {
      where.lotId = filters.lotId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.date.lte = filters.dateTo;
      }
    }

    if (filters.referenceType) {
      where.referenceType = filters.referenceType;
    }

    if (filters.referenceId) {
      where.referenceId = filters.referenceId;
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'date':
        orderBy = { date: sortOrder };
        break;
      case 'type':
        orderBy = { type: sortOrder };
        break;
      case 'quantity':
        orderBy = { quantity: sortOrder };
        break;
      default:
        orderBy = { date: sortOrder };
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
          location: {
            select: {
              id: true,
              code: true,
              name: true,
              warehouse: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          lot: {
            select: {
              id: true,
              lotNumber: true,
            },
          },
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
      prisma.stockMovement.count({ where }),
    ]);

    return { movements, total };
  }

  /**
   * Create movement with stock level update (transaction)
   */
  async createMovementWithStockUpdate(
    movementData: CreateMovementDTO,
    allowNegativeStock: boolean = false
  ): Promise<StockMovement> {
    return prisma.$transaction(async (tx) => {
      // Get current stock level
      const currentStock = await tx.stockLevel.findUnique({
        where: {
          productId_locationId: {
            productId: movementData.productId,
            locationId: movementData.locationId,
          },
        },
      });

      // Calculate running balance
      const currentBalance = currentStock?.quantityTotal || 0;
      const runningBalance = currentBalance + movementData.quantity;

      // Validate negative stock
      if (!allowNegativeStock && runningBalance < 0) {
        throw new Error(
          `Insufficient stock. Current: ${currentBalance}, Requested: ${Math.abs(movementData.quantity)}`
        );
      }

      // Determine which stock status fields to update
      let stockUpdate: {
        quantityAvailable?: number;
        quantityReserved?: number;
        quantityDamaged?: number;
        quantityTotal: number;
      } = {
        quantityTotal: runningBalance,
      };

      // Handle status changes
      if (movementData.fromStatus && movementData.toStatus) {
        // Status change: decrease from one status, increase to another
        const currentAvailable = currentStock?.quantityAvailable || 0;
        const currentReserved = currentStock?.quantityReserved || 0;
        const currentDamaged = currentStock?.quantityDamaged || 0;

        stockUpdate = {
          quantityAvailable: currentAvailable,
          quantityReserved: currentReserved,
          quantityDamaged: currentDamaged,
          quantityTotal: runningBalance,
        };

        // Decrease from status
        if (movementData.fromStatus === 'AVAILABLE') {
          stockUpdate.quantityAvailable = currentAvailable - Math.abs(movementData.quantity);
        } else if (movementData.fromStatus === 'RESERVED') {
          stockUpdate.quantityReserved = currentReserved - Math.abs(movementData.quantity);
        } else if (movementData.fromStatus === 'DAMAGED') {
          stockUpdate.quantityDamaged = currentDamaged - Math.abs(movementData.quantity);
        }

        // Increase to status
        if (movementData.toStatus === 'AVAILABLE') {
          stockUpdate.quantityAvailable! += Math.abs(movementData.quantity);
        } else if (movementData.toStatus === 'RESERVED') {
          stockUpdate.quantityReserved! += Math.abs(movementData.quantity);
        } else if (movementData.toStatus === 'DAMAGED') {
          stockUpdate.quantityDamaged! += Math.abs(movementData.quantity);
        }
      } else {
        // Regular movement: update available stock
        const currentAvailable = currentStock?.quantityAvailable || 0;
        const currentReserved = currentStock?.quantityReserved || 0;
        const currentDamaged = currentStock?.quantityDamaged || 0;

        // Determine target status based on movement type
        const targetStatus = movementData.toStatus || 'AVAILABLE';

        stockUpdate = {
          quantityAvailable: currentAvailable,
          quantityReserved: currentReserved,
          quantityDamaged: currentDamaged,
          quantityTotal: runningBalance,
        };

        if (targetStatus === 'AVAILABLE') {
          stockUpdate.quantityAvailable = currentAvailable + movementData.quantity;
        } else if (targetStatus === 'RESERVED') {
          stockUpdate.quantityReserved = currentReserved + movementData.quantity;
        } else if (targetStatus === 'DAMAGED') {
          stockUpdate.quantityDamaged = currentDamaged + movementData.quantity;
        }
      }

      // Validate individual status quantities
      if (!allowNegativeStock) {
        if (stockUpdate.quantityAvailable !== undefined && stockUpdate.quantityAvailable < 0) {
          throw new Error('Insufficient available stock');
        }
        if (stockUpdate.quantityReserved !== undefined && stockUpdate.quantityReserved < 0) {
          throw new Error('Insufficient reserved stock');
        }
        if (stockUpdate.quantityDamaged !== undefined && stockUpdate.quantityDamaged < 0) {
          throw new Error('Insufficient damaged stock');
        }
      }

      // Upsert stock level
      await tx.stockLevel.upsert({
        where: {
          productId_locationId: {
            productId: movementData.productId,
            locationId: movementData.locationId,
          },
        },
        update: stockUpdate,
        create: {
          productId: movementData.productId,
          locationId: movementData.locationId,
          quantityAvailable: stockUpdate.quantityAvailable || 0,
          quantityReserved: stockUpdate.quantityReserved || 0,
          quantityDamaged: stockUpdate.quantityDamaged || 0,
          quantityTotal: stockUpdate.quantityTotal,
        },
      });

      // Create movement record
      const movement = await tx.stockMovement.create({
        data: {
          type: movementData.type,
          productId: movementData.productId,
          locationId: movementData.locationId,
          lotId: movementData.lotId,
          quantity: movementData.quantity,
          fromStatus: movementData.fromStatus,
          toStatus: movementData.toStatus,
          userId: movementData.userId,
          reason: movementData.reason,
          referenceType: movementData.referenceType,
          referenceId: movementData.referenceId,
          notes: movementData.notes,
          runningBalance,
        },
      });

      // Audit log (fire-and-forget, won't block transaction)
      auditCreate(
        'stock_movement',
        movement.id,
        createAuditSummary(movement, ['type', 'productId', 'locationId', 'quantity', 'runningBalance']),
        movementData.userId,
        `Stock movement ${movement.type}: ${movement.quantity} units`
      ).catch(() => {
        // Ignore audit errors to not break the transaction
      });

      return movement;
    });
  }

  /**
   * Get movement summary by filters
   */
  async getMovementSummary(filters: MovementFilters): Promise<{
    totalMovements: number;
    totalInbound: number;
    totalOutbound: number;
    totalAdjustments: number;
    byType: Record<string, number>;
  }> {
    const where: Prisma.StockMovementWhereInput = {};

    if (filters.productId) where.productId = filters.productId;
    if (filters.locationId) where.locationId = filters.locationId;
    if (filters.warehouseId) {
      where.location = { warehouseId: filters.warehouseId };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = filters.dateFrom;
      if (filters.dateTo) where.date.lte = filters.dateTo;
    }

    const [totalMovements, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        select: {
          type: true,
          quantity: true,
        },
      }),
    ]);

    let totalInbound = 0;
    let totalOutbound = 0;
    let totalAdjustments = 0;
    const byType: Record<string, number> = {};

    for (const movement of movements) {
      // Count by type
      byType[movement.type] = (byType[movement.type] || 0) + 1;

      // Categorize by direction
      if (movement.quantity > 0) {
        if (movement.type === 'ADJUSTMENT') {
          totalAdjustments++;
        } else {
          totalInbound++;
        }
      } else {
        if (movement.type === 'ADJUSTMENT') {
          totalAdjustments++;
        } else {
          totalOutbound++;
        }
      }
    }

    return {
      totalMovements,
      totalInbound,
      totalOutbound,
      totalAdjustments,
      byType,
    };
  }

  /**
   * Get movement history for a product at a location
   */
  async getMovementHistory(
    productId: string,
    locationId: string,
    limit: number = 50
  ): Promise<MovementWithRelations[]> {
    return prisma.stockMovement.findMany({
      where: {
        productId,
        locationId,
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            warehouse: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        lot: {
          select: {
            id: true,
            lotNumber: true,
          },
        },
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
        date: 'desc',
      },
      take: limit,
    });
  }
}
