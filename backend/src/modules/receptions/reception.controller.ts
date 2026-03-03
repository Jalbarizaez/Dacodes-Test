import { Response } from 'express';
import { ReceptionService } from './reception.service.js';
import { createReceptionSchema, receptionQuerySchema, uuidParamSchema } from './reception.validator.js';
import { CreateReceptionDTO, ReceptionFilters } from './reception.types.js';
import { sendSuccess, calculatePagination } from '../../shared/utils/response.js';
import { AuthRequest, HttpStatus } from '../../shared/types/index.js';

/**
 * Reception Controller
 * Handles HTTP requests for reception operations
 */
export class ReceptionController {
  private service: ReceptionService;

  constructor() {
    this.service = new ReceptionService();
  }

  /**
   * Create a new reception
   * POST /api/v1/receptions
   */
  createReception = async (req: AuthRequest, res: Response): Promise<Response> => {
    const validatedData = createReceptionSchema.parse(req.body);

    // TODO: Get userId from authenticated user
    const userId = 'system-user';

    const data: CreateReceptionDTO = {
      purchaseOrderId: validatedData.purchaseOrderId,
      receivedDate: validatedData.receivedDate,
      receivedBy: validatedData.receivedBy,
      items: validatedData.items,
      notes: validatedData.notes,
    };

    const summary = await this.service.createReception(data, userId);

    return sendSuccess(res, summary, HttpStatus.CREATED);
  };

  /**
   * Get all receptions with filters
   * GET /api/v1/receptions
   */
  getAllReceptions = async (req: AuthRequest, res: Response): Promise<Response> => {
    const validatedQuery = receptionQuerySchema.parse(req.query);

    const filters: ReceptionFilters = {
      purchaseOrderId: validatedQuery.purchaseOrderId,
      receivedDateFrom: validatedQuery.receivedDateFrom,
      receivedDateTo: validatedQuery.receivedDateTo,
      receivedBy: validatedQuery.receivedBy,
    };

    const result = await this.service.getAllReceptions(
      filters,
      validatedQuery.page,
      validatedQuery.pageSize,
      validatedQuery.sortBy,
      validatedQuery.sortOrder
    );

    return sendSuccess(
      res,
      result.receptions,
      HttpStatus.OK,
      calculatePagination(result.total, result.page, result.pageSize)
    );
  };

  /**
   * Get reception by ID
   * GET /api/v1/receptions/:id
   */
  getReceptionById = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id } = uuidParamSchema.parse(req.params);

    const reception = await this.service.getReceptionById(id);

    return sendSuccess(res, reception);
  };

  /**
   * Get receptions by purchase order
   * GET /api/v1/receptions/purchase-order/:purchaseOrderId
   */
  getReceptionsByPurchaseOrder = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id: purchaseOrderId } = uuidParamSchema.parse({
      id: req.params.purchaseOrderId,
    });

    const receptions = await this.service.getReceptionsByPurchaseOrder(purchaseOrderId);

    return sendSuccess(res, receptions);
  };
}
