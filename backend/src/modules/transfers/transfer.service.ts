import { TransferRepository } from './transfer.repository.js';
import {
  TransferFilters,
  TransferWithRelations,
  CreateTransferDTO,
  UpdateTransferStatusDTO,
  ShipTransferDTO,
  CompleteTransferDTO,
  TransferResponse,
  TransferItemResponse,
  TransferStatistics,
  VALID_TRANSFER_STATUS_TRANSITIONS,
} from './transfer.types.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { HttpStatus } from '../../shared/types/index.js';
import { prisma } from '../../config/database.js';
import { TransferStatus } from '@prisma/client';

/**
 * Transfer Service
 * Contains business logic for transfer operations
 */
export class TransferService {
  private repository: TransferRepository;

  constructor() {
    this.repository = new TransferRepository();
  }

  /**
   * Get transfer by ID
   */
  async getTransferById(id: string): Promise<TransferResponse> {
    const transfer = await this.repository.findById(id);

    if (!transfer) {
      throw new AppError(
        'TRANSFER_NOT_FOUND',
        `Transfer with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return this.mapToResponse(transfer);
  }

  /**
   * Get all transfers with filters and pagination
   */
  async getAllTransfers(
    filters: TransferFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'requestedDate',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ transfers: TransferResponse[]; total: number; page: number; pageSize: number }> {
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

    const { transfers, total } = await this.repository.findAll(
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    return {
      transfers: transfers.map((t) => this.mapToResponse(t)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Create a new transfer
   */
  async createTransfer(data: CreateTransferDTO): Promise<TransferResponse> {
    // Validate source and destination locations are different
    if (data.sourceLocationId === data.destinationLocationId) {
      throw new AppError(
        'SAME_LOCATION',
        'Source and destination locations must be different',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate source location exists and is active
    const sourceLocation = await prisma.location.findUnique({
      where: { id: data.sourceLocationId },
      select: { id: true, isActive: true, warehouseId: true },
    });

    if (!sourceLocation) {
      throw new AppError(
        'SOURCE_LOCATION_NOT_FOUND',
        `Source location with ID '${data.sourceLocationId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    if (!sourceLocation.isActive) {
      throw new AppError(
        'SOURCE_LOCATION_INACTIVE',
        'Cannot create transfer from inactive location',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate destination location exists and is active
    const destinationLocation = await prisma.location.findUnique({
      where: { id: data.destinationLocationId },
      select: { id: true, isActive: true, warehouseId: true },
    });

    if (!destinationLocation) {
      throw new AppError(
        'DESTINATION_LOCATION_NOT_FOUND',
        `Destination location with ID '${data.destinationLocationId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    if (!destinationLocation.isActive) {
      throw new AppError(
        'DESTINATION_LOCATION_INACTIVE',
        'Cannot create transfer to inactive location',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate all products exist and are active
    const productIds = data.items.map((item) => item.productId);
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
        'Cannot create transfer with inactive products',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate no duplicate products
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new AppError(
        'DUPLICATE_PRODUCTS',
        'Cannot have duplicate products in transfer',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate sufficient stock at source location
    for (const item of data.items) {
      const stockLevel = await prisma.stockLevel.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: data.sourceLocationId,
          },
        },
      });

      if (!stockLevel || stockLevel.quantityAvailable < item.quantityRequested) {
        throw new AppError(
          'INSUFFICIENT_STOCK',
          `Insufficient stock for product ${item.productId} at source location. Available: ${stockLevel?.quantityAvailable || 0}, Requested: ${item.quantityRequested}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: data.requestedBy },
      select: { id: true, isActive: true },
    });

    if (!user) {
      throw new AppError(
        'USER_NOT_FOUND',
        `User with ID '${data.requestedBy}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    if (!user.isActive) {
      throw new AppError(
        'USER_INACTIVE',
        'Cannot create transfer for inactive user',
        HttpStatus.BAD_REQUEST
      );
    }

    // Create transfer
    const transfer = await this.repository.create(
      data.sourceLocationId,
      data.destinationLocationId,
      data.requestedDate,
      data.requestedBy,
      data.items,
      data.notes
    );

    return await this.getTransferById(transfer.id);
  }

  /**
   * Update transfer status
   */
  async updateStatus(id: string, data: UpdateTransferStatusDTO): Promise<TransferResponse> {
    const transfer = await this.repository.findById(id, false);

    if (!transfer) {
      throw new AppError(
        'TRANSFER_NOT_FOUND',
        `Transfer with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    // Validate status transition
    const validTransitions = VALID_TRANSFER_STATUS_TRANSITIONS[transfer.status];
    if (!validTransitions.includes(data.status)) {
      throw new AppError(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from ${transfer.status} to ${data.status}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate approvedBy if provided
    if (data.approvedBy) {
      const user = await prisma.user.findUnique({
        where: { id: data.approvedBy },
        select: { id: true, isActive: true },
      });

      if (!user) {
        throw new AppError(
          'USER_NOT_FOUND',
          `User with ID '${data.approvedBy}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      if (!user.isActive) {
        throw new AppError(
          'USER_INACTIVE',
          'Cannot approve transfer with inactive user',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    await this.repository.updateStatus(id, data.status, data.approvedBy);

    return await this.getTransferById(id);
  }

  /**
   * Ship transfer
   */
  async shipTransfer(id: string, data: ShipTransferDTO, userId: string): Promise<TransferResponse> {
    const transfer = await this.repository.findById(id, true);

    if (!transfer) {
      throw new AppError(
        'TRANSFER_NOT_FOUND',
        `Transfer with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    // Validate transfer is in PENDING status
    if (transfer.status !== 'PENDING') {
      throw new AppError(
        'INVALID_STATUS',
        `Cannot ship transfer with status ${transfer.status}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate all items exist in transfer
    const transferItemIds = transfer.items?.map((item) => item.id) || [];
    const shipItemIds = data.items.map((item) => item.itemId);

    for (const itemId of shipItemIds) {
      if (!transferItemIds.includes(itemId)) {
        throw new AppError(
          'ITEM_NOT_FOUND',
          `Transfer item ${itemId} not found in transfer`,
          HttpStatus.NOT_FOUND
        );
      }
    }

    // Validate shipped quantities don't exceed requested quantities
    for (const shipItem of data.items) {
      const transferItem = transfer.items?.find((item) => item.id === shipItem.itemId);
      if (!transferItem) continue;

      if (shipItem.quantityShipped > transferItem.quantityRequested) {
        throw new AppError(
          'QUANTITY_EXCEEDED',
          `Shipped quantity ${shipItem.quantityShipped} exceeds requested quantity ${transferItem.quantityRequested} for item ${shipItem.itemId}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Validate sufficient stock at source location
    for (const shipItem of data.items) {
      const transferItem = transfer.items?.find((item) => item.id === shipItem.itemId);
      if (!transferItem) continue;

      const stockLevel = await prisma.stockLevel.findUnique({
        where: {
          productId_locationId: {
            productId: transferItem.productId,
            locationId: transfer.sourceLocationId,
          },
        },
      });

      if (!stockLevel || stockLevel.quantityAvailable < shipItem.quantityShipped) {
        throw new AppError(
          'INSUFFICIENT_STOCK',
          `Insufficient stock for product ${transferItem.productId} at source location. Available: ${stockLevel?.quantityAvailable || 0}, Requested: ${shipItem.quantityShipped}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Ship transfer with stock update
    await this.repository.shipTransferWithStockUpdate(id, data.shippedDate, data.items, userId);

    return await this.getTransferById(id);
  }

  /**
   * Complete transfer
   */
  async completeTransfer(
    id: string,
    data: CompleteTransferDTO,
    userId: string
  ): Promise<TransferResponse> {
    const transfer = await this.repository.findById(id, true);

    if (!transfer) {
      throw new AppError(
        'TRANSFER_NOT_FOUND',
        `Transfer with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    // Validate transfer is in IN_TRANSIT status
    if (transfer.status !== 'IN_TRANSIT') {
      throw new AppError(
        'INVALID_STATUS',
        `Cannot complete transfer with status ${transfer.status}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate all items exist in transfer
    const transferItemIds = transfer.items?.map((item) => item.id) || [];
    const completeItemIds = data.items.map((item) => item.itemId);

    for (const itemId of completeItemIds) {
      if (!transferItemIds.includes(itemId)) {
        throw new AppError(
          'ITEM_NOT_FOUND',
          `Transfer item ${itemId} not found in transfer`,
          HttpStatus.NOT_FOUND
        );
      }
    }

    // Validate received quantities don't exceed shipped quantities
    for (const completeItem of data.items) {
      const transferItem = transfer.items?.find((item) => item.id === completeItem.itemId);
      if (!transferItem) continue;

      if (completeItem.quantityReceived > transferItem.quantityShipped) {
        throw new AppError(
          'QUANTITY_EXCEEDED',
          `Received quantity ${completeItem.quantityReceived} exceeds shipped quantity ${transferItem.quantityShipped} for item ${completeItem.itemId}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Complete transfer with stock update
    await this.repository.completeTransferWithStockUpdate(
      id,
      data.completedDate,
      data.items,
      userId
    );

    return await this.getTransferById(id);
  }

  /**
   * Cancel transfer
   */
  async cancelTransfer(id: string): Promise<TransferResponse> {
    const transfer = await this.repository.findById(id, false);

    if (!transfer) {
      throw new AppError(
        'TRANSFER_NOT_FOUND',
        `Transfer with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    // Cannot cancel if already completed
    if (transfer.status === 'COMPLETED') {
      throw new AppError(
        'INVALID_STATUS',
        'Cannot cancel completed transfer',
        HttpStatus.BAD_REQUEST
      );
    }

    // Cannot cancel if already cancelled
    if (transfer.status === 'CANCELLED') {
      throw new AppError(
        'INVALID_STATUS',
        'Transfer is already cancelled',
        HttpStatus.BAD_REQUEST
      );
    }

    await this.repository.cancel(id);

    return await this.getTransferById(id);
  }

  /**
   * Get transfer statistics
   */
  async getStatistics(filters?: TransferFilters): Promise<TransferStatistics> {
    const stats = await this.repository.getStatistics(filters);

    return {
      totalTransfers: stats.totalTransfers,
      byStatus: stats.byStatus as Record<TransferStatus, number>,
      totalItemsTransferred: stats.totalItemsTransferred,
      averageItemsPerTransfer:
        stats.totalTransfers > 0 ? stats.totalItemsTransferred / stats.totalTransfers : 0,
    };
  }

  /**
   * Map transfer entity to response DTO
   */
  private mapToResponse(transfer: TransferWithRelations): TransferResponse {
    const items: TransferItemResponse[] =
      transfer.items?.map((item) => ({
        id: item.id,
        productId: item.productId,
        productSku: item.product?.sku,
        productName: item.product?.name,
        unitOfMeasure: item.product?.unitOfMeasure,
        lotId: item.lotId,
        quantityRequested: item.quantityRequested,
        quantityShipped: item.quantityShipped,
        quantityReceived: item.quantityReceived,
        notes: item.notes,
      })) || [];

    return {
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      sourceLocationId: transfer.sourceLocationId,
      sourceLocationCode: transfer.sourceLocation?.code,
      sourceWarehouseName: transfer.sourceLocation?.warehouse?.name,
      destinationLocationId: transfer.destinationLocationId,
      destinationLocationCode: transfer.destinationLocation?.code,
      destinationWarehouseName: transfer.destinationLocation?.warehouse?.name,
      status: transfer.status,
      requestedDate: transfer.requestedDate,
      shippedDate: transfer.shippedDate,
      completedDate: transfer.completedDate,
      requestedBy: transfer.requestedBy,
      requestedByEmail: transfer.requestedByUser?.email,
      approvedBy: transfer.approvedBy,
      approvedByEmail: transfer.approvedByUser?.email,
      notes: transfer.notes,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
      items,
      totalItemsRequested: items.reduce((sum, item) => sum + item.quantityRequested, 0),
      totalItemsShipped: items.reduce((sum, item) => sum + item.quantityShipped, 0),
      totalItemsReceived: items.reduce((sum, item) => sum + item.quantityReceived, 0),
    };
  }
}
