import { Response } from 'express';
import { ProductService } from './product.service.js';
import { AuthRequest } from '../../shared/types/index.js';
import { sendSuccess, calculatePagination } from '../../shared/utils/response.js';
import { HttpStatus } from '../../shared/types/index.js';
import { CreateProductDTO, UpdateProductDTO, ProductFilters, ProductResponse } from './product.types.js';

/**
 * Product Controller
 * Handles HTTP requests for product operations
 */
export class ProductController {
  private service: ProductService;

  constructor() {
    this.service = new ProductService();
  }

  /**
   * POST /api/v1/products
   * Create a new product
   */
  async create(req: AuthRequest, res: Response): Promise<Response> {
    const data: CreateProductDTO = req.body;
    const product = await this.service.createProduct(data);

    return sendSuccess(res, this.toProductResponse(product), HttpStatus.CREATED);
  }

  /**
   * GET /api/v1/products
   * Get all products with filters and pagination
   */
  async getAll(req: AuthRequest, res: Response): Promise<Response> {
    const {
      page = 1,
      pageSize = 20,
      categoryId,
      isActive,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query as any;

    const filters: ProductFilters = {
      categoryId,
      isActive,
      search,
    };

    const { products, total } = await this.service.getAllProducts(
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    const productResponses = products.map((p) => this.toProductResponse(p));
    const meta = calculatePagination(total, page, pageSize);

    return sendSuccess(res, productResponses, HttpStatus.OK, meta);
  }

  /**
   * GET /api/v1/products/:id
   * Get product by ID
   */
  async getById(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const product = await this.service.getProductById(id);

    return sendSuccess(res, this.toProductResponse(product));
  }

  /**
   * GET /api/v1/products/sku/:sku
   * Get product by SKU
   */
  async getBySku(req: AuthRequest, res: Response): Promise<Response> {
    const { sku } = req.params;
    const product = await this.service.getProductBySku(sku);

    return sendSuccess(res, this.toProductResponse(product));
  }

  /**
   * PUT /api/v1/products/:id
   * Update product
   */
  async update(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const data: UpdateProductDTO = req.body;
    const product = await this.service.updateProduct(id, data);

    return sendSuccess(res, this.toProductResponse(product));
  }

  /**
   * DELETE /api/v1/products/:id
   * Deactivate product (soft delete)
   */
  async deactivate(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const product = await this.service.deactivateProduct(id);

    return sendSuccess(res, this.toProductResponse(product));
  }

  /**
   * Transform product to response format
   */
  private toProductResponse(product: any): ProductResponse {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      unitOfMeasure: product.unitOfMeasure,
      minStock: product.minStock,
      maxStock: product.maxStock,
      weight: product.weight?.toString() || null,
      dimensions: product.dimensions,
      barcode: product.barcode,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
