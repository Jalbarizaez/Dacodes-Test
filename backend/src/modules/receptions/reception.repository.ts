import { Reception, Prisma, PurchaseOrderStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { ReceptionFilters, ReceptionWithRelations, CreateReceptionItemDTO } from './reception.types.js';
import { auditCreate, createAuditSummary } from '../../shared/utils/audit.js';

/**
 * Reception Repository
 * Handles all database operations for receptions
 */
export class ReceptionRepository {
  /**
   * Find reception by ID
   */
  async findById(id: string, includeRelations: boolean = true): Promise<ReceptionWithRelations | null> {
    return prisma.reception.findUnique({
      where: { id },
      include: includeRelations ? {
        purchaseOrder: {
          select: {
            id: true,
            orderNumber: true,
            supplierId: true,
            supplier: {
              select: {
                name: true,
              },
            },
          },
        },
        items: {
          include: {
            lineItem: {
              include: {
                product: {
                  select: {
                    sku: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      } : undefined,
    });
  }

  /**
   * Find all receptions with filters and pagination
   */
  async findAll(
    filters: ReceptionFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'receivedDate',
    sortOrder: 'asc' | 'desc' = 'desc',
    includeRelations: boolean = true
  ): Promise<{ receptions: ReceptionWithRelations[]; total: number }> {
    const where: Prisma.ReceptionWhereInput = {};

    if (filters.purchaseOrderId) {
      where.purchaseOrderId = filters.purchaseOrderId;
    }

    if (filters.receivedDateFrom || filters.receivedDateTo) {
      where.receivedDate = {};
      if (filters.receivedDateFrom) {
        where.receivedDate.gte = filters.receivedDateFrom;
      }
      if (filters.receivedDateTo) {
        where.receivedDate.lte = filters.receivedDateTo;
      }
    }

    if (filters.receivedBy) {
      where.receivedBy = {
        contains: filters.receivedBy,
        mode: 'insensitive',
      };
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'receivedDate':
        orderBy = { receivedDate: sortOrder };
        break;
      case 'createdAt':
        orderBy = { createdAt: sortOrder };
        break;
      default:
        orderBy = { receivedDate: sortOrder };
    }

    const [receptions, total] = await Promise.all([
      prisma.reception.findMany({
        where,
        include: includeRelations ? {
          purchaseOrder: {
            select: {
              id: true,
              orderNumber: true,
              supplierId: true,
              supplier: {
                select: {
                  name: true,
                },
              },
            },
          },
          items: {
            include: {
              lineItem: {
                include: {
                  product: {
                    select: {
                      sku: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        } : undefined,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.reception.count({ where }),
    ]);

    return { receptions, total };
  }

  /**
   * Create reception with items and update stock (transaction)
   * This is the core method that handles the entire reception process
   */
  async createReceptionWithStockUpdate(
    purchaseOrderId: string,
    receivedDate: Date,
    receivedBy: string,
    items: CreateReceptionItemDTO[],
    userId: string
  ): Promise<Reception> {
    return prisma.$transaction(async (tx) => {
      // 1. Create reception
      const reception = await tx.reception.create({
        data: {
          purchaseOrderId,
          receivedDate,
          receivedBy,
        },
      });

      // 2. Process each reception item
      for (const item of items) {
        // Get line item details
        const lineItem = await tx.purchaseOrderLineItem.findUnique({
          where: { id: item.lineItemId },
          include: {
            product: true,
          },
        });

        if (!lineItem) {
          throw new Error(`Line item ${item.lineItemId} not found`);
        }

        // Create reception item
        await tx.receptionItem.create({
          data: {
            receptionId: reception.id,
            lineItemId: item.lineItemId,
            receivedQuantity: item.receivedQuantity,
            locationId: item.locationId,
            batchNumber: item.batchNumber,
            expirationDate: item.expirationDate,
          },
        });

        // Update line item received quantity
        await tx.purchaseOrderLineItem.update({
          where: { id: item.lineItemId },
          data: {
            receivedQuantity: {
              increment: item.receivedQuantity,
            },
          },
        });

        // Update or create stock level
        await tx.stockLevel.upsert({
          where: {
            productId_locationId: {
              productId: lineItem.productId,
              locationId: item.locationId,
            },
          },
          update: {
            quantityAvailable: {
              increment: item.receivedQuantity,
            },
            quantityTotal: {
              increment: item.receivedQuantity,
            },
          },
          create: {
            productId: lineItem.productId,
            locationId: item.locationId,
            quantityAvailable: item.receivedQuantity,
            quantityReserved: 0,
            quantityDamaged: 0,
            quantityTotal: item.receivedQuantity,
          },
        });

        // Get updated stock level for running balance
        const stockLevel = await tx.stockLevel.findUnique({
          where: {
            productId_locationId: {
              productId: lineItem.productId,
              locationId: item.locationId,
            },
          },
        });

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            type: 'RECEIPT',
            productId: lineItem.productId,
            locationId: item.locationId,
            quantity: item.receivedQuantity,
            toStatus: 'AVAILABLE',
            date: receivedDate,
            userId,
            reason: `Reception from PO ${purchaseOrderId}`,
            referenceType: 'purchase_order',
            referenceId: purchaseOrderId,
            notes: item.batchNumber ? `Batch: ${item.batchNumber}` : undefined,
            runningBalance: stockLevel?.quantityTotal || item.receivedQuantity,
          },
        });
      }

      // 3. Calculate completion and update PO status
      const allLineItems = await tx.purchaseOrderLineItem.findMany({
        where: { purchaseOrderId },
      });

      const totalOrdered = allLineItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalReceived = allLineItems.reduce((sum, item) => sum + item.receivedQuantity, 0);

      let newStatus: PurchaseOrderStatus;
      if (totalReceived === 0) {
        newStatus = 'SUBMITTED';
      } else if (totalReceived >= totalOrdered) {
        newStatus = 'RECEIVED';
      } else {
        newStatus = 'PARTIALLY_RECEIVED';
      }

      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: newStatus },
      });

      // Audit log (fire-and-forget)
      auditCreate(
        'reception',
        reception.id,
        createAuditSummary(
          { id: reception.id, purchaseOrderId, itemCount: items.length, receivedDate },
          ['id', 'purchaseOrderId', 'itemCount', 'receivedDate']
        ),
        userId,
        `Reception created for PO ${purchaseOrderId} with ${items.length} items`
      ).catch(() => {
        // Ignore audit errors
      });

      return reception;
    });
  }

  /**
   * Get receptions by purchase order
   */
  async findByPurchaseOrder(purchaseOrderId: string): Promise<ReceptionWithRelations[]> {
    return prisma.reception.findMany({
      where: { purchaseOrderId },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            orderNumber: true,
            supplierId: true,
            supplier: {
              select: {
                name: true,
              },
            },
          },
        },
        items: {
          include: {
            lineItem: {
              include: {
                product: {
                  select: {
                    sku: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        receivedDate: 'desc',
      },
    });
  }
}
