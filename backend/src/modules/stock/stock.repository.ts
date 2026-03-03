import { StockLevel, Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { StockFilters, StockLevelWithRelations } from './stock.types.js';

/**
 * Stock Repository
 * Handles all database operations for stock levels
 */
export class StockRepository {
  /**
   * Find stock level by product and location
   */
  async findByProductAndLocation(
    productId: string,
    locationId: string
  ): Promise<StockLevelWithRelations | null> {
    return prisma.stockLevel.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
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
      },
    });
  }

  /**
   * Find all stock levels with filters and pagination
   */
  async findAll(
    filters: StockFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'productName',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ stockLevels: StockLevelWithRelations[]; total: number }> {
    const where: Prisma.StockLevelWhereInput = {};

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

    if (filters.hasStock) {
      where.quantityTotal = { gt: 0 };
    }

    // Build orderBy based on sortBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'productName':
        orderBy = { product: { name: sortOrder } };
        break;
      case 'locationCode':
        orderBy = { location: { code: sortOrder } };
        break;
      case 'quantityTotal':
        orderBy = { quantityTotal: sortOrder };
        break;
      case 'updatedAt':
        orderBy = { updatedAt: sortOrder };
        break;
      default:
        orderBy = { updatedAt: sortOrder };
    }

    const [stockLevels, total] = await Promise.all([
      prisma.stockLevel.findMany({
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
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.stockLevel.count({ where }),
    ]);

    return { stockLevels, total };
  }

  /**
   * Find stock levels by product
   */
  async findByProduct(productId: string): Promise<StockLevelWithRelations[]> {
    return prisma.stockLevel.findMany({
      where: { productId },
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
      },
      orderBy: {
        location: {
          code: 'asc',
        },
      },
    });
  }

  /**
   * Find stock levels by warehouse
   */
  async findByWarehouse(warehouseId: string): Promise<StockLevelWithRelations[]> {
    return prisma.stockLevel.findMany({
      where: {
        location: {
          warehouseId,
        },
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
      },
      orderBy: [
        {
          location: {
            code: 'asc',
          },
        },
        {
          product: {
            name: 'asc',
          },
        },
      ],
    });
  }

  /**
   * Find stock levels by location
   */
  async findByLocation(locationId: string): Promise<StockLevelWithRelations[]> {
    return prisma.stockLevel.findMany({
      where: { locationId },
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
      },
      orderBy: {
        product: {
          name: 'asc',
        },
      },
    });
  }

  /**
   * Get total stock for a product across all locations
   */
  async getTotalStockByProduct(productId: string): Promise<{
    totalAvailable: number;
    totalReserved: number;
    totalDamaged: number;
    totalStock: number;
  }> {
    const result = await prisma.stockLevel.aggregate({
      where: { productId },
      _sum: {
        quantityAvailable: true,
        quantityReserved: true,
        quantityDamaged: true,
        quantityTotal: true,
      },
    });

    return {
      totalAvailable: result._sum.quantityAvailable || 0,
      totalReserved: result._sum.quantityReserved || 0,
      totalDamaged: result._sum.quantityDamaged || 0,
      totalStock: result._sum.quantityTotal || 0,
    };
  }

  /**
   * Get products with low stock (below minimum)
   */
  async findLowStockProducts(): Promise<
    Array<{
      productId: string;
      productSku: string;
      productName: string;
      minStock: number;
      currentStock: number;
    }>
  > {
    // Get products with minStock defined
    const products = await prisma.product.findMany({
      where: {
        minStock: { not: null },
        isActive: true,
      },
      select: {
        id: true,
        sku: true,
        name: true,
        minStock: true,
      },
    });

    // For each product, calculate total stock
    const lowStockProducts = [];

    for (const product of products) {
      const stockTotal = await this.getTotalStockByProduct(product.id);

      if (stockTotal.totalAvailable < (product.minStock || 0)) {
        lowStockProducts.push({
          productId: product.id,
          productSku: product.sku,
          productName: product.name,
          minStock: product.minStock || 0,
          currentStock: stockTotal.totalAvailable,
        });
      }
    }

    return lowStockProducts;
  }

  /**
   * Create or update stock level (upsert)
   */
  async upsertStockLevel(
    productId: string,
    locationId: string,
    data: {
      quantityAvailable?: number;
      quantityReserved?: number;
      quantityDamaged?: number;
    }
  ): Promise<StockLevel> {
    // Calculate total
    const quantityTotal =
      (data.quantityAvailable || 0) + (data.quantityReserved || 0) + (data.quantityDamaged || 0);

    return prisma.stockLevel.upsert({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
      update: {
        ...data,
        quantityTotal,
      },
      create: {
        productId,
        locationId,
        quantityAvailable: data.quantityAvailable || 0,
        quantityReserved: data.quantityReserved || 0,
        quantityDamaged: data.quantityDamaged || 0,
        quantityTotal,
      },
    });
  }

  /**
   * Update stock level quantities
   */
  async updateStockLevel(
    productId: string,
    locationId: string,
    data: {
      quantityAvailable?: number;
      quantityReserved?: number;
      quantityDamaged?: number;
    }
  ): Promise<StockLevel> {
    // Get current stock level
    const current = await this.findByProductAndLocation(productId, locationId);
    if (!current) {
      throw new Error('Stock level not found');
    }

    // Calculate new values
    const quantityAvailable = data.quantityAvailable ?? current.quantityAvailable;
    const quantityReserved = data.quantityReserved ?? current.quantityReserved;
    const quantityDamaged = data.quantityDamaged ?? current.quantityDamaged;
    const quantityTotal = quantityAvailable + quantityReserved + quantityDamaged;

    return prisma.stockLevel.update({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
      data: {
        quantityAvailable,
        quantityReserved,
        quantityDamaged,
        quantityTotal,
      },
    });
  }
}
