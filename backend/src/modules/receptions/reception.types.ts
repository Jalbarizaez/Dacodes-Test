import { Reception, ReceptionItem } from '@prisma/client';

/**
 * Reception DTOs and Types
 */

// Reception with relations
export interface ReceptionWithRelations extends Reception {
  purchaseOrder?: {
    id: string;
    orderNumber: string;
    supplierId: string;
    supplier: {
      name: string;
    };
  };
  items?: ReceptionItemWithRelations[];
}

// Reception item with relations
export interface ReceptionItemWithRelations extends ReceptionItem {
  lineItem?: {
    id: string;
    productId: string;
    quantity: number;
    receivedQuantity: number;
    product: {
      sku: string;
      name: string;
    };
  };
}

// Reception response (for API)
export interface ReceptionResponse {
  id: string;
  purchaseOrderId: string;
  orderNumber?: string;
  supplierName?: string;
  receivedDate: Date;
  receivedBy: string;
  createdAt: Date;
  items?: ReceptionItemResponse[];
  totalItemsReceived?: number;
}

// Reception item response
export interface ReceptionItemResponse {
  id: string;
  lineItemId: string;
  productId?: string;
  productSku?: string;
  productName?: string;
  receivedQuantity: number;
  locationId: string;
  batchNumber?: string | null;
  expirationDate?: Date | null;
  // Calculated fields
  orderedQuantity?: number;
  previouslyReceived?: number;
  totalReceived?: number;
  pendingQuantity?: number;
}

// Create reception DTO
export interface CreateReceptionDTO {
  purchaseOrderId: string;
  receivedDate: Date;
  receivedBy: string;
  items: CreateReceptionItemDTO[];
  notes?: string;
}

// Create reception item DTO
export interface CreateReceptionItemDTO {
  lineItemId: string;
  receivedQuantity: number;
  locationId: string;
  batchNumber?: string;
  expirationDate?: Date;
}

// Reception query filters
export interface ReceptionFilters {
  purchaseOrderId?: string;
  receivedDateFrom?: Date;
  receivedDateTo?: Date;
  receivedBy?: string;
}

// Reception validation result
export interface ReceptionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Reception summary
export interface ReceptionSummary {
  receptionId: string;
  purchaseOrderId: string;
  orderNumber: string;
  totalItemsReceived: number;
  stockMovementsCreated: number;
  purchaseOrderStatus: string;
  completionPercentage: number;
}
