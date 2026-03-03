import { PurchaseOrderRepository } from './purchase-order.repository.js';
import {
  PurchaseOrderFilters,
  PurchaseOrderWithRelations,
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  PurchaseOrderStatistics,
  VALID_STATUS_TRANSITIONS,
} from './purchase-order.types.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { HttpStatus } from '../../shared/types/index.js';
import { prisma } from '../../config/database.js';
import { PurchaseOrderStatus } from '@prisma/client';
import { auditCreate, auditUpdate, createAuditSummary } from '../../shared/utils/audit.js';

/**
 * Purchase Order Service
 * Contains business logic for purchase order operations
 */
export class PurchaseOrderService {
  private repository: PurchaseOrderRepository;

  constructor() {
    this.repository = new PurchaseOrderRepository();
  }

  /**
   * Get purchase order by ID
   */
  async getPurchaseOrderById(
    id: string,
    includeRelations: boolean = true
  ): Promise<PurchaseOrderWithRelations> {
    const purchaseOrder = await this.repository.findById(id, includeRelations);

    if (!purchaseOrder) {
      throw new AppError(
        'PURCHASE_ORDER_NOT_FOUND',
        `Purchase order with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return purchaseOrder;
  }

  /**
   * Get all purchase orders with filters and pagination
   */
  async getAllPurchaseOrders(
    filters: PurchaseOrderFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'orderDate',
    sortOrder: 'asc' | 'desc' = 'desc',
    includeRelations: boolean = true
  ): Promise<{ purchaseOrders: PurchaseOrderWithRelations[]; total: number }> {
    if (page < 1) {
      throw new AppError('INVALID_PAGE', 'Page must be greater than 0', HttpStatus.BAD_REQUEST);
    }

    if (pageSize < 1 || pageSize > 100) {
      throw new AppError(
        'INVALID_PAGE_SIZE',
        'Page size must be between 1 and 100',
        HttpStatus.BAD_REQUEST
      );
    }

    return await this.repository.findAll(
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder,
      includeRelations
    );
  }

  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(data: CreatePurchaseOrderDTO): Promise<PurchaseOrderWithRelations> {
    // Validate supplier exists and is active
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
      select: { id: true, isActive: true },
    });

    if (!supplier) {
      throw new AppError(
        'SUPPLIER_NOT_FOUND',
        `Supplier with ID '${data.supplierId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    if (!supplier.isActive) {
      throw new AppError(
        'SUPPLIER_INACTIVE',
        'Cannot create purchase order for inactive supplier',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate all products exist and are active
    const productIds = data.lineItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: { id: true, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new AppError(
        'PRODUCT_NOT_FOUND',
        'One or more products not found',
        HttpStatus.NOT_FOUND
      );
    }

    const inactiveProducts = products.filter((p) => !p.isActive);
    if (inactiveProducts.length > 0) {
      throw new AppError(
        'PRODUCT_INACTIVE',
        'Cannot create purchase order with inactive products',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate no duplicate products in line items
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new AppError(
        'DUPLICATE_PRODUCTS',
        'Cannot have duplicate products in line items',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate dates
    if (data.expectedDeliveryDate < data.orderDate) {
      throw new AppError(
        'INVALID_DELIVERY_DATE',
        'Expected delivery date must be on or after order date',
        HttpStatus.BAD_REQUEST
      );
    }

    // Create purchase order
    const purchaseOrder = await this.repository.create({
      supplierId: data.supplierId,
      orderDate: data.orderDate,
      expectedDeliveryDate: data.expectedDeliveryDate,
      status: 'DRAFT',
      lineItems: data.lineItems,
    });

    // Audit log
    auditCreate(
      'purchase_order',
      purchaseOrder.id,
      createAuditSummary(purchaseOrder, ['id', 'orderNumber', 'supplierId', 'status', 'totalAmount']),
      undefined,
      `Created purchase order ${purchaseOrder.orderNumber}`
    ).catch(() => {});

    return await this.getPurchaseOrderById(purchaseOrder.id);
  }

  /**
   * Update purchase order
   */
  async updatePurchaseOrder(
    id: string,
    data: UpdatePurchaseOrderDTO
  ): Promise<PurchaseOrderWithRelations> {
    // Verify purchase order exists
    const purchaseOrder = await this.getPurchaseOrderById(id, false);

    // Only DRAFT orders can be updated
    if (purchaseOrder.status !== 'DRAFT') {
      throw new AppError(
        'INVALID_STATUS',
        'Only DRAFT purchase orders can be updated',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate supplier if changed
    if (data.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplierId },
        select: { id: true, isActive: true },
      });

      if (!supplier) {
        throw new AppError(
          'SUPPLIER_NOT_FOUND',
          `Supplier with ID '${data.supplierId}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      if (!supplier.isActive) {
        throw new AppError(
          'SUPPLIER_INACTIVE',
          'Cannot update to inactive supplier',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Validate products if line items changed
    if (data.lineItems) {
      const productIds = data.lineItems
        .filter((item) => !item._delete)
        .map((item) => item.productId);

      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: { id: true, isActive: true },
      });

      if (products.length !== productIds.length) {
        throw new AppError(
          'PRODUCT_NOT_FOUND',
          'One or more products not found',
          HttpStatus.NOT_FOUND
        );
      }

      const inactiveProducts = products.filter((p) => !p.isActive);
      if (inactiveProducts.length > 0) {
        throw new AppError(
          'PRODUCT_INACTIVE',
          'Cannot update with inactive products',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate no duplicate products
      const uniqueProductIds = new Set(productIds);
      if (uniqueProductIds.size !== productIds.length) {
        throw new AppError(
          'DUPLICATE_PRODUCTS',
          'Cannot have duplicate products in line items',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate at least one item remains after deletions
      const remainingItems = data.lineItems.filter((item) => !item._delete);
      if (remainingItems.length === 0) {
        throw new AppError(
          'NO_LINE_ITEMS',
          'Purchase order must have at least one line item',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Validate dates if changed
    const orderDate = data.orderDate || purchaseOrder.orderDate;
    const expectedDeliveryDate = data.expectedDeliveryDate || purchaseOrder.expectedDeliveryDate;

    if (expectedDeliveryDate < orderDate) {
      throw new AppError(
        'INVALID_DELIVERY_DATE',
        'Expected delivery date must be on or after order date',
        HttpStatus.BAD_REQUEST
      );
    }

    const updatedPO = await this.repository.update(id, data);

    // Audit log
    auditUpdate(
      'purchase_order',
      id,
      createAuditSummary(purchaseOrder, ['supplierId', 'orderDate', 'expectedDeliveryDate', 'totalAmount']),
      createAuditSummary(updatedPO, ['supplierId', 'orderDate', 'expectedDeliveryDate', 'totalAmount']),
      undefined,
      `Updated purchase order ${purchaseOrder.orderNumber}`
    ).catch(() => {});

    return await this.getPurchaseOrderById(id);
  }

  /**
   * Update purchase order status
   */
  async updateStatus(
    id: string,
    newStatus: PurchaseOrderStatus
  ): Promise<PurchaseOrderWithRelations> {
    const purchaseOrder = await this.getPurchaseOrderById(id, false);

    // Validate status transition
    const validTransitions = VALID_STATUS_TRANSITIONS[purchaseOrder.status];
    if (!validTransitions.includes(newStatus)) {
      throw new AppError(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from ${purchaseOrder.status} to ${newStatus}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Additional validations for specific transitions
    if (newStatus === 'SUBMITTED') {
      // Verify supplier is still active
      const supplier = await prisma.supplier.findUnique({
        where: { id: purchaseOrder.supplierId },
        select: { isActive: true },
      });

      if (!supplier?.isActive) {
        throw new AppError(
          'SUPPLIER_INACTIVE',
          'Cannot submit order for inactive supplier',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    await this.repository.updateStatus(id, newStatus);

    // Audit log
    auditUpdate(
      'purchase_order',
      id,
      { status: purchaseOrder.status },
      { status: newStatus },
      undefined,
      `Updated purchase order ${purchaseOrder.orderNumber} status from ${purchaseOrder.status} to ${newStatus}`
    ).catch(() => {});

    return await this.getPurchaseOrderById(id);
  }

  /**
   * Cancel purchase order
   */
  async cancelPurchaseOrder(id: string): Promise<PurchaseOrderWithRelations> {
    const purchaseOrder = await this.getPurchaseOrderById(id, false);

    // Cannot cancel if already received or cancelled
    if (purchaseOrder.status === 'RECEIVED' || purchaseOrder.status === 'CANCELLED') {
      throw new AppError(
        'INVALID_STATUS',
        `Cannot cancel purchase order with status ${purchaseOrder.status}`,
        HttpStatus.BAD_REQUEST
      );
    }

    await this.repository.cancel(id);

    return await this.getPurchaseOrderById(id);
  }

  /**
   * Get purchase order statistics
   */
  async getStatistics(filters?: PurchaseOrderFilters): Promise<PurchaseOrderStatistics> {
    const stats = await this.repository.getStatistics(filters);

    // Get line items statistics
    const lineItemsStats = await prisma.purchaseOrderLineItem.aggregate({
      _sum: {
        quantity: true,
        receivedQuantity: true,
      },
    });

    const totalItems = Number(lineItemsStats._sum.quantity || 0);
    const totalReceived = Number(lineItemsStats._sum.receivedQuantity || 0);
    const completionRate = totalItems > 0 ? (totalReceived / totalItems) * 100 : 0;

    return {
      totalOrders: stats.totalOrders,
      byStatus: stats.byStatus as Record<PurchaseOrderStatus, number>,
      totalValue: stats.totalValue,
      averageOrderValue: stats.totalOrders > 0 ? stats.totalValue / stats.totalOrders : 0,
      totalItems,
      totalReceived,
      completionRate,
    };
  }

  /**
   * Check if purchase order can be received
   */
  async canReceive(id: string): Promise<boolean> {
    const purchaseOrder = await this.getPurchaseOrderById(id, false);
    return (
      purchaseOrder.status === 'SUBMITTED' || purchaseOrder.status === 'PARTIALLY_RECEIVED'
    );
  }
}
