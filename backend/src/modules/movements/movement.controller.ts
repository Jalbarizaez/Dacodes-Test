import { Request, Response } from 'express';
import { MovementService } from './movement.service.js';
import {
  MovementFilters,
  CreateMovementDTO,
  StockAdjustmentRequest,
  StockStatusChangeRequest,
  MovementResponse,
} from './movement.types.js';
import { sendSuccess, calculatePagination } from '../../shared/utils/response.js';
import { AuthRequest, HttpStatus } from '../../shared/types/index.js';

/**
 * Movement Controller
 * Handles HTTP requests for stock movement operations
 */
export class MovementController {
  private service: MovementService;

  constructor() {
    this.service = new MovementService();
  }

  /**
   * GET /movements/:id
   * Get movement by ID
   */
  async getMovementById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const movement = await this.service.getMovementById(id);

    const response: MovementResponse = {
      id: movement.id,
      type: movement.type,
      productId: movement.productId,
      productSku: movement.product?.sku,
      productName: movement.product?.name,
      locationId: movement.locationId,
      locationCode: movement.location?.code,
      locationName: movement.location?.name,
      warehouseId: movement.location?.warehouse.id,
      warehouseName: movement.location?.warehouse.name,
      lotId: movement.lotId,
      lotNumber: movement.lot?.lotNumber,
      quantity: movement.quantity,
      fromStatus: movement.fromStatus,
      toStatus: movement.toStatus,
      date: movement.date,
      userId: movement.userId,
      userEmail: movement.user?.email,
      reason: movement.reason,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      notes: movement.notes,
      runningBalance: movement.runningBalance,
    };

    return sendSuccess(res, response);
  }

  /**
   * GET /movements
   * Get all movements with filters and pagination
   */
  async getAllMovements(req: AuthRequest, res: Response): Promise<Response> {
    const {
      page = 1,
      pageSize = 20,
      productId,
      locationId,
      warehouseId,
      lotId,
      type,
      userId,
      dateFrom,
      dateTo,
      referenceType,
      referenceId,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const filters: MovementFilters = {
      productId: productId as string,
      locationId: locationId as string,
      warehouseId: warehouseId as string,
      lotId: lotId as string,
      type: type as any,
      userId: userId as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      referenceType: referenceType as string,
      referenceId: referenceId as string,
    };

    const { movements, total } = await this.service.getAllMovements(
      filters,
      Number(page),
      Number(pageSize),
      sortBy as string,
      sortOrder as 'asc' | 'desc'
    );

    const response: MovementResponse[] = movements.map((m) => ({
      id: m.id,
      type: m.type,
      productId: m.productId,
      productSku: m.product?.sku,
      productName: m.product?.name,
      locationId: m.locationId,
      locationCode: m.location?.code,
      locationName: m.location?.name,
      warehouseId: m.location?.warehouse.id,
      warehouseName: m.location?.warehouse.name,
      lotId: m.lotId,
      lotNumber: m.lot?.lotNumber,
      quantity: m.quantity,
      fromStatus: m.fromStatus,
      toStatus: m.toStatus,
      date: m.date,
      userId: m.userId,
      userEmail: m.user?.email,
      reason: m.reason,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      notes: m.notes,
      runningBalance: m.runningBalance,
    }));

    return sendSuccess(res, response, HttpStatus.OK, calculatePagination(total, Number(page), Number(pageSize)));
  }

  /**
   * POST /movements
   * Create a new movement
   */
  async createMovement(req: AuthRequest, res: Response): Promise<Response> {
    const data: CreateMovementDTO = req.body;
    const movement = await this.service.createMovement(data);

    const response: MovementResponse = {
      id: movement.id,
      type: movement.type,
      productId: movement.productId,
      productSku: movement.product?.sku,
      productName: movement.product?.name,
      locationId: movement.locationId,
      locationCode: movement.location?.code,
      locationName: movement.location?.name,
      warehouseId: movement.location?.warehouse.id,
      warehouseName: movement.location?.warehouse.name,
      lotId: movement.lotId,
      lotNumber: movement.lot?.lotNumber,
      quantity: movement.quantity,
      fromStatus: movement.fromStatus,
      toStatus: movement.toStatus,
      date: movement.date,
      userId: movement.userId,
      userEmail: movement.user?.email,
      reason: movement.reason,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      notes: movement.notes,
      runningBalance: movement.runningBalance,
    };

    return sendSuccess(res, response, HttpStatus.CREATED);
  }

  /**
   * POST /movements/adjust
   * Create stock adjustment (simplified)
   */
  async createStockAdjustment(req: AuthRequest, res: Response): Promise<Response> {
    const data: StockAdjustmentRequest = req.body;
    const userId = req.user?.id || 'system'; // TODO: Get from auth middleware

    const movement = await this.service.createStockAdjustment(data, userId);

    const response: MovementResponse = {
      id: movement.id,
      type: movement.type,
      productId: movement.productId,
      productSku: movement.product?.sku,
      productName: movement.product?.name,
      locationId: movement.locationId,
      locationCode: movement.location?.code,
      locationName: movement.location?.name,
      warehouseId: movement.location?.warehouse.id,
      warehouseName: movement.location?.warehouse.name,
      lotId: movement.lotId,
      lotNumber: movement.lot?.lotNumber,
      quantity: movement.quantity,
      fromStatus: movement.fromStatus,
      toStatus: movement.toStatus,
      date: movement.date,
      userId: movement.userId,
      userEmail: movement.user?.email,
      reason: movement.reason,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      notes: movement.notes,
      runningBalance: movement.runningBalance,
    };

    return sendSuccess(res, response, HttpStatus.CREATED);
  }

  /**
   * POST /movements/change-status
   * Change stock status
   */
  async changeStockStatus(req: AuthRequest, res: Response): Promise<Response> {
    const data: StockStatusChangeRequest = req.body;
    const userId = req.user?.id || 'system'; // TODO: Get from auth middleware

    const movement = await this.service.changeStockStatus(data, userId);

    const response: MovementResponse = {
      id: movement.id,
      type: movement.type,
      productId: movement.productId,
      productSku: movement.product?.sku,
      productName: movement.product?.name,
      locationId: movement.locationId,
      locationCode: movement.location?.code,
      locationName: movement.location?.name,
      warehouseId: movement.location?.warehouse.id,
      warehouseName: movement.location?.warehouse.name,
      lotId: movement.lotId,
      lotNumber: movement.lot?.lotNumber,
      quantity: movement.quantity,
      fromStatus: movement.fromStatus,
      toStatus: movement.toStatus,
      date: movement.date,
      userId: movement.userId,
      userEmail: movement.user?.email,
      reason: movement.reason,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      notes: movement.notes,
      runningBalance: movement.runningBalance,
    };

    return sendSuccess(res, response, HttpStatus.CREATED);
  }

  /**
   * GET /movements/summary
   * Get movement summary
   */
  async getMovementSummary(req: AuthRequest, res: Response): Promise<Response> {
    const { productId, locationId, warehouseId, dateFrom, dateTo } = req.query;

    const filters: MovementFilters = {
      productId: productId as string,
      locationId: locationId as string,
      warehouseId: warehouseId as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const summary = await this.service.getMovementSummary(filters);

    return sendSuccess(res, summary);
  }

  /**
   * GET /movements/history/:productId/:locationId
   * Get movement history for a product at a location
   */
  async getMovementHistory(req: Request, res: Response): Promise<Response> {
    const { productId, locationId } = req.params;
    const { limit = 50 } = req.query;

    const movements = await this.service.getMovementHistory(
      productId,
      locationId,
      Number(limit)
    );

    const response: MovementResponse[] = movements.map((m) => ({
      id: m.id,
      type: m.type,
      productId: m.productId,
      productSku: m.product?.sku,
      productName: m.product?.name,
      locationId: m.locationId,
      locationCode: m.location?.code,
      locationName: m.location?.name,
      warehouseId: m.location?.warehouse.id,
      warehouseName: m.location?.warehouse.name,
      lotId: m.lotId,
      lotNumber: m.lot?.lotNumber,
      quantity: m.quantity,
      fromStatus: m.fromStatus,
      toStatus: m.toStatus,
      date: m.date,
      userId: m.userId,
      userEmail: m.user?.email,
      reason: m.reason,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      notes: m.notes,
      runningBalance: m.runningBalance,
    }));

    return sendSuccess(res, response);
  }
}
