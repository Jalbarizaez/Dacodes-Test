import { Response } from 'express';
import { SupplierService } from './supplier.service.js';
import {
  SupplierFilters,
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierResponse,
} from './supplier.types.js';
import { sendSuccess, calculatePagination } from '../../shared/utils/response.js';
import { AuthRequest, HttpStatus } from '../../shared/types/index.js';

/**
 * Supplier Controller
 * Handles HTTP requests for supplier operations
 */
export class SupplierController {
  private service: SupplierService;

  constructor() {
    this.service = new SupplierService();
  }

  /**
   * Transform supplier to response format
   */
  private toSupplierResponse(supplier: any): SupplierResponse {
    return {
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      paymentTerms: supplier.paymentTerms,
      leadTimeDays: supplier.leadTimeDays,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      purchaseOrderCount: supplier._count?.purchaseOrders,
      lotCount: supplier._count?.lots,
    };
  }

  /**
   * POST /suppliers
   * Create a new supplier
   */
  async create(req: AuthRequest, res: Response): Promise<Response> {
    const data: CreateSupplierDTO = req.body;
    const supplier = await this.service.createSupplier(data);

    return sendSuccess(res, this.toSupplierResponse(supplier), HttpStatus.CREATED);
  }

  /**
   * GET /suppliers
   * Get all suppliers with filters and pagination
   */
  async getAll(req: AuthRequest, res: Response): Promise<Response> {
    const {
      page = 1,
      pageSize = 20,
      isActive,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      includeRelations = 'false',
    } = req.query as any;

    const filters: SupplierFilters = {
      isActive,
      search,
    };

    const { suppliers, total } = await this.service.getAllSuppliers(
      filters,
      Number(page),
      Number(pageSize),
      sortBy,
      sortOrder as 'asc' | 'desc',
      includeRelations === 'true'
    );

    const response = suppliers.map((s) => this.toSupplierResponse(s));

    return sendSuccess(
      res,
      response,
      HttpStatus.OK,
      calculatePagination(total, Number(page), Number(pageSize))
    );
  }

  /**
   * GET /suppliers/active
   * Get all active suppliers (for dropdowns)
   */
  async getActive(_req: AuthRequest, res: Response): Promise<Response> {
    const suppliers = await this.service.getActiveSuppliers();
    const response = suppliers.map((s) => this.toSupplierResponse(s));

    return sendSuccess(res, response);
  }

  /**
   * GET /suppliers/:id
   * Get supplier by ID
   */
  async getById(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { includeRelations = 'true' } = req.query as any;

    const supplier = await this.service.getSupplierById(id, includeRelations === 'true');

    return sendSuccess(res, this.toSupplierResponse(supplier));
  }

  /**
   * PUT /suppliers/:id
   * Update supplier
   */
  async update(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const data: UpdateSupplierDTO = req.body;

    const supplier = await this.service.updateSupplier(id, data);

    return sendSuccess(res, this.toSupplierResponse(supplier));
  }

  /**
   * DELETE /suppliers/:id
   * Deactivate supplier (soft delete)
   */
  async deactivate(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const supplier = await this.service.deactivateSupplier(id);

    return sendSuccess(res, this.toSupplierResponse(supplier));
  }

  /**
   * POST /suppliers/:id/activate
   * Activate supplier
   */
  async activate(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const supplier = await this.service.activateSupplier(id);

    return sendSuccess(res, this.toSupplierResponse(supplier));
  }

  /**
   * GET /suppliers/:id/statistics
   * Get supplier statistics (for future supplier scoring)
   */
  async getStatistics(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const statistics = await this.service.getSupplierStatistics(id);

    return sendSuccess(res, statistics);
  }
}
