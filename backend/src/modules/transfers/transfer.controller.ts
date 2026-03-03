import { Response } from 'express';
import { TransferService } from './transfer.service.js';
import {
  createTransferSchema,
  updateTransferStatusSchema,
  shipTransferSchema,
  completeTransferSchema,
  transferQuerySchema,
  uuidParamSchema,
} from './transfer.validator.js';
import {
  CreateTransferDTO,
  UpdateTransferStatusDTO,
  ShipTransferDTO,
  CompleteTransferDTO,
  TransferFilters,
} from './transfer.types.js';
import { sendSuccess, calculatePagination } from '../../shared/utils/response.js';
import { AuthRequest, HttpStatus } from '../../shared/types/index.js';

/**
 * Transfer Controller
 * Handles HTTP requests for transfer operations
 */
export class TransferController {
  private service: TransferService;

  constructor() {
    this.service = new TransferService();
  }

  /**
   * Create a new transfer
   * POST /api/v1/transfers
   */
  createTransfer = async (req: AuthRequest, res: Response): Promise<Response> => {
    const validatedData = createTransferSchema.parse(req.body);

    const data: CreateTransferDTO = {
      sourceLocationId: validatedData.sourceLocationId,
      destinationLocationId: validatedData.destinationLocationId,
      requestedDate: validatedData.requestedDate,
      requestedBy: validatedData.requestedBy,
      items: validatedData.items,
      notes: validatedData.notes,
    };

    const transfer = await this.service.createTransfer(data);

    return sendSuccess(res, transfer, HttpStatus.CREATED);
  };

  /**
   * Get all transfers with filters
   * GET /api/v1/transfers
   */
  getAllTransfers = async (req: AuthRequest, res: Response): Promise<Response> => {
    const validatedQuery = transferQuerySchema.parse(req.query);

    const filters: TransferFilters = {
      status: validatedQuery.status,
      sourceLocationId: validatedQuery.sourceLocationId,
      destinationLocationId: validatedQuery.destinationLocationId,
      requestedDateFrom: validatedQuery.requestedDateFrom,
      requestedDateTo: validatedQuery.requestedDateTo,
      requestedBy: validatedQuery.requestedBy,
    };

    const result = await this.service.getAllTransfers(
      filters,
      validatedQuery.page,
      validatedQuery.pageSize,
      validatedQuery.sortBy,
      validatedQuery.sortOrder
    );

    return sendSuccess(
      res,
      result.transfers,
      HttpStatus.OK,
      calculatePagination(result.total, result.page, result.pageSize)
    );
  };

  /**
   * Get transfer by ID
   * GET /api/v1/transfers/:id
   */
  getTransferById = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id } = uuidParamSchema.parse(req.params);

    const transfer = await this.service.getTransferById(id);

    return sendSuccess(res, transfer);
  };

  /**
   * Update transfer status
   * PATCH /api/v1/transfers/:id/status
   */
  updateStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id } = uuidParamSchema.parse(req.params);
    const validatedData = updateTransferStatusSchema.parse(req.body);

    const data: UpdateTransferStatusDTO = {
      status: validatedData.status,
      approvedBy: validatedData.approvedBy,
    };

    const transfer = await this.service.updateStatus(id, data);

    return sendSuccess(res, transfer);
  };

  /**
   * Ship transfer
   * POST /api/v1/transfers/:id/ship
   */
  shipTransfer = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id } = uuidParamSchema.parse(req.params);
    const validatedData = shipTransferSchema.parse(req.body);

    // TODO: Get userId from authenticated user
    const userId = 'system-user';

    const data: ShipTransferDTO = {
      shippedDate: validatedData.shippedDate,
      items: validatedData.items,
    };

    const transfer = await this.service.shipTransfer(id, data, userId);

    return sendSuccess(res, transfer);
  };

  /**
   * Complete transfer
   * POST /api/v1/transfers/:id/complete
   */
  completeTransfer = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id } = uuidParamSchema.parse(req.params);
    const validatedData = completeTransferSchema.parse(req.body);

    // TODO: Get userId from authenticated user
    const userId = 'system-user';

    const data: CompleteTransferDTO = {
      completedDate: validatedData.completedDate,
      items: validatedData.items,
    };

    const transfer = await this.service.completeTransfer(id, data, userId);

    return sendSuccess(res, transfer);
  };

  /**
   * Cancel transfer
   * POST /api/v1/transfers/:id/cancel
   */
  cancelTransfer = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id } = uuidParamSchema.parse(req.params);

    const transfer = await this.service.cancelTransfer(id);

    return sendSuccess(res, transfer);
  };

  /**
   * Get transfer statistics
   * GET /api/v1/transfers/statistics
   */
  getStatistics = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { status, sourceLocationId, destinationLocationId } = req.query as any;

    const filters: TransferFilters = {
      status,
      sourceLocationId,
      destinationLocationId,
    };

    const statistics = await this.service.getStatistics(filters);

    return sendSuccess(res, statistics);
  };
}
