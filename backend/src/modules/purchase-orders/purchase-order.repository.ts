import { PurchaseOrder, PurchaseOrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import {
  PurchaseOrderFilters,
  PurchaseOrderWithRelations,
  CreateLineItemDTO,
  UpdateLineItemDTO,
} from './purchase-order.types.js';

/**
 * Purchase Order Repository
 * Handles all database operations for purchase orders
 */
export class PurchaseOrderRepository {
  /**
   * Generate unique order number
   */
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    // Get the last order number for this year
    const lastOrder = await prisma.purchaseOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
      select: {
        orderNumber: true,
      },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Find purchase order by ID
   */
  async findById(id: string, includeRelations: boolean = true): Promise<PurchaseOrderWithRelations | null> {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: includeRelations ? {
        supplier: {
          select: {
            id: true,
            name: true,
            contactName: true,
            email: true,
            leadTimeDays: true,
          },
        },
        lineItems: {
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
        receptions: {
          select: {
            id: true,
            receivedDate: true,
            receivedBy: true,
          },
          orderBy: {
            receivedDate: 'desc',
          },
        },
      } : undefined,
    });
  }

  /**
   * Find purchase order by order number
   */
  async findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null> {
    return prisma.purchaseOrder.findUnique({
      where: { orderNumber },
    });
  }

  /**
   * Find all purchase orders with filters and pagination
   */
  async findAll(
    filters: PurchaseOrderFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'orderDate',
    sortOrder: 'asc' | 'desc' = 'desc',
    includeRelations: boolean = true
  ): Promise<{ purchaseOrders: PurchaseOrderWithRelations[]; total: number }> {
    const where: Prisma.PurchaseOrderWhereInput = {};

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        // Multiple status values
        where.status = {
          in: filters.status,
        };
      } else {
        // Single status value
        where.status = filters.status;
      }
    }

    if (filters.orderDateFrom || filters.orderDateTo) {
      where.orderDate = {};
      if (filters.orderDateFrom) {
        where.orderDate.gte = filters.orderDateFrom;
      }
      if (filters.orderDateTo) {
        where.orderDate.lte = filters.orderDateTo;
      }
    }

    if (filters.expectedDeliveryDateFrom || filters.expectedDeliveryDateTo) {
      where.expectedDeliveryDate = {};
      if (filters.expectedDeliveryDateFrom) {
        where.expectedDeliveryDate.gte = filters.expectedDeliveryDateFrom;
      }
      if (filters.expectedDeliveryDateTo) {
        where.expectedDeliveryDate.lte = filters.expectedDeliveryDateTo;
      }
    }

    if (filters.search) {
      where.orderNumber = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'orderNumber':
        orderBy = { orderNumber: sortOrder };
        break;
      case 'orderDate':
        orderBy = { orderDate: sortOrder };
        break;
      case 'expectedDeliveryDate':
        orderBy = { expectedDeliveryDate: sortOrder };
        break;
      case 'totalValue':
        orderBy = { totalValue: sortOrder };
        break;
      case 'createdAt':
        orderBy = { createdAt: sortOrder };
        break;
      default:
        orderBy = { orderDate: sortOrder };
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: includeRelations ? {
          supplier: {
            select: {
              id: true,
              name: true,
              contactName: true,
              email: true,
              leadTimeDays: true,
            },
          },
          lineItems: {
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
          receptions: {
            select: {
              id: true,
              receivedDate: true,
              receivedBy: true,
            },
          },
        } : undefined,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { purchaseOrders, total };
  }

  /**
   * Create purchase order with line items (transaction)
   */
  async create(data: {
    supplierId: string;
    orderDate: Date;
    expectedDeliveryDate: Date;
    status?: PurchaseOrderStatus;
    lineItems: CreateLineItemDTO[];
  }): Promise<PurchaseOrder> {
    const orderNumber = await this.generateOrderNumber();

    return prisma.$transaction(async (tx) => {
      // Calculate total value
      const totalValue = data.lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      // Create purchase order
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: data.supplierId,
          orderDate: data.orderDate,
          expectedDeliveryDate: data.expectedDeliveryDate,
          status: data.status || 'DRAFT',
          totalValue,
        },
      });

      // Create line items
      await tx.purchaseOrderLineItem.createMany({
        data: data.lineItems.map((item) => ({
          purchaseOrderId: purchaseOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      return purchaseOrder;
    });
  }

  /**
   * Update purchase order (transaction)
   */
  async update(
    id: string,
    data: {
      supplierId?: string;
      orderDate?: Date;
      expectedDeliveryDate?: Date;
      lineItems?: UpdateLineItemDTO[];
    }
  ): Promise<PurchaseOrder> {
    return prisma.$transaction(async (tx) => {
      // Update line items if provided
      if (data.lineItems) {
        // Get existing line items
        const existingItems = await tx.purchaseOrderLineItem.findMany({
          where: { purchaseOrderId: id },
          select: { id: true },
        });

        const existingIds = new Set(existingItems.map((item) => item.id));
        const updatedIds = new Set(
          data.lineItems.filter((item) => item.id && !item._delete).map((item) => item.id!)
        );

        // Delete items marked for deletion or not in updated list
        const idsToDelete = data.lineItems
          .filter((item) => item.id && item._delete)
          .map((item) => item.id!);

        const idsNotInUpdate = Array.from(existingIds).filter((id) => !updatedIds.has(id));

        if (idsToDelete.length > 0 || idsNotInUpdate.length > 0) {
          await tx.purchaseOrderLineItem.deleteMany({
            where: {
              id: {
                in: [...idsToDelete, ...idsNotInUpdate],
              },
            },
          });
        }

        // Update or create line items
        for (const item of data.lineItems) {
          if (item._delete) continue;

          if (item.id && existingIds.has(item.id)) {
            // Update existing
            await tx.purchaseOrderLineItem.update({
              where: { id: item.id },
              data: {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              },
            });
          } else {
            // Create new
            await tx.purchaseOrderLineItem.create({
              data: {
                purchaseOrderId: id,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              },
            });
          }
        }

        // Recalculate total value
        const lineItems = await tx.purchaseOrderLineItem.findMany({
          where: { purchaseOrderId: id },
        });

        const totalValue = lineItems.reduce(
          (sum, item) => sum + item.quantity * Number(item.unitPrice),
          0
        );

        // Update purchase order with new total
        return await tx.purchaseOrder.update({
          where: { id },
          data: {
            supplierId: data.supplierId,
            orderDate: data.orderDate,
            expectedDeliveryDate: data.expectedDeliveryDate,
            totalValue,
          },
        });
      }

      // Update purchase order only
      return await tx.purchaseOrder.update({
        where: { id },
        data: {
          supplierId: data.supplierId,
          orderDate: data.orderDate,
          expectedDeliveryDate: data.expectedDeliveryDate,
        },
      });
    });
  }

  /**
   * Update status
   */
  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Cancel purchase order
   */
  async cancel(id: string): Promise<PurchaseOrder> {
    return this.updateStatus(id, 'CANCELLED');
  }

  /**
   * Get purchase order statistics
   */
  async getStatistics(filters?: PurchaseOrderFilters): Promise<{
    totalOrders: number;
    byStatus: Record<string, number>;
    totalValue: number;
  }> {
    const where: Prisma.PurchaseOrderWhereInput = {};

    if (filters?.supplierId) where.supplierId = filters.supplierId;
    if (filters?.status) {
      where.status = Array.isArray(filters.status) 
        ? { in: filters.status }
        : filters.status;
    }

    const [totalOrders, orders, aggregation] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        select: { status: true },
      }),
      prisma.purchaseOrder.aggregate({
        where,
        _sum: {
          totalValue: true,
        },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const order of orders) {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
    }

    return {
      totalOrders,
      byStatus,
      totalValue: Number(aggregation._sum.totalValue || 0),
    };
  }
}
