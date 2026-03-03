import { Product } from '@prisma/client';
import { ProductRepository } from './product.repository.js';
import { CreateProductDTO, UpdateProductDTO, ProductFilters, ProductWithRelations } from './product.types.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { HttpStatus } from '../../shared/types/index.js';
import { Prisma } from '@prisma/client';
import { auditCreate, auditUpdate, createAuditSummary } from '../../shared/utils/audit.js';

/**
 * Product Service
 * Contains business logic for product operations
 */
export class ProductService {
  private repository: ProductRepository;

  constructor() {
    this.repository = new ProductRepository();
  }

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductDTO, userId?: string): Promise<Product> {
    try {
      // Check if SKU already exists
      const skuExists = await this.repository.skuExists(data.sku);
      if (skuExists) {
        throw new AppError(
          'DUPLICATE_SKU',
          `Product with SKU '${data.sku}' already exists`,
          HttpStatus.CONFLICT
        );
      }

      // Check if barcode already exists (if provided)
      if (data.barcode) {
        const barcodeExists = await this.repository.barcodeExists(data.barcode);
        if (barcodeExists) {
          throw new AppError(
            'DUPLICATE_BARCODE',
            `Product with barcode '${data.barcode}' already exists`,
            HttpStatus.CONFLICT
          );
        }
      }

      // Create product
      const product = await this.repository.create(data);

      // Audit log
      await auditCreate(
        'product',
        product.id,
        createAuditSummary(product, ['id', 'sku', 'name', 'categoryId', 'isActive']),
        userId,
        `Created product ${product.sku}`
      );

      return product;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new AppError(
            'INVALID_CATEGORY',
            'Category does not exist',
            HttpStatus.BAD_REQUEST
          );
        }
      }

      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<ProductWithRelations> {
    const product = await this.repository.findById(id);

    if (!product) {
      throw new AppError(
        'PRODUCT_NOT_FOUND',
        `Product with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return product;
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(sku: string): Promise<ProductWithRelations> {
    const product = await this.repository.findBySku(sku);

    if (!product) {
      throw new AppError(
        'PRODUCT_NOT_FOUND',
        `Product with SKU '${sku}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return product;
  }

  /**
   * Get all products with filters and pagination
   */
  async getAllProducts(
    filters: ProductFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ products: ProductWithRelations[]; total: number }> {
    // Validate pagination
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
   * Update product
   */
  async updateProduct(id: string, data: UpdateProductDTO, userId?: string): Promise<Product> {
    try {
      // Check if product exists
      const existingProduct = await this.repository.findById(id);
      if (!existingProduct) {
        throw new AppError(
          'PRODUCT_NOT_FOUND',
          `Product with ID '${id}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      // Check if barcode is being updated and if it already exists
      if (data.barcode) {
        const barcodeExists = await this.repository.barcodeExists(data.barcode, id);
        if (barcodeExists) {
          throw new AppError(
            'DUPLICATE_BARCODE',
            `Product with barcode '${data.barcode}' already exists`,
            HttpStatus.CONFLICT
          );
        }
      }

      // Update product
      const updatedProduct = await this.repository.update(id, data);

      // Audit log
      await auditUpdate(
        'product',
        id,
        createAuditSummary(existingProduct, ['name', 'description', 'categoryId', 'isActive']),
        createAuditSummary(updatedProduct, ['name', 'description', 'categoryId', 'isActive']),
        userId,
        `Updated product ${existingProduct.sku}`
      );

      return updatedProduct;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new AppError(
            'INVALID_CATEGORY',
            'Category does not exist',
            HttpStatus.BAD_REQUEST
          );
        }
        if (error.code === 'P2025') {
          throw new AppError(
            'PRODUCT_NOT_FOUND',
            `Product with ID '${id}' not found`,
            HttpStatus.NOT_FOUND
          );
        }
      }

      throw error;
    }
  }

  /**
   * Deactivate product (soft delete)
   */
  async deactivateProduct(id: string): Promise<Product> {
    try {
      // Check if product exists
      const existingProduct = await this.repository.findById(id);
      if (!existingProduct) {
        throw new AppError(
          'PRODUCT_NOT_FOUND',
          `Product with ID '${id}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      // Check if product is already inactive
      if (!existingProduct.isActive) {
        throw new AppError(
          'PRODUCT_ALREADY_INACTIVE',
          'Product is already inactive',
          HttpStatus.BAD_REQUEST
        );
      }

      // Check if product has stock
      const hasStock = await this.repository.hasStock(id);
      if (hasStock) {
        throw new AppError(
          'PRODUCT_HAS_STOCK',
          'Cannot deactivate product with existing stock. Please transfer or adjust stock first.',
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }

      // Deactivate product
      return await this.repository.softDelete(id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError(
            'PRODUCT_NOT_FOUND',
            `Product with ID '${id}' not found`,
            HttpStatus.NOT_FOUND
          );
        }
      }

      throw error;
    }
  }
}
