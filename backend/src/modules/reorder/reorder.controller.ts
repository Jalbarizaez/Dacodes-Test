import { Response } from 'express';
import { ReorderService } from './reorder.service.js';
import {
  createReorderRuleSchema,
  updateReorderRuleSchema,
  reorderRuleQuerySchema,
  reorderAlertQuerySchema,
  uuidParamSchema,
} from './reorder.validator.js';
import {
  CreateReorderRuleDTO,
  UpdateReorderRuleDTO,
  ReorderRuleFilters,
  ReorderAlertFilters,
} from './reorder.types.js';
import { sendSuccess, calculatePagination } from '../../shared/utils/response.js';
import { AuthRequest, HttpStatus } from '../../shared/types/index.js';

/**
 * Reorder Controller
 * Handles HTTP requests for reorder operations
 */
export class ReorderController {
  private service: ReorderService;

  constructor() {
    this.service = new ReorderService();
  }

  /**
   * Create a new reorder rule
   * POST /api/v1/reorder/rules
   */
  createReorderRule = async (req: AuthRequest, res: Response): Promise<Response> => {
    const validatedData = createReorderRuleSchema.parse(req.body);

    const data: CreateReorderRuleDTO = {
      productId: validatedData.productId,
      minimumQuantity: validatedData.minimumQuantity,
      reorderQuantity: validatedData.reorderQuantity,
      isEnabled: validatedData.isEnabled,
      maxQuantity: validatedData.maxQuantity,
      safetyStock: validatedData.safetyStock,
      leadTimeDays: validatedData.leadTimeDays,
    };

    const rule = await this.service.createReorderRule(data);

    return sendSuccess(res, rule, HttpStatus.CREATED);
  };

  /**
   * Get all reorder rules with filters
   * GET /api/v1/reorder/rules
   */
  getAllReorderRules = async (req: AuthRequest, res: Response): Promise<Response> => {
    const validatedQuery = reorderRuleQuerySchema.parse(req.query);

    const filters: ReorderRuleFilters = {
      productId: validatedQuery.productId,
      isEnabled: validatedQuery.isEnabled,
    };

    const result = await this.service.getAllReorderRules(
      filters,
      validatedQuery.page,
      validatedQuery.pageSize,
      validatedQuery.sortBy,
      validatedQuery.sortOrder
    );

    return sendSuccess(
      res,
      result.rules,
      HttpStatus.OK,
      calculatePagination(result.total, result.page, result.pageSize)
    );
  };

  /**
   * Get reorder rule by ID
   * GET /api/v1/reorder/rules/:id
   */
  getReorderRuleById = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id } = uuidParamSchema.parse(req.params);

    const rule = await this.service.getReorderRuleById(id);

    return sendSuccess(res, rule);
  };

  /**
   * Get reorder rule by product ID
   * GET /api/v1/reorder/rules/product/:productId
   */
  getReorderRuleByProductId = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id: productId } = uuidParamSchema.parse({
      id: req.params.productId,
    });

    const rule = await this.service.getReorderRuleByProductId(productId);

    return sendSuccess(res, rule);
  };

  /**
   * Update reorder rule
   * PUT /api/v1/reorder/rules/:id
   */
  updateReorderRule = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id } = uuidParamSchema.parse(req.params);
    const validatedData = updateReorderRuleSchema.parse(req.body);

    const data: UpdateReorderRuleDTO = {
      minimumQuantity: validatedData.minimumQuantity,
      reorderQuantity: validatedData.reorderQuantity,
      isEnabled: validatedData.isEnabled,
      maxQuantity: validatedData.maxQuantity,
      safetyStock: validatedData.safetyStock,
      leadTimeDays: validatedData.leadTimeDays,
    };

    const rule = await this.service.updateReorderRule(id, data);

    return sendSuccess(res, rule);
  };

  /**
   * Delete reorder rule
   * DELETE /api/v1/reorder/rules/:id
   */
  deleteReorderRule = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id } = uuidParamSchema.parse(req.params);

    await this.service.deleteReorderRule(id);

    return sendSuccess(res, { message: 'Reorder rule deleted successfully' });
  };

  /**
   * Get reorder suggestions
   * GET /api/v1/reorder/suggestions
   */
  getReorderSuggestions = async (_req: AuthRequest, res: Response): Promise<Response> => {
    const suggestions = await this.service.getReorderSuggestions();

    return sendSuccess(res, suggestions);
  };

  /**
   * Evaluate reorder rules and create alerts
   * POST /api/v1/reorder/evaluate
   */
  evaluateReorderRules = async (_req: AuthRequest, res: Response): Promise<Response> => {
    const suggestions = await this.service.evaluateReorderRules();

    return sendSuccess(res, {
      message: 'Reorder rules evaluated successfully',
      suggestions,
      count: suggestions.length,
    });
  };

  /**
   * Get all reorder alerts with filters
   * GET /api/v1/reorder/alerts
   */
  getAllReorderAlerts = async (req: AuthRequest, res: Response): Promise<Response> => {
    const validatedQuery = reorderAlertQuerySchema.parse(req.query);

    const filters: ReorderAlertFilters = {
      productId: validatedQuery.productId,
      isResolved: validatedQuery.isResolved,
      createdDateFrom: validatedQuery.createdDateFrom,
      createdDateTo: validatedQuery.createdDateTo,
    };

    const result = await this.service.getAllReorderAlerts(
      filters,
      validatedQuery.page,
      validatedQuery.pageSize,
      validatedQuery.sortBy,
      validatedQuery.sortOrder
    );

    return sendSuccess(
      res,
      result.alerts,
      HttpStatus.OK,
      calculatePagination(result.total, result.page, result.pageSize)
    );
  };

  /**
   * Resolve reorder alert
   * POST /api/v1/reorder/alerts/:id/resolve
   */
  resolveAlert = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { id } = uuidParamSchema.parse(req.params);

    await this.service.resolveAlert(id);

    return sendSuccess(res, { message: 'Reorder alert resolved successfully' });
  };

  /**
   * Get reorder statistics
   * GET /api/v1/reorder/statistics
   */
  getStatistics = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { productId, isEnabled } = req.query as any;

    const filters: ReorderRuleFilters = {
      productId,
      isEnabled: isEnabled === 'true' ? true : isEnabled === 'false' ? false : undefined,
    };

    const statistics = await this.service.getStatistics(filters);

    return sendSuccess(res, statistics);
  };
}
