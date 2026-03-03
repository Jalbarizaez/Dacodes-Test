import { Product, Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { CreateProductDTO, UpdateProductDTO, ProductFilters, ProductWithRelations } from './product.types.js';

/**
 * Product Repository
 * Handles all database operations for products
 */
export class ProductRepository {
  /**
   * Create a new product
   */
  async create(data: CreateProductDTO): Promise<Product> {
    return prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        unitOfMeasure: data.unitOfMeasure,
        minStock: data.minStock,
        maxStock: data.maxStock,
        weight: data.weight,
        dimensions: data.dimensions,
        barcode: data.barcode,
      },
    });
  }

  /**
   * Find product by ID
   */
  async findById(id: string): Promise<ProductWithRelations | null> {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            stockLevels: true,
          },
        },
      },
    });
  }

  /**
   * Find product by SKU
   */
  async findBySku(sku: string): Promise<ProductWithRelations | null> {
    return prisma.product.findUnique({
      where: { sku },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            stockLevels: true,
          },
        },
      },
    });
  }

  /**
   * Find product by barcode
   */
  async findByBarcode(barcode: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { barcode },
    });
  }

  /**
   * Find all products with filters and pagination
   */
  async findAll(
    filters: ProductFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ products: ProductWithRelations[]; total: number }> {
    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { barcode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Execute query with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              stockLevels: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  /**
   * Update product
   */
  async update(id: string, data: UpdateProductDTO): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete product (set isActive to false)
   */
  async softDelete(id: string): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Check if product has stock
   */
  async hasStock(id: string): Promise<boolean> {
    const stockCount = await prisma.stockLevel.count({
      where: {
        productId: id,
        quantityTotal: { gt: 0 },
      },
    });

    return stockCount > 0;
  }

  /**
   * Check if SKU exists (excluding a specific product ID)
   */
  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ProductWhereInput = { sku };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.product.count({ where });
    return count > 0;
  }

  /**
   * Check if barcode exists (excluding a specific product ID)
   */
  async barcodeExists(barcode: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ProductWhereInput = { barcode };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.product.count({ where });
    return count > 0;
  }
}
