import { ReceptionRepository } from './reception.repository.js';
import {
  ReceptionFilters,
  ReceptionWithRelations,
  CreateReceptionDTO,
  ReceptionResponse,
  ReceptionItemResponse,
  ReceptionSummary,
} from './reception.types.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { HttpStatus } from '../../shared/types/index.js';
import { prisma } from '../../config/database.js';
import {
  emitReceptionCreated,
  emitPurchaseOrderReceived,
  emitPurchaseOrderPartiallyReceived,
} from '../../shared/events/emit-helper.js';

/**
 * Reception Service
 * Contains business logic for reception operations
 */
export class ReceptionService {
  private repository: ReceptionRepository;

  constructor() {
    this.repository = new ReceptionRepository();
  }

  /**
   * Get reception by ID
   */
  async getReceptionById(id: string): Promise<ReceptionResponse> {
    const reception = await this.repository.findById(id);

    if (!reception) {
      throw new AppError(
        'RECEPTION_NOT_FOUND',
        `Reception with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return this.mapToResponse(reception);
  }

  /**
   * Get all receptions with filters and pagination
   */
  async getAllReceptions(
    filters: ReceptionFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'receivedDate',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ receptions: ReceptionResponse[]; total: number; page: number; pageSize: number }> {
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

    const { receptions, total } = await this.repository.findAll(
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    return {
      receptions: receptions.map((r) => this.mapToResponse(r)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Create a new reception
   */
  async createReception(data: CreateReceptionDTO, userId: string): Promise<ReceptionSummary> {
    // Validate purchase order exists and can be received
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: data.purchaseOrderId },
      include: {
        lineItems: true,
      },
    });

    if (!purchaseOrder) {
      throw new AppError(
        'PURCHASE_ORDER_NOT_FOUND',
        `Purchase order with ID '${data.purchaseOrderId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    // Validate PO status
    if (
      purchaseOrder.status !== 'SUBMITTED' &&
      purchaseOrder.status !== 'PARTIALLY_RECEIVED'
    ) {
      throw new AppError(
        'INVALID_PO_STATUS',
        `Cannot receive purchase order with status ${purchaseOrder.status}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate all line items exist and belong to this PO
    const lineItemIds = data.items.map((item) => item.lineItemId);
    const lineItems = await prisma.purchaseOrderLineItem.findMany({
      where: {
        id: { in: lineItemIds },
        purchaseOrderId: data.purchaseOrderId,
      },
    });

    if (lineItems.length !== lineItemIds.length) {
      throw new AppError(
        'INVALID_LINE_ITEMS',
        'One or more line items not found or do not belong to this purchase order',
        HttpStatus.NOT_FOUND
      );
    }

    // Validate no duplicate line items
    const uniqueLineItemIds = new Set(lineItemIds);
    if (uniqueLineItemIds.size !== lineItemIds.length) {
      throw new AppError(
        'DUPLICATE_LINE_ITEMS',
        'Cannot have duplicate line items in reception',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate received quantities don't exceed ordered quantities
    for (const item of data.items) {
      const lineItem = lineItems.find((li) => li.id === item.lineItemId);
      if (!lineItem) continue;

      const remainingQuantity = lineItem.quantity - lineItem.receivedQuantity;
      if (item.receivedQuantity > remainingQuantity) {
        throw new AppError(
          'OVER_RECEPTION',
          `Cannot receive ${item.receivedQuantity} units. Only ${remainingQuantity} units remaining for line item ${item.lineItemId}`,
          HttpStatus.BAD_REQUEST
        );
      }

      if (item.receivedQuantity <= 0) {
        throw new AppError(
          'INVALID_QUANTITY',
          'Received quantity must be positive',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Validate all locations exist and are active
    const locationIds = data.items.map((item) => item.locationId);
    const locations = await prisma.location.findMany({
      where: {
        id: { in: locationIds },
      },
      select: { id: true, isActive: true },
    });

    if (locations.length !== locationIds.length) {
      throw new AppError(
        'LOCATION_NOT_FOUND',
        'One or more locations not found',
        HttpStatus.NOT_FOUND
      );
    }

    const inactiveLocations = locations.filter((l) => !l.isActive);
    if (inactiveLocations.length > 0) {
      throw new AppError(
        'LOCATION_INACTIVE',
        'Cannot receive to inactive locations',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate expiration dates are in the future
    for (const item of data.items) {
      if (item.expirationDate && item.expirationDate <= new Date()) {
        throw new AppError(
          'INVALID_EXPIRATION_DATE',
          'Expiration date must be in the future',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Create reception with transaction
    try {
      const reception = await this.repository.createReceptionWithStockUpdate(
        data.purchaseOrderId,
        data.receivedDate,
        data.receivedBy,
        data.items,
        userId
      );

      // Get updated PO to calculate summary
      const updatedPO = await prisma.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId },
        include: {
          lineItems: true,
        },
      });

      if (!updatedPO) {
        throw new Error('Purchase order not found after reception');
      }

      const totalOrdered = updatedPO.lineItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalReceived = updatedPO.lineItems.reduce(
        (sum, item) => sum + item.receivedQuantity,
        0
      );
      const completionPercentage = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;

      const summary: ReceptionSummary = {
        receptionId: reception.id,
        purchaseOrderId: data.purchaseOrderId,
        orderNumber: purchaseOrder.orderNumber,
        totalItemsReceived: data.items.reduce((sum, item) => sum + item.receivedQuantity, 0),
        stockMovementsCreated: data.items.length,
        purchaseOrderStatus: updatedPO.status,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
      };

      // Emit real-time events
      this.emitReceptionEvents(reception, updatedPO, purchaseOrder);

      return summary;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'RECEPTION_CREATION_FAILED',
        `Failed to create reception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Emit real-time events for reception
   */
  private async emitReceptionEvents(
    reception: any,
    updatedPO: any,
    originalPO: any
  ): Promise<void> {
    try {
      // Emit reception created event
      emitReceptionCreated({
        id: reception.id,
        purchaseOrderId: reception.purchaseOrderId,
        purchaseOrderNumber: originalPO.orderNumber,
        receivedDate: reception.receivedDate.toISOString(),
        receivedBy: reception.receivedBy,
        itemsCount: reception.items?.length || 0,
      });

      // Get supplier info
      const supplier = await prisma.supplier.findUnique({
        where: { id: updatedPO.supplierId },
        select: { name: true },
      });

      // Emit purchase order status event
      const poPayload = {
        id: updatedPO.id,
        orderNumber: updatedPO.orderNumber,
        supplierId: updatedPO.supplierId,
        supplierName: supplier?.name || '',
        status: updatedPO.status,
        totalAmount: updatedPO.totalAmount.toString(),
        orderDate: updatedPO.orderDate.toISOString(),
      };

      if (updatedPO.status === 'RECEIVED') {
        emitPurchaseOrderReceived(poPayload);
      } else if (updatedPO.status === 'PARTIALLY_RECEIVED') {
        emitPurchaseOrderPartiallyReceived(poPayload);
      }
    } catch (error) {
      // Log error but don't throw - events are fire-and-forget
      console.error('Error emitting reception events:', error);
    }
  }

  /**
   * Get receptions by purchase order
   */
  async getReceptionsByPurchaseOrder(purchaseOrderId: string): Promise<ReceptionResponse[]> {
    // Validate purchase order exists
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: { id: true },
    });

    if (!purchaseOrder) {
      throw new AppError(
        'PURCHASE_ORDER_NOT_FOUND',
        `Purchase order with ID '${purchaseOrderId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    const receptions = await this.repository.findByPurchaseOrder(purchaseOrderId);
    return receptions.map((r) => this.mapToResponse(r));
  }

  /**
   * Map reception entity to response DTO
   */
  private mapToResponse(reception: ReceptionWithRelations): ReceptionResponse {
    const items: ReceptionItemResponse[] =
      reception.items?.map((item) => ({
        id: item.id,
        lineItemId: item.lineItemId,
        productId: item.lineItem?.productId,
        productSku: item.lineItem?.product?.sku,
        productName: item.lineItem?.product?.name,
        receivedQuantity: item.receivedQuantity,
        locationId: item.locationId,
        batchNumber: item.batchNumber,
        expirationDate: item.expirationDate,
        orderedQuantity: item.lineItem?.quantity,
        previouslyReceived: item.lineItem
          ? item.lineItem.receivedQuantity - item.receivedQuantity
          : 0,
        totalReceived: item.lineItem?.receivedQuantity,
        pendingQuantity: item.lineItem
          ? item.lineItem.quantity - item.lineItem.receivedQuantity
          : 0,
      })) || [];

    return {
      id: reception.id,
      purchaseOrderId: reception.purchaseOrderId,
      orderNumber: reception.purchaseOrder?.orderNumber,
      supplierName: reception.purchaseOrder?.supplier?.name,
      receivedDate: reception.receivedDate,
      receivedBy: reception.receivedBy,
      createdAt: reception.createdAt,
      items,
      totalItemsReceived: items.reduce((sum, item) => sum + item.receivedQuantity, 0),
    };
  }
}
