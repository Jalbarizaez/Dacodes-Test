import { ReorderRule, ReorderAlert } from '@prisma/client';

/**
 * Reorder DTOs and Types
 */

// Reorder rule with relations
export interface ReorderRuleWithRelations extends ReorderRule {
  product?: {
    id: string;
    sku: string;
    name: string;
    unitOfMeasure: string;
  };
  alerts?: ReorderAlert[];
}

// Reorder rule response (for API)
export interface ReorderRuleResponse {
  id: string;
  productId: string;
  productSku?: string;
  productName?: string;
  minimumQuantity: number;
  reorderQuantity: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Future AI fields (prepared for expansion)
  maxQuantity?: number | null;
  safetyStock?: number | null;
  leadTimeDays?: number | null;
}

// Create reorder rule DTO
export interface CreateReorderRuleDTO {
  productId: string;
  minimumQuantity: number;
  reorderQuantity: number;
  isEnabled?: boolean;
  // Future AI fields
  maxQuantity?: number;
  safetyStock?: number;
  leadTimeDays?: number;
}

// Update reorder rule DTO
export interface UpdateReorderRuleDTO {
  minimumQuantity?: number;
  reorderQuantity?: number;
  isEnabled?: boolean;
  // Future AI fields
  maxQuantity?: number;
  safetyStock?: number;
  leadTimeDays?: number;
}

// Reorder alert response
export interface ReorderAlertResponse {
  id: string;
  reorderRuleId: string;
  productId: string;
  productSku?: string;
  productName?: string;
  currentStock: number;
  minimumQuantity: number;
  suggestedOrderQuantity: number;
  createdAt: Date;
  isResolved: boolean;
  // Calculated fields
  stockDeficit?: number;
  urgencyLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Reorder suggestion
export interface ReorderSuggestion {
  productId: string;
  productSku: string;
  productName: string;
  currentStock: number;
  minimumQuantity: number;
  reorderQuantity: number;
  suggestedOrderQuantity: number;
  stockDeficit: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  // Future AI fields
  predictedDemand?: number;
  recommendedSupplier?: string;
  estimatedCost?: number;
}

// Reorder query filters
export interface ReorderRuleFilters {
  productId?: string;
  isEnabled?: boolean;
}

// Reorder alert filters
export interface ReorderAlertFilters {
  productId?: string;
  isResolved?: boolean;
  createdDateFrom?: Date;
  createdDateTo?: Date;
}

// Reorder statistics
export interface ReorderStatistics {
  totalRules: number;
  enabledRules: number;
  disabledRules: number;
  totalAlerts: number;
  unresolvedAlerts: number;
  resolvedAlerts: number;
  productsNeedingReorder: number;
}

/**
 * Calculate urgency level based on stock deficit
 */
export function calculateUrgencyLevel(
  currentStock: number,
  minimumQuantity: number
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const deficit = minimumQuantity - currentStock;
  const deficitPercentage = (deficit / minimumQuantity) * 100;

  if (currentStock <= 0) {
    return 'CRITICAL'; // Out of stock
  } else if (deficitPercentage >= 75) {
    return 'HIGH'; // 75%+ below minimum
  } else if (deficitPercentage >= 50) {
    return 'MEDIUM'; // 50-75% below minimum
  } else {
    return 'LOW'; // Less than 50% below minimum
  }
}

/**
 * Calculate suggested order quantity
 * Basic formula: reorderQuantity + stockDeficit
 * Future: Can be replaced with AI-based calculation
 */
export function calculateSuggestedOrderQuantity(
  currentStock: number,
  minimumQuantity: number,
  reorderQuantity: number,
  maxQuantity?: number
): number {
  const deficit = Math.max(0, minimumQuantity - currentStock);
  let suggested = reorderQuantity + deficit;

  // Cap at max quantity if specified
  if (maxQuantity && suggested > maxQuantity) {
    suggested = maxQuantity;
  }

  return suggested;
}
