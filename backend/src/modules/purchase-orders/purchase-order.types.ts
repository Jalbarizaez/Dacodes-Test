import { PurchaseOrder, PurchaseOrderLineItem, PurchaseOrderStatus } from '@prisma/client';

/**
 * Purchase Order DTOs and Types
 */

// Purchase order with relations
export interface PurchaseOrderWithRelations extends PurchaseOrder {
  supplier?: {
    id: string;
    name: string;
    contactName: string | null;
    email: string | null;
    leadTimeDays: number;
  };
  lineItems?: LineItemWithRelations[];
  receptions?: {
    id: string;
    receivedDate: Date;
    receivedBy: string;
  }[];
}

// Line item with relations
export interface LineItemWithRelations extends PurchaseOrderLineItem {
  product?: {
    id: string;
    sku: string;
    name: string;
    unitOfMeasure: string;
  };
}

// Purchase order response (for API)
export interface PurchaseOrderResponse {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName?: string;
  orderDate: Date;
  expectedDeliveryDate: Date;
  status: PurchaseOrderStatus;
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
  lineItems?: LineItemResponse[];
  receptionCount?: number;
  // Calculated fields
  totalQuantity?: number;
  totalReceived?: number;
  completionPercentage?: number;
}

// Line item response
export interface LineItemResponse {
  id: string;
  productId: string;
  productSku?: string;
  productName?: string;
  unitOfMeasure?: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
  lineTotal: number;
  // Calculated fields
  pendingQuantity: number;
  completionPercentage: number;
}

// Create purchase order DTO
export interface CreatePurchaseOrderDTO {
  supplierId: string;
  orderDate: Date;
  expectedDeliveryDate: Date;
  lineItems: CreateLineItemDTO[];
  notes?: string;
}

// Create line item DTO
export interface CreateLineItemDTO {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// Update purchase order DTO
export interface UpdatePurchaseOrderDTO {
  supplierId?: string;
  orderDate?: Date;
  expectedDeliveryDate?: Date;
  lineItems?: UpdateLineItemDTO[];
}

// Update line item DTO
export interface UpdateLineItemDTO {
  id?: string; // If provided, update existing; if not, create new
  productId: string;
  quantity: number;
  unitPrice: number;
  _delete?: boolean; // Mark for deletion
}

// Purchase order query filters
export interface PurchaseOrderFilters {
  supplierId?: string;
  status?: PurchaseOrderStatus | PurchaseOrderStatus[];
  orderDateFrom?: Date;
  orderDateTo?: Date;
  expectedDeliveryDateFrom?: Date;
  expectedDeliveryDateTo?: Date;
  search?: string; // Search by order number
}

// Purchase order statistics
export interface PurchaseOrderStatistics {
  totalOrders: number;
  byStatus: Record<PurchaseOrderStatus, number>;
  totalValue: number;
  averageOrderValue: number;
  totalItems: number;
  totalReceived: number;
  completionRate: number;
}

// Status transition validation
export const VALID_STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: [], // Terminal state
  CANCELLED: [], // Terminal state
};
