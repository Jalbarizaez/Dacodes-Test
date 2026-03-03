import { AuditRepository } from './audit.repository.js';
import { AuditLogFilters, AuditLogWithRelations, AuditLogStatistics } from './audit.types.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { HttpStatus } from '../../shared/types/index.js';

/**
 * Audit Service
 * Contains business logic for audit log operations
 */
export class AuditService {
  private repository: AuditRepository;

  constructor() {
    this.repository = new AuditRepository();
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLogWithRelations> {
    const log = await this.repository.findById(id);

    if (!log) {
      throw new AppError(
        'AUDIT_LOG_NOT_FOUND',
        `Audit log with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return log;
  }

  /**
   * Get all audit logs with filters and pagination
   */
  async getAllAuditLogs(
    filters: AuditLogFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ logs: AuditLogWithRelations[]; total: number }> {
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
   * Get audit logs by entity
   */
  async getAuditLogsByEntity(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<AuditLogWithRelations[]> {
    if (limit < 1 || limit > 100) {
      throw new AppError(
        'INVALID_LIMIT',
        'Limit must be between 1 and 100',
        HttpStatus.BAD_REQUEST
      );
    }

    return await this.repository.findByEntity(entityType, entityId, limit);
  }

  /**
   * Get audit logs by user
   */
  async getAuditLogsByUser(userId: string, limit: number = 50): Promise<AuditLogWithRelations[]> {
    if (limit < 1 || limit > 100) {
      throw new AppError(
        'INVALID_LIMIT',
        'Limit must be between 1 and 100',
        HttpStatus.BAD_REQUEST
      );
    }

    return await this.repository.findByUser(userId, limit);
  }

  /**
   * Get audit statistics
   */
  async getStatistics(filters?: AuditLogFilters): Promise<AuditLogStatistics> {
    return await this.repository.getStatistics(filters);
  }
}
