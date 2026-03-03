import { ReorderRepository } from './reorder.repository.js';
import {
  ReorderRuleFilters,
  ReorderAlertFilters,
  ReorderRuleWithRelations,
  CreateReorderRuleDTO,
  UpdateReorderRuleDTO,
  ReorderRuleResponse,
  ReorderAlertResponse,
  ReorderSuggestion,
  ReorderStatistics,
  calculateUrgencyLevel,
  calculateSuggestedOrderQuantity,
} from './reorder.types.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { HttpStatus } from '../../shared/types/index.js';
import { prisma } from '../../config/database.js';

/**
 * Reorder Service
 * Contains business logic for reorder rules and alerts
 */
export class ReorderService {
  private repository: ReorderRepository;

  constructor() {
    this.repository = new ReorderRepository();
  }

  /**
   * Get reorder rule by ID
   */
  async getReorderRuleById(id: string): Promise<ReorderRuleResponse> {
    const rule = await this.repository.findById(id);

    if (!rule) {
      throw new AppError(
        'REORDER_RULE_NOT_FOUND',
        `Reorder rule with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return this.mapRuleToResponse(rule);
  }

  /**
   * Get reorder rule by product ID
   */
  async getReorderRuleByProductId(productId: string): Promise<ReorderRuleResponse> {
    const rule = await this.repository.findByProductId(productId);

    if (!rule) {
      throw new AppError(
        'REORDER_RULE_NOT_FOUND',
        `Reorder rule for product '${productId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return this.mapRuleToResponse(rule);
  }

  /**
   * Get all reorder rules with filters and pagination
   */
  async getAllReorderRules(
    filters: ReorderRuleFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ rules: ReorderRuleResponse[]; total: number; page: number; pageSize: number }> {
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

    const { rules, total } = await this.repository.findAll(
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    return {
      rules: rules.map((r) => this.mapRuleToResponse(r)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Create a new reorder rule
   */
  async createReorderRule(data: CreateReorderRuleDTO): Promise<ReorderRuleResponse> {
    // Validate product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true, isActive: true },
    });

    if (!product) {
      throw new AppError(
        'PRODUCT_NOT_FOUND',
        `Product with ID '${data.productId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    if (!product.isActive) {
      throw new AppError(
        'PRODUCT_INACTIVE',
        'Cannot create reorder rule for inactive product',
        HttpStatus.BAD_REQUEST
      );
    }

    // Check if reorder rule already exists for this product
    const existingRule = await this.repository.findByProductId(data.productId);
    if (existingRule) {
      throw new AppError(
        'REORDER_RULE_EXISTS',
        `Reorder rule already exists for product '${data.productId}'`,
        HttpStatus.CONFLICT
      );
    }

    // Validate business rules
    if (data.minimumQuantity < 0) {
      throw new AppError(
        'INVALID_MINIMUM_QUANTITY',
        'Minimum quantity must be non-negative',
        HttpStatus.BAD_REQUEST
      );
    }

    if (data.reorderQuantity <= 0) {
      throw new AppError(
        'INVALID_REORDER_QUANTITY',
        'Reorder quantity must be positive',
        HttpStatus.BAD_REQUEST
      );
    }

    // Create reorder rule
    const rule = await this.repository.create(
      data.productId,
      data.minimumQuantity,
      data.reorderQuantity,
      data.isEnabled ?? true
    );

    return await this.getReorderRuleById(rule.id);
  }

  /**
   * Update reorder rule
   */
  async updateReorderRule(id: string, data: UpdateReorderRuleDTO): Promise<ReorderRuleResponse> {
    // Verify reorder rule exists
    const rule = await this.repository.findById(id, false);

    if (!rule) {
      throw new AppError(
        'REORDER_RULE_NOT_FOUND',
        `Reorder rule with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    // Validate business rules
    if (data.minimumQuantity !== undefined && data.minimumQuantity < 0) {
      throw new AppError(
        'INVALID_MINIMUM_QUANTITY',
        'Minimum quantity must be non-negative',
        HttpStatus.BAD_REQUEST
      );
    }

    if (data.reorderQuantity !== undefined && data.reorderQuantity <= 0) {
      throw new AppError(
        'INVALID_REORDER_QUANTITY',
        'Reorder quantity must be positive',
        HttpStatus.BAD_REQUEST
      );
    }

    await this.repository.update(id, data);

    return await this.getReorderRuleById(id);
  }

  /**
   * Delete reorder rule
   */
  async deleteReorderRule(id: string): Promise<void> {
    const rule = await this.repository.findById(id, false);

    if (!rule) {
      throw new AppError(
        'REORDER_RULE_NOT_FOUND',
        `Reorder rule with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    await this.repository.delete(id);
  }

  /**
   * Evaluate all reorder rules and generate suggestions
   * This is the core method that checks stock levels against rules
   */
  async evaluateReorderRules(): Promise<ReorderSuggestion[]> {
    const suggestions: ReorderSuggestion[] = [];

    // Get all enabled reorder rules
    const rules = await this.repository.findAllEnabled();

    for (const rule of rules) {
      // Get total stock for this product across all locations
      const stockLevels = await prisma.stockLevel.findMany({
        where: {
          productId: rule.productId,
        },
      });

      const totalStock = stockLevels.reduce((sum, level) => sum + level.quantityAvailable, 0);

      // Check if stock is below minimum
      if (totalStock < rule.minimumQuantity) {
        const deficit = rule.minimumQuantity - totalStock;
        const suggestedOrderQuantity = calculateSuggestedOrderQuantity(
          totalStock,
          rule.minimumQuantity,
          rule.reorderQuantity
        );
        const urgencyLevel = calculateUrgencyLevel(totalStock, rule.minimumQuantity);

        suggestions.push({
          productId: rule.productId,
          productSku: rule.product?.sku || '',
          productName: rule.product?.name || '',
          currentStock: totalStock,
          minimumQuantity: rule.minimumQuantity,
          reorderQuantity: rule.reorderQuantity,
          suggestedOrderQuantity,
          stockDeficit: deficit,
          urgencyLevel,
          reason: this.generateReorderReason(totalStock, rule.minimumQuantity, urgencyLevel),
        });

        // Create alert if needed
        await this.repository.createAlert(
          rule.id,
          rule.productId,
          totalStock,
          rule.minimumQuantity,
          suggestedOrderQuantity
        );
      }
    }

    return suggestions;
  }

  /**
   * Get reorder suggestions (without creating alerts)
   */
  async getReorderSuggestions(): Promise<ReorderSuggestion[]> {
    const suggestions: ReorderSuggestion[] = [];

    // Get all enabled reorder rules
    const rules = await this.repository.findAllEnabled();

    for (const rule of rules) {
      // Get total stock for this product across all locations
      const stockLevels = await prisma.stockLevel.findMany({
        where: {
          productId: rule.productId,
        },
      });

      const totalStock = stockLevels.reduce((sum, level) => sum + level.quantityAvailable, 0);

      // Check if stock is below minimum
      if (totalStock < rule.minimumQuantity) {
        const deficit = rule.minimumQuantity - totalStock;
        const suggestedOrderQuantity = calculateSuggestedOrderQuantity(
          totalStock,
          rule.minimumQuantity,
          rule.reorderQuantity
        );
        const urgencyLevel = calculateUrgencyLevel(totalStock, rule.minimumQuantity);

        suggestions.push({
          productId: rule.productId,
          productSku: rule.product?.sku || '',
          productName: rule.product?.name || '',
          currentStock: totalStock,
          minimumQuantity: rule.minimumQuantity,
          reorderQuantity: rule.reorderQuantity,
          suggestedOrderQuantity,
          stockDeficit: deficit,
          urgencyLevel,
          reason: this.generateReorderReason(totalStock, rule.minimumQuantity, urgencyLevel),
        });
      }
    }

    return suggestions;
  }

  /**
   * Get all reorder alerts with filters and pagination
   */
  async getAllReorderAlerts(
    filters: ReorderAlertFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ alerts: ReorderAlertResponse[]; total: number; page: number; pageSize: number }> {
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

    const { alerts, total } = await this.repository.findAllAlerts(
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    // Enrich alerts with product information
    const enrichedAlerts: ReorderAlertResponse[] = [];
    for (const alert of alerts) {
      const product = await prisma.product.findUnique({
        where: { id: alert.productId },
        select: { sku: true, name: true },
      });

      const deficit = alert.minimumQuantity - alert.currentStock;
      const urgencyLevel = calculateUrgencyLevel(alert.currentStock, alert.minimumQuantity);

      enrichedAlerts.push({
        id: alert.id,
        reorderRuleId: alert.reorderRuleId,
        productId: alert.productId,
        productSku: product?.sku,
        productName: product?.name,
        currentStock: alert.currentStock,
        minimumQuantity: alert.minimumQuantity,
        suggestedOrderQuantity: alert.suggestedOrderQuantity,
        createdAt: alert.createdAt,
        isResolved: alert.isResolved,
        stockDeficit: deficit,
        urgencyLevel,
      });
    }

    return {
      alerts: enrichedAlerts,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Resolve reorder alert
   */
  async resolveAlert(id: string): Promise<void> {
    const alert = await prisma.reorderAlert.findUnique({
      where: { id },
    });

    if (!alert) {
      throw new AppError(
        'ALERT_NOT_FOUND',
        `Reorder alert with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    if (alert.isResolved) {
      throw new AppError(
        'ALERT_ALREADY_RESOLVED',
        'Reorder alert is already resolved',
        HttpStatus.BAD_REQUEST
      );
    }

    await this.repository.resolveAlert(id);
  }

  /**
   * Get reorder statistics
   */
  async getStatistics(filters?: ReorderRuleFilters): Promise<ReorderStatistics> {
    const stats = await this.repository.getStatistics(filters);

    // Get count of products needing reorder
    const suggestions = await this.getReorderSuggestions();

    return {
      totalRules: stats.totalRules,
      enabledRules: stats.enabledRules,
      disabledRules: stats.disabledRules,
      totalAlerts: stats.totalAlerts,
      unresolvedAlerts: stats.unresolvedAlerts,
      resolvedAlerts: stats.resolvedAlerts,
      productsNeedingReorder: suggestions.length,
    };
  }

  /**
   * Map reorder rule entity to response DTO
   */
  private mapRuleToResponse(rule: ReorderRuleWithRelations): ReorderRuleResponse {
    return {
      id: rule.id,
      productId: rule.productId,
      productSku: rule.product?.sku,
      productName: rule.product?.name,
      minimumQuantity: rule.minimumQuantity,
      reorderQuantity: rule.reorderQuantity,
      isEnabled: rule.isEnabled,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      // Future AI fields (null for now)
      maxQuantity: null,
      safetyStock: null,
      leadTimeDays: null,
    };
  }

  /**
   * Generate human-readable reorder reason
   */
  private generateReorderReason(
    currentStock: number,
    minimumQuantity: number,
    urgencyLevel: string
  ): string {
    if (currentStock <= 0) {
      return 'CRITICAL: Product is out of stock';
    }

    const deficit = minimumQuantity - currentStock;
    const deficitPercentage = Math.round((deficit / minimumQuantity) * 100);

    switch (urgencyLevel) {
      case 'CRITICAL':
        return `CRITICAL: Stock is at ${currentStock} units (${deficitPercentage}% below minimum)`;
      case 'HIGH':
        return `HIGH: Stock is ${deficit} units below minimum (${deficitPercentage}% deficit)`;
      case 'MEDIUM':
        return `MEDIUM: Stock is ${deficit} units below minimum (${deficitPercentage}% deficit)`;
      case 'LOW':
        return `LOW: Stock is ${deficit} units below minimum (${deficitPercentage}% deficit)`;
      default:
        return `Stock is below minimum level`;
    }
  }
}
