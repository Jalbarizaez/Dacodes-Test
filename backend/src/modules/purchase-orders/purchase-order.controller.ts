import { Response } from 'express';
import { PurchaseOrderService } from './purchase-order.service.js';
import {
  PurchaseOrderFilters,
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  PurchaseOrderResponse,
  LineItemResponse,
} from './purchase-order.types.js';
import { sendSuccess, calculatePagination } from '../../shared/utils/response.js';
import { AuthRequest, HttpStatus } from '../../shared/types/index.js';
import { PurchaseOrderStatus } from '@prisma/client';

/**
 * Purchase Order Controller
 * Handles HTTP requests for purchase order operations
 */
export class PurchaseOrderController {
  private service: PurchaseOrderService;

  constructor() {
    this.service = new PurchaseOrderService();
  }

  /**
   * Transform line item to response format
   */
  private toLineItemResponse(lineItem: any): LineItemResponse {
    const lineTotal = lineItem.quantity * Number(lineItem.unitPrice);
    const pendingQuantity = lineItem.quantity - lineItem.receivedQuantity;
    const completionPercentage =
      lineItem.quantity > 0 ? (lineItem.receivedQuantity / lineItem.quantity) * 100 : 0;

    return {
      id: lineItem.id,
      productId: lineItem.productId,
      productSku: lineItem.product?.sku,
      productName: lineItem.product?.name,
      unitOfMeasure: lineItem.product?.unitOfMeasure,
      quantity: lineItem.quantity,
      unitPrice: Number(lineItem.unitPrice),
      receivedQuantity: lineItem.receivedQuantity,
      lineTotal,
      pendingQuantity,
      completionPercentage,
    };
  }

  /**
   * Transform purchase order to response format
   */
  private toPurchaseOrderResponse(purchaseOrder: any): PurchaseOrderResponse {
    const lineItems = purchaseOrder.lineItems?.map((item: any) => this.toLineItemResponse(item));

    const totalQuantity = lineItems?.reduce((sum: number, item: LineItemResponse) => sum + item.quantity, 0) || 0;
    const totalReceived = lineItems?.reduce((sum: number, item: LineItemResponse) => sum + item.receivedQuantity, 0) || 0;
    const completionPercentage = totalQuantity > 0 ? (totalReceived / totalQuantity) * 100 : 0;

    return {
      id: purchaseOrder.id,
      orderNumber: purchaseOrder.orderNumber,
      supplierId: purchaseOrder.supplierId,
      supplierName: purchaseOrder.supplier?.name,
      orderDate: purchaseOrder.orderDate,
      expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
      status: purchaseOrder.status,
      totalValue: Number(purchaseOrder.totalValue),
      createdAt: purchaseOrder.createdAt,
      updatedAt: purchaseOrder.updatedAt,
      lineItems,
      receptionCount: purchaseOrder.receptions?.length,
      totalQuantity,
      totalReceived,
      completionPercentage,
    };
  }

  /**
   * POST /purchase-orders
   * Create a new purchase order
   */
  async create(req: AuthRequest, res: Response): Promise<Response> {
    const data: CreatePurchaseOrderDTO = req.body;
    const purchaseOrder = await this.service.createPurchaseOrder(data);

    return sendSuccess(res, this.toPurchaseOrderResponse(purchaseOrder), HttpStatus.CREATED);
  }

  /**
   * GET /purchase-orders
   * Get all purchase orders with filters and pagination
   */
  async getAll(req: AuthRequest, res: Response): Promise<Response> {
    const {
      page = 1,
      pageSize = 20,
      supplierId,
      status,
      orderDateFrom,
      orderDateTo,
      expectedDeliveryDateFrom,
      expectedDeliveryDateTo,
      search,
      sortBy = 'orderDate',
      sortOrder = 'desc',
      includeRelations = 'true',
    } = req.query as any;

    // Normalize status to array and validate
    let normalizedStatus: PurchaseOrderStatus | PurchaseOrderStatus[] | undefined;
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      const validStatuses: PurchaseOrderStatus[] = ['DRAFT', 'SUBMITTED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'];
      
      // Validate each status
      for (const s of statusArray) {
        if (!validStatuses.includes(s as PurchaseOrderStatus)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid status value',
              details: [`Invalid status: ${s}. Must be one of: ${validStatuses.join(', ')}`]
            }
          });
        }
      }
      
      normalizedStatus = statusArray as PurchaseOrderStatus[];
    }

    const filters: PurchaseOrderFilters = {
      supplierId,
      status: normalizedStatus,
      orderDateFrom: orderDateFrom ? new Date(orderDateFrom) : undefined,
      orderDateTo: orderDateTo ? new Date(orderDateTo) : undefined,
      expectedDeliveryDateFrom: expectedDeliveryDateFrom
        ? new Date(expectedDeliveryDateFrom)
        : undefined,
      expectedDeliveryDateTo: expectedDeliveryDateTo
        ? new Date(expectedDeliveryDateTo)
        : undefined,
      search,
    };

    const { purchaseOrders, total } = await this.service.getAllPurchaseOrders(
      filters,
      Number(page),
      Number(pageSize),
      sortBy,
      sortOrder as 'asc' | 'desc',
      includeRelations === 'true'
    );

    const response = purchaseOrders.map((po) => this.toPurchaseOrderResponse(po));

    return sendSuccess(
      res,
      response,
      HttpStatus.OK,
      calculatePagination(total, Number(page), Number(pageSize))
    );
  }

  /**
   * GET /purchase-orders/:id
   * Get purchase order by ID
   */
  async getById(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { includeRelations = 'true' } = req.query as any;

    const purchaseOrder = await this.service.getPurchaseOrderById(id, includeRelations === 'true');

    return sendSuccess(res, this.toPurchaseOrderResponse(purchaseOrder));
  }

  /**
   * PUT /purchase-orders/:id
   * Update purchase order
   */
  async update(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const data: UpdatePurchaseOrderDTO = req.body;

    const purchaseOrder = await this.service.updatePurchaseOrder(id, data);

    return sendSuccess(res, this.toPurchaseOrderResponse(purchaseOrder));
  }

  /**
   * PATCH /purchase-orders/:id/status
   * Update purchase order status
   */
  async updateStatus(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { status } = req.body;

    const purchaseOrder = await this.service.updateStatus(id, status as PurchaseOrderStatus);

    return sendSuccess(res, this.toPurchaseOrderResponse(purchaseOrder));
  }

  /**
   * POST /purchase-orders/:id/cancel
   * Cancel purchase order
   */
  async cancel(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const purchaseOrder = await this.service.cancelPurchaseOrder(id);

    return sendSuccess(res, this.toPurchaseOrderResponse(purchaseOrder));
  }

  /**
   * GET /purchase-orders/statistics
   * Get purchase order statistics
   */
  async getStatistics(req: AuthRequest, res: Response): Promise<Response> {
    const { supplierId, status } = req.query as any;

    const filters: PurchaseOrderFilters = {
      supplierId,
      status: status as PurchaseOrderStatus,
    };

    const statistics = await this.service.getStatistics(filters);

    return sendSuccess(res, statistics);
  }
}
