import { Request, Response } from 'express';
import { AuditService } from './audit.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { AuditLogFilters } from './audit.types.js';
import { HttpStatus } from '../../shared/types/index.js';

/**
 * Audit Controller
 * Handles HTTP requests for audit log operations
 */
export class AuditController {
  private service: AuditService;

  constructor() {
    this.service = new AuditService();
  }

  /**
   * Get audit log by ID
   * GET /api/v1/audit/logs/:id
   */
  getAuditLogById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const log = await this.service.getAuditLogById(id);

    sendSuccess(res, log, HttpStatus.OK);
  };

  /**
   * Get all audit logs with filters and pagination
   * GET /api/v1/audit/logs
   */
  getAllAuditLogs = async (req: Request, res: Response): Promise<void> => {
    const {
      userId,
      action,
      entityType,
      entityId,
      dateFrom,
      dateTo,
      search,
      page = '1',
      pageSize = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filters: AuditLogFilters = {
      userId: userId as string | undefined,
      action: action as any,
      entityType: entityType as string | undefined,
      entityId: entityId as string | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      search: search as string | undefined,
    };

    const result = await this.service.getAllAuditLogs(
      filters,
      parseInt(page as string),
      parseInt(pageSize as string),
      sortBy as string,
      sortOrder as 'asc' | 'desc'
    );

    sendSuccess(
      res,
      result.logs,
      HttpStatus.OK,
      {
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(pageSize as string)),
      }
    );
  };

  /**
   * Get audit logs by entity
   * GET /api/v1/audit/logs/entity/:entityType/:entityId
   */
  getAuditLogsByEntity = async (req: Request, res: Response): Promise<void> => {
    const { entityType, entityId } = req.params;
    const { limit = '50' } = req.query;

    const logs = await this.service.getAuditLogsByEntity(
      entityType,
      entityId,
      parseInt(limit as string)
    );

    sendSuccess(res, logs, HttpStatus.OK);
  };

  /**
   * Get audit logs by user
   * GET /api/v1/audit/logs/user/:userId
   */
  getAuditLogsByUser = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { limit = '50' } = req.query;

    const logs = await this.service.getAuditLogsByUser(userId, parseInt(limit as string));

    sendSuccess(res, logs, HttpStatus.OK);
  };

  /**
   * Get audit statistics
   * GET /api/v1/audit/statistics
   */
  getStatistics = async (req: Request, res: Response): Promise<void> => {
    const { userId, action, entityType, entityId } = req.query;

    const filters: AuditLogFilters = {
      userId: userId as string | undefined,
      action: action as any,
      entityType: entityType as string | undefined,
      entityId: entityId as string | undefined,
    };

    const stats = await this.service.getStatistics(filters);

    sendSuccess(res, stats, HttpStatus.OK);
  };
}
