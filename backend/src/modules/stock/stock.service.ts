import { StockRepository } from './stock.repository.js';
import {
  StockFilters,
  StockLevelWithRelations,
  ConsolidatedStockByProduct,
  ConsolidatedStockByWarehouse,
  ConsolidatedStockByLocation,
  LowStockAlert,
  StockResponse,
} from './stock.types.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { HttpStatus } from '../../shared/types/index.js';
import { prisma } from '../../config/database.js';

/**
 * Stock Service
 * Contains business logic for stock operations
 */
export class StockService {
  private repository: StockRepository;

  constructor() {
    this.repository = new StockRepository();
  }

  /**
   * Get all stock levels with filters and pagination
   */
  async getAllStockLevels(
    filters: StockFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'productName',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ stockLevels: StockLevelWithRelations[]; total: number }> {
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
   * Get consolidated stock by product
   */
  async getConsolidatedStockByProduct(productId: string): Promise<ConsolidatedStockByProduct> {
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sku: true, name: true },
    });

    if (!product) {
      throw new AppError(
        'PRODUCT_NOT_FOUND',
        `Product with ID '${productId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    // Get stock levels for this product
    const stockLevels = await this.repository.findByProduct(productId);

    // Calculate totals
    const totals = await this.repository.getTotalStockByProduct(productId);

    // Transform to response format
    const locations: StockResponse[] = stockLevels.map((sl) => ({
      id: sl.id,
      productId: sl.productId,
      productSku: sl.product?.sku,
      productName: sl.product?.name,
      locationId: sl.locationId,
      locationCode: sl.location?.code,
      locationName: sl.location?.name,
      warehouseId: sl.location?.warehouse.id,
      warehouseName: sl.location?.warehouse.name,
      quantityAvailable: sl.quantityAvailable,
      quantityReserved: sl.quantityReserved,
      quantityDamaged: sl.quantityDamaged,
      quantityTotal: sl.quantityTotal,
      lastCountDate: sl.lastCountDate,
      updatedAt: sl.updatedAt,
    }));

    return {
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      totalAvailable: totals.totalAvailable,
      totalReserved: totals.totalReserved,
      totalDamaged: totals.totalDamaged,
      totalStock: totals.totalStock,
      locationCount: stockLevels.length,
      locations,
    };
  }

  /**
   * Get consolidated stock by warehouse
   */
  async getConsolidatedStockByWarehouse(
    warehouseId: string
  ): Promise<ConsolidatedStockByWarehouse> {
    // Verify warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { id: true, name: true },
    });

    if (!warehouse) {
      throw new AppError(
        'WAREHOUSE_NOT_FOUND',
        `Warehouse with ID '${warehouseId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    // Get stock levels for this warehouse
    const stockLevels = await this.repository.findByWarehouse(warehouseId);

    // Group by product and calculate totals
    const productMap = new Map<
      string,
      {
        productId: string;
        productSku: string;
        productName: string;
        available: number;
        reserved: number;
        damaged: number;
        total: number;
      }
    >();

    let totalAvailable = 0;
    let totalReserved = 0;
    let totalDamaged = 0;
    let totalStock = 0;
    const locationSet = new Set<string>();

    for (const sl of stockLevels) {
      locationSet.add(sl.locationId);

      const existing = productMap.get(sl.productId);
      if (existing) {
        existing.available += sl.quantityAvailable;
        existing.reserved += sl.quantityReserved;
        existing.damaged += sl.quantityDamaged;
        existing.total += sl.quantityTotal;
      } else {
        productMap.set(sl.productId, {
          productId: sl.productId,
          productSku: sl.product?.sku || '',
          productName: sl.product?.name || '',
          available: sl.quantityAvailable,
          reserved: sl.quantityReserved,
          damaged: sl.quantityDamaged,
          total: sl.quantityTotal,
        });
      }

      totalAvailable += sl.quantityAvailable;
      totalReserved += sl.quantityReserved;
      totalDamaged += sl.quantityDamaged;
      totalStock += sl.quantityTotal;
    }

    return {
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      totalAvailable,
      totalReserved,
      totalDamaged,
      totalStock,
      productCount: productMap.size,
      locationCount: locationSet.size,
      products: Array.from(productMap.values()),
    };
  }

  /**
   * Get consolidated stock by location
   */
  async getConsolidatedStockByLocation(
    locationId: string
  ): Promise<ConsolidatedStockByLocation> {
    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
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
    });

    if (!location) {
      throw new AppError(
        'LOCATION_NOT_FOUND',
        `Location with ID '${locationId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    // Get stock levels for this location
    const stockLevels = await this.repository.findByLocation(locationId);

    // Calculate totals
    let totalAvailable = 0;
    let totalReserved = 0;
    let totalDamaged = 0;
    let totalStock = 0;

    const products = stockLevels.map((sl) => {
      totalAvailable += sl.quantityAvailable;
      totalReserved += sl.quantityReserved;
      totalDamaged += sl.quantityDamaged;
      totalStock += sl.quantityTotal;

      return {
        productId: sl.productId,
        productSku: sl.product?.sku || '',
        productName: sl.product?.name || '',
        available: sl.quantityAvailable,
        reserved: sl.quantityReserved,
        damaged: sl.quantityDamaged,
        total: sl.quantityTotal,
      };
    });

    return {
      locationId: location.id,
      locationCode: location.code,
      locationName: location.name,
      warehouseId: location.warehouse.id,
      warehouseName: location.warehouse.name,
      totalAvailable,
      totalReserved,
      totalDamaged,
      totalStock,
      productCount: stockLevels.length,
      products,
    };
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    const lowStockProducts = await this.repository.findLowStockProducts();

    return lowStockProducts.map((p) => ({
      productId: p.productId,
      productSku: p.productSku,
      productName: p.productName,
      minStock: p.minStock,
      currentStock: p.currentStock,
      deficit: p.minStock - p.currentStock,
    }));
  }

  /**
   * Check if product has sufficient available stock at location
   */
  async hasAvailableStock(
    productId: string,
    locationId: string,
    requiredQuantity: number
  ): Promise<boolean> {
    const stockLevel = await this.repository.findByProductAndLocation(productId, locationId);

    if (!stockLevel) {
      return false;
    }

    return stockLevel.quantityAvailable >= requiredQuantity;
  }

  /**
   * Get available stock quantity for product at location
   */
  async getAvailableStock(productId: string, locationId: string): Promise<number> {
    const stockLevel = await this.repository.findByProductAndLocation(productId, locationId);

    return stockLevel?.quantityAvailable || 0;
  }

  /**
   * Get total available stock for product across all locations
   */
  async getTotalAvailableStock(productId: string): Promise<number> {
    const totals = await this.repository.getTotalStockByProduct(productId);
    return totals.totalAvailable;
  }
}
