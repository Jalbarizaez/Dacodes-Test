import { Response } from 'express';
import { WarehouseService } from './warehouse.service.js';
import { AuthRequest } from '../../shared/types/index.js';
import { sendSuccess, calculatePagination } from '../../shared/utils/response.js';
import { HttpStatus } from '../../shared/types/index.js';
import {
  CreateWarehouseDTO,
  UpdateWarehouseDTO,
  WarehouseFilters,
  WarehouseResponse,
  CreateLocationDTO,
  UpdateLocationDTO,
  LocationFilters,
  LocationResponse,
} from './warehouse.types.js';

/**
 * Warehouse Controller
 * Handles HTTP requests for warehouse and location operations
 */
export class WarehouseController {
  private service: WarehouseService;

  constructor() {
    this.service = new WarehouseService();
  }

  // ============================================================================
  // WAREHOUSE ENDPOINTS
  // ============================================================================

  /**
   * POST /api/v1/warehouses
   * Create a new warehouse
   */
  async createWarehouse(req: AuthRequest, res: Response): Promise<Response> {
    const data: CreateWarehouseDTO = req.body;
    const warehouse = await this.service.createWarehouse(data);

    return sendSuccess(res, this.toWarehouseResponse(warehouse), HttpStatus.CREATED);
  }

  /**
   * GET /api/v1/warehouses
   * Get all warehouses with filters and pagination
   */
  async getAllWarehouses(req: AuthRequest, res: Response): Promise<Response> {
    const {
      page = 1,
      pageSize = 20,
      isActive,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query as any;

    const filters: WarehouseFilters = {
      isActive,
      search,
    };

    const { warehouses, total } = await this.service.getAllWarehouses(
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    const warehouseResponses = warehouses.map((w) => this.toWarehouseResponse(w));
    const meta = calculatePagination(total, page, pageSize);

    return sendSuccess(res, warehouseResponses, HttpStatus.OK, meta);
  }

  /**
   * GET /api/v1/warehouses/:id
   * Get warehouse by ID
   */
  async getWarehouseById(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const warehouse = await this.service.getWarehouseById(id);

    return sendSuccess(res, this.toWarehouseResponse(warehouse));
  }

  /**
   * PUT /api/v1/warehouses/:id
   * Update warehouse
   */
  async updateWarehouse(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const data: UpdateWarehouseDTO = req.body;
    const warehouse = await this.service.updateWarehouse(id, data);

    return sendSuccess(res, this.toWarehouseResponse(warehouse));
  }

  /**
   * DELETE /api/v1/warehouses/:id
   * Deactivate warehouse (soft delete)
   */
  async deactivateWarehouse(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const warehouse = await this.service.deactivateWarehouse(id);

    return sendSuccess(res, this.toWarehouseResponse(warehouse));
  }

  // ============================================================================
  // LOCATION ENDPOINTS
  // ============================================================================

  /**
   * POST /api/v1/locations
   * Create a new location
   */
  async createLocation(req: AuthRequest, res: Response): Promise<Response> {
    const data: CreateLocationDTO = req.body;
    const location = await this.service.createLocation(data);

    return sendSuccess(res, this.toLocationResponse(location), HttpStatus.CREATED);
  }

  /**
   * GET /api/v1/locations
   * Get all locations with filters and pagination
   */
  async getAllLocations(req: AuthRequest, res: Response): Promise<Response> {
    const {
      page = 1,
      pageSize = 20,
      warehouseId,
      type,
      isActive,
      search,
      sortBy = 'code',
      sortOrder = 'asc',
    } = req.query as any;

    const filters: LocationFilters = {
      warehouseId,
      type,
      isActive,
      search,
    };

    const { locations, total } = await this.service.getAllLocations(
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    const locationResponses = locations.map((l) => this.toLocationResponse(l));
    const meta = calculatePagination(total, page, pageSize);

    return sendSuccess(res, locationResponses, HttpStatus.OK, meta);
  }

  /**
   * GET /api/v1/warehouses/:warehouseId/locations
   * Get all locations for a specific warehouse
   */
  async getLocationsByWarehouse(req: AuthRequest, res: Response): Promise<Response> {
    const { warehouseId } = req.params;
    const locations = await this.service.getLocationsByWarehouse(warehouseId);

    const locationResponses = locations.map((l) => this.toLocationResponse(l));

    return sendSuccess(res, locationResponses);
  }

  /**
   * GET /api/v1/locations/:id
   * Get location by ID
   */
  async getLocationById(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const location = await this.service.getLocationById(id);

    return sendSuccess(res, this.toLocationResponse(location));
  }

  /**
   * PUT /api/v1/locations/:id
   * Update location
   */
  async updateLocation(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const data: UpdateLocationDTO = req.body;
    const location = await this.service.updateLocation(id, data);

    return sendSuccess(res, this.toLocationResponse(location));
  }

  /**
   * DELETE /api/v1/locations/:id
   * Deactivate location (soft delete)
   */
  async deactivateLocation(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const location = await this.service.deactivateLocation(id);

    return sendSuccess(res, this.toLocationResponse(location));
  }

  // ============================================================================
  // RESPONSE TRANSFORMERS
  // ============================================================================

  /**
   * Transform warehouse to response format
   */
  private toWarehouseResponse(warehouse: any): WarehouseResponse {
    return {
      id: warehouse.id,
      name: warehouse.name,
      address: warehouse.address,
      isActive: warehouse.isActive,
      locationCount: warehouse._count?.locations,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
    };
  }

  /**
   * Transform location to response format
   */
  private toLocationResponse(location: any): LocationResponse {
    return {
      id: location.id,
      warehouseId: location.warehouseId,
      warehouseName: location.warehouse?.name,
      code: location.code,
      name: location.name,
      type: location.type,
      capacity: location.capacity,
      isActive: location.isActive,
      stockCount: location._count?.stockLevels,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    };
  }
}
