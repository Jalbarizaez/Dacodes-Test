import { MovementRepository } from './movement.repository.js';
import {
  MovementFilters,
  MovementWithRelations,
  CreateMovementDTO,
  StockAdjustmentRequest,
  StockStatusChangeRequest,
  MovementSummary,
} from './movement.types.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { HttpStatus } from '../../shared/types/index.js';
import { prisma } from '../../config/database.js';
import { MovementType } from '@prisma/client';
import { emitStockUpdated, emitMovementCreated, emitStockLow } from '../../shared/events/emit-helper.js';

/**
 * Movement Service
 * Contains business logic for stock movement operations
 */
export class MovementService {
  private repository: MovementRepository;
  private allowNegativeStock: boolean;

  constructor(allowNegativeStock: boolean = false) {
    this.repository = new MovementRepository();
    this.allowNegativeStock = allowNegativeStock;
  }

  /**
   * Get movement by ID
   */
  async getMovementById(id: string): Promise<MovementWithRelations> {
    const movement = await this.repository.findById(id);

    if (!movement) {
      throw new AppError(
        'MOVEMENT_NOT_FOUND',
        `Movement with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return movement;
  }

  /**
   * Get all movements with filters and pagination
   */
  async getAllMovements(
    filters: MovementFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ movements: MovementWithRelations[]; total: number }> {
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

    return await this.repository.findAll(filters, page, pageSize, sortBy, sortOrder);
  }

  /**
   * Create a stock movement
   */
  async createMovement(data: CreateMovementDTO): Promise<MovementWithRelations> {
    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true, isActive: true },
    });

    if (!product) {
      throw new AppError(
        'PRODUCT_NOT_FOUND',
        `Product with ID '${data.productId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    if (!product.isActive) {
      throw new AppError(
        'PRODUCT_INACTIVE',
        'Cannot create movement for inactive product',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate location exists
    const location = await prisma.location.findUnique({
      where: { id: data.locationId },
      select: { id: true, isActive: true },
    });

    if (!location) {
      throw new AppError(
        'LOCATION_NOT_FOUND',
        `Location with ID '${data.locationId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    if (!location.isActive) {
      throw new AppError(
        'LOCATION_INACTIVE',
        'Cannot create movement for inactive location',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate lot if provided
    if (data.lotId) {
      const lot = await prisma.lot.findUnique({
        where: { id: data.lotId },
        select: { id: true, productId: true },
      });

      if (!lot) {
        throw new AppError(
          'LOT_NOT_FOUND',
          `Lot with ID '${data.lotId}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      if (lot.productId !== data.productId) {
        throw new AppError(
          'LOT_PRODUCT_MISMATCH',
          'Lot does not belong to the specified product',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Validate user exists (skip validation for 'system' user)
    if (data.userId !== 'system') {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true, isActive: true },
      });

      if (!user) {
        throw new AppError(
          'USER_NOT_FOUND',
          `User with ID '${data.userId}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      if (!user.isActive) {
        throw new AppError(
          'USER_INACTIVE',
          'Cannot create movement for inactive user',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Create movement with stock update
    try {
      const movement = await this.repository.createMovementWithStockUpdate(
        data,
        this.allowNegativeStock
      );

      // Fetch with relations
      const movementWithRelations = await this.getMovementById(movement.id);

      // Emit real-time events
      this.emitMovementEvents(movementWithRelations);

      return movementWithRelations;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Insufficient stock')) {
          throw new AppError('INSUFFICIENT_STOCK', error.message, HttpStatus.BAD_REQUEST);
        }
      }
      throw error;
    }
  }

  /**
   * Emit real-time events for movement
   */
  private async emitMovementEvents(movement: MovementWithRelations): Promise<void> {
    try {
      // Emit movement created event
      emitMovementCreated({
        id: movement.id,
        type: movement.type,
        productId: movement.productId,
        productSku: movement.product?.sku || '',
        productName: movement.product?.name || '',
        locationId: movement.locationId,
        locationCode: movement.location?.code || '',
        quantity: movement.quantity,
        date: movement.date.toISOString(),
      });

      // Get updated stock level
      const stockLevel = await prisma.stockLevel.findUnique({
        where: {
          productId_locationId: {
            productId: movement.productId,
            locationId: movement.locationId,
          },
        },
        include: {
          product: true,
          location: {
            include: {
              warehouse: true,
            },
          },
        },
      });

      if (stockLevel) {
        // Emit stock updated event
        emitStockUpdated({
          productId: stockLevel.productId,
          productSku: stockLevel.product.sku,
          productName: stockLevel.product.name,
          locationId: stockLevel.locationId,
          locationCode: stockLevel.location.code,
          warehouseId: stockLevel.location.warehouseId,
          warehouseName: stockLevel.location.warehouse.name,
          quantityAvailable: stockLevel.quantityAvailable,
          quantityReserved: stockLevel.quantityReserved,
          quantityDamaged: stockLevel.quantityDamaged,
          quantityTotal: stockLevel.quantityTotal,
          change: movement.quantity,
        });

        // Check for low stock alert
        if (
          stockLevel.product.minStock &&
          stockLevel.quantityAvailable < stockLevel.product.minStock
        ) {
          emitStockLow({
            productId: stockLevel.productId,
            productSku: stockLevel.product.sku,
            productName: stockLevel.product.name,
            minStock: stockLevel.product.minStock,
            currentStock: stockLevel.quantityAvailable,
            deficit: stockLevel.product.minStock - stockLevel.quantityAvailable,
          });
        }
      }
    } catch (error) {
      // Log error but don't throw - events are fire-and-forget
      console.error('Error emitting movement events:', error);
    }
  }

  /**
   * Create stock adjustment (simplified API)
   */
  async createStockAdjustment(
    data: StockAdjustmentRequest,
    userId: string
  ): Promise<MovementWithRelations> {
    const movementData: CreateMovementDTO = {
      type: 'ADJUSTMENT' as MovementType,
      productId: data.productId,
      locationId: data.locationId,
      quantity: data.quantity,
      toStatus: 'AVAILABLE',
      userId,
      reason: data.reason,
      notes: data.notes,
    };

    return await this.createMovement(movementData);
  }

  /**
   * Change stock status (e.g., available to damaged)
   */
  async changeStockStatus(
    data: StockStatusChangeRequest,
    userId: string
  ): Promise<MovementWithRelations> {
    const movementData: CreateMovementDTO = {
      type: 'ADJUSTMENT' as MovementType,
      productId: data.productId,
      locationId: data.locationId,
      quantity: data.quantity,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      userId,
      reason: data.reason,
      notes: data.notes,
    };

    return await this.createMovement(movementData);
  }

  /**
   * Get movement summary
   */
  async getMovementSummary(filters: MovementFilters): Promise<MovementSummary> {
    return await this.repository.getMovementSummary(filters);
  }

  /**
   * Get movement history for a product at a location
   */
  async getMovementHistory(
    productId: string,
    locationId: string,
    limit: number = 50
  ): Promise<MovementWithRelations[]> {
    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new AppError(
        'PRODUCT_NOT_FOUND',
        `Product with ID '${productId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    // Validate location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true },
    });

    if (!location) {
      throw new AppError(
        'LOCATION_NOT_FOUND',
        `Location with ID '${locationId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return await this.repository.getMovementHistory(productId, locationId, limit);
  }

  /**
   * Reserve stock (move from available to reserved)
   */
  async reserveStock(
    productId: string,
    locationId: string,
    quantity: number,
    userId: string,
    referenceType?: string,
    referenceId?: string,
    reason?: string
  ): Promise<MovementWithRelations> {
    const movementData: CreateMovementDTO = {
      type: 'RESERVATION' as MovementType,
      productId,
      locationId,
      quantity,
      fromStatus: 'AVAILABLE',
      toStatus: 'RESERVED',
      userId,
      reason: reason || 'Stock reservation',
      referenceType,
      referenceId,
    };

    return await this.createMovement(movementData);
  }

  /**
   * Release reserved stock (move from reserved to available)
   */
  async releaseStock(
    productId: string,
    locationId: string,
    quantity: number,
    userId: string,
    referenceType?: string,
    referenceId?: string,
    reason?: string
  ): Promise<MovementWithRelations> {
    const movementData: CreateMovementDTO = {
      type: 'RELEASE' as MovementType,
      productId,
      locationId,
      quantity,
      fromStatus: 'RESERVED',
      toStatus: 'AVAILABLE',
      userId,
      reason: reason || 'Stock release',
      referenceType,
      referenceId,
    };

    return await this.createMovement(movementData);
  }
}
