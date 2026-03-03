import { StockTransfer, Prisma, TransferStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import {
  TransferFilters,
  TransferWithRelations,
  CreateTransferItemDTO,
  ShipTransferItemDTO,
  CompleteTransferItemDTO,
} from './transfer.types.js';
import { auditCreate, auditUpdate, createAuditSummary } from '../../shared/utils/audit.js';

/**
 * Transfer Repository
 * Handles all database operations for transfers
 */
export class TransferRepository {
  /**
   * Find transfer by ID
   */
  async findById(
    id: string,
    includeRelations: boolean = true
  ): Promise<TransferWithRelations | null> {
    return prisma.stockTransfer.findUnique({
      where: { id },
      include: includeRelations
        ? {
            sourceLocation: {
              select: {
                id: true,
                code: true,
                warehouse: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            destinationLocation: {
              select: {
                id: true,
                code: true,
                warehouse: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            requestedByUser: {
              select: {
                id: true,
                email: true,
              },
            },
            approvedByUser: {
              select: {
                id: true,
                email: true,
              },
            },
            items: {
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
            },
          }
        : undefined,
    });
  }

  /**
   * Find all transfers with filters and pagination
   */
  async findAll(
    filters: TransferFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'requestedDate',
    sortOrder: 'asc' | 'desc' = 'desc',
    includeRelations: boolean = true
  ): Promise<{ transfers: TransferWithRelations[]; total: number }> {
    const where: Prisma.StockTransferWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.sourceLocationId) {
      where.sourceLocationId = filters.sourceLocationId;
    }

    if (filters.destinationLocationId) {
      where.destinationLocationId = filters.destinationLocationId;
    }

    if (filters.requestedDateFrom || filters.requestedDateTo) {
      where.requestedDate = {};
      if (filters.requestedDateFrom) {
        where.requestedDate.gte = filters.requestedDateFrom;
      }
      if (filters.requestedDateTo) {
        where.requestedDate.lte = filters.requestedDateTo;
      }
    }

    if (filters.requestedBy) {
      where.requestedBy = filters.requestedBy;
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'requestedDate':
        orderBy = { requestedDate: sortOrder };
        break;
      case 'createdAt':
        orderBy = { createdAt: sortOrder };
        break;
      case 'status':
        orderBy = { status: sortOrder };
        break;
      default:
        orderBy = { requestedDate: sortOrder };
    }

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        include: includeRelations
          ? {
              sourceLocation: {
                select: {
                  id: true,
                  code: true,
                  warehouse: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              destinationLocation: {
                select: {
                  id: true,
                  code: true,
                  warehouse: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              requestedByUser: {
                select: {
                  id: true,
                  email: true,
                },
              },
              approvedByUser: {
                select: {
                  id: true,
                  email: true,
                },
              },
              items: {
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
              },
            }
          : undefined,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.stockTransfer.count({ where }),
    ]);

    return { transfers, total };
  }

  /**
   * Create transfer
   */
  async create(
    sourceLocationId: string,
    destinationLocationId: string,
    requestedDate: Date,
    requestedBy: string,
    items: CreateTransferItemDTO[],
    notes?: string
  ): Promise<StockTransfer> {
    // Generate transfer number
    const count = await prisma.stockTransfer.count();
    const year = new Date().getFullYear();
    const transferNumber = `TR-${year}-${String(count + 1).padStart(4, '0')}`;

    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNumber,
        sourceLocationId,
        destinationLocationId,
        requestedDate,
        requestedBy,
        status: 'PENDING',
        notes,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            lotId: item.lotId,
            quantityRequested: item.quantityRequested,
            notes: item.notes,
          })),
        },
      },
    });

    // Audit log
    auditCreate(
      'transfer',
      transfer.id,
      createAuditSummary(
        { ...transfer, itemCount: items.length },
        ['id', 'transferNumber', 'sourceLocationId', 'destinationLocationId', 'status', 'itemCount']
      ),
      requestedBy,
      `Transfer ${transferNumber} created with ${items.length} items`
    ).catch(() => {
      // Ignore audit errors
    });

    return transfer;
  }

  /**
   * Update transfer status
   */
  async updateStatus(
    id: string,
    status: TransferStatus,
    approvedBy?: string,
    shippedDate?: Date,
    completedDate?: Date
  ): Promise<StockTransfer> {
    return prisma.stockTransfer.update({
      where: { id },
      data: {
        status,
        ...(approvedBy && { approvedBy }),
        ...(shippedDate && { shippedDate }),
        ...(completedDate && { completedDate }),
      },
    });
  }

  /**
   * Ship transfer with stock movements (transaction)
   */
  async shipTransferWithStockUpdate(
    transferId: string,
    shippedDate: Date,
    items: ShipTransferItemDTO[],
    userId: string
  ): Promise<StockTransfer> {
    return prisma.$transaction(async (tx) => {
      // Get transfer details
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transferId },
        include: {
          items: true,
        },
      });

      if (!transfer) {
        throw new Error('Transfer not found');
      }

      // Update each item and create TRANSFER_OUT movements
      for (const shipItem of items) {
        const transferItem = transfer.items.find((item) => item.id === shipItem.itemId);
        if (!transferItem) {
          throw new Error(`Transfer item ${shipItem.itemId} not found`);
        }

        // Update transfer item
        await tx.stockTransferItem.update({
          where: { id: shipItem.itemId },
          data: {
            quantityShipped: shipItem.quantityShipped,
          },
        });

        // Decrease stock at source location
        const sourceStock = await tx.stockLevel.findUnique({
          where: {
            productId_locationId: {
              productId: transferItem.productId,
              locationId: transfer.sourceLocationId,
            },
          },
        });

        if (!sourceStock) {
          throw new Error(
            `Stock not found for product ${transferItem.productId} at source location`
          );
        }

        await tx.stockLevel.update({
          where: {
            productId_locationId: {
              productId: transferItem.productId,
              locationId: transfer.sourceLocationId,
            },
          },
          data: {
            quantityAvailable: {
              decrement: shipItem.quantityShipped,
            },
            quantityTotal: {
              decrement: shipItem.quantityShipped,
            },
          },
        });

        // Get updated stock for running balance
        const updatedStock = await tx.stockLevel.findUnique({
          where: {
            productId_locationId: {
              productId: transferItem.productId,
              locationId: transfer.sourceLocationId,
            },
          },
        });

        // Create TRANSFER_OUT movement
        await tx.stockMovement.create({
          data: {
            type: 'TRANSFER_OUT',
            productId: transferItem.productId,
            locationId: transfer.sourceLocationId,
            lotId: transferItem.lotId,
            quantity: -shipItem.quantityShipped,
            toStatus: 'AVAILABLE',
            date: shippedDate,
            userId,
            reason: `Transfer out to ${transfer.destinationLocationId}`,
            referenceType: 'transfer',
            referenceId: transferId,
            runningBalance: updatedStock?.quantityTotal || 0,
          },
        });
      }

      // Update transfer status
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: 'IN_TRANSIT',
          shippedDate,
        },
      });

      // Audit log
      auditUpdate(
        'transfer',
        transferId,
        { status: 'PENDING' },
        { status: 'IN_TRANSIT', shippedDate },
        userId,
        `Transfer ${transfer.transferNumber} shipped`
      ).catch(() => {
        // Ignore audit errors
      });

      return updatedTransfer;
    });
  }

  /**
   * Complete transfer with stock movements (transaction)
   */
  async completeTransferWithStockUpdate(
    transferId: string,
    completedDate: Date,
    items: CompleteTransferItemDTO[],
    userId: string
  ): Promise<StockTransfer> {
    return prisma.$transaction(async (tx) => {
      // Get transfer details
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transferId },
        include: {
          items: true,
        },
      });

      if (!transfer) {
        throw new Error('Transfer not found');
      }

      // Update each item and create TRANSFER_IN movements
      for (const completeItem of items) {
        const transferItem = transfer.items.find((item) => item.id === completeItem.itemId);
        if (!transferItem) {
          throw new Error(`Transfer item ${completeItem.itemId} not found`);
        }

        // Update transfer item
        await tx.stockTransferItem.update({
          where: { id: completeItem.itemId },
          data: {
            quantityReceived: completeItem.quantityReceived,
          },
        });

        // Increase stock at destination location
        await tx.stockLevel.upsert({
          where: {
            productId_locationId: {
              productId: transferItem.productId,
              locationId: transfer.destinationLocationId,
            },
          },
          update: {
            quantityAvailable: {
              increment: completeItem.quantityReceived,
            },
            quantityTotal: {
              increment: completeItem.quantityReceived,
            },
          },
          create: {
            productId: transferItem.productId,
            locationId: transfer.destinationLocationId,
            quantityAvailable: completeItem.quantityReceived,
            quantityReserved: 0,
            quantityDamaged: 0,
            quantityTotal: completeItem.quantityReceived,
          },
        });

        // Get updated stock for running balance
        const updatedStock = await tx.stockLevel.findUnique({
          where: {
            productId_locationId: {
              productId: transferItem.productId,
              locationId: transfer.destinationLocationId,
            },
          },
        });

        // Create TRANSFER_IN movement
        await tx.stockMovement.create({
          data: {
            type: 'TRANSFER_IN',
            productId: transferItem.productId,
            locationId: transfer.destinationLocationId,
            lotId: transferItem.lotId,
            quantity: completeItem.quantityReceived,
            toStatus: 'AVAILABLE',
            date: completedDate,
            userId,
            reason: `Transfer in from ${transfer.sourceLocationId}`,
            referenceType: 'transfer',
            referenceId: transferId,
            runningBalance: updatedStock?.quantityTotal || completeItem.quantityReceived,
          },
        });
      }

      // Update transfer status
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: 'COMPLETED',
          completedDate,
        },
      });

      // Audit log
      auditUpdate(
        'transfer',
        transferId,
        { status: 'IN_TRANSIT' },
        { status: 'COMPLETED', completedDate },
        userId,
        `Transfer ${transfer.transferNumber} completed`
      ).catch(() => {
        // Ignore audit errors
      });

      return updatedTransfer;
    });
  }

  /**
   * Cancel transfer
   */
  async cancel(id: string): Promise<StockTransfer> {
    return prisma.stockTransfer.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  /**
   * Get transfer statistics
   */
  async getStatistics(filters?: TransferFilters): Promise<any> {
    const where: Prisma.StockTransferWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.sourceLocationId) {
      where.sourceLocationId = filters.sourceLocationId;
    }

    if (filters?.destinationLocationId) {
      where.destinationLocationId = filters.destinationLocationId;
    }

    const [totalTransfers, byStatus, itemsStats] = await Promise.all([
      prisma.stockTransfer.count({ where }),
      prisma.stockTransfer.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.stockTransferItem.aggregate({
        _sum: {
          quantityRequested: true,
          quantityShipped: true,
          quantityReceived: true,
        },
      }),
    ]);

    const statusCounts: Record<string, number> = {
      PENDING: 0,
      IN_TRANSIT: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    byStatus.forEach((item) => {
      statusCounts[item.status] = item._count;
    });

    return {
      totalTransfers,
      byStatus: statusCounts,
      totalItemsTransferred: Number(itemsStats._sum.quantityReceived || 0),
    };
  }
}
