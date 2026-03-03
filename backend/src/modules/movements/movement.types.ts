import { StockMovement, MovementType, StockStatus } from '@prisma/client';

/**
 * Movement DTOs and Types
 */

// Movement with relations
export interface MovementWithRelations extends StockMovement {
  product?: {
    id: string;
    sku: string;
    name: string;
  };
  location?: {
    id: string;
    code: string;
    name: string | null;
    warehouse: {
      id: string;
      name: string;
    };
  };
  lot?: {
    id: string;
    lotNumber: string;
  } | null;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

// Movement response (for API)
export interface MovementResponse {
  id: string;
  type: MovementType;
  productId: string;
  productSku?: string;
  productName?: string;
  locationId: string;
  locationCode?: string;
  locationName?: string | null;
  warehouseId?: string;
  warehouseName?: string;
  lotId?: string | null;
  lotNumber?: string | null;
  quantity: number;
  fromStatus?: StockStatus | null;
  toStatus?: StockStatus | null;
  date: Date;
  userId: string;
  userEmail?: string;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  runningBalance: number;
}

// Create movement DTO
export interface CreateMovementDTO {
  type: MovementType;
  productId: string;
  locationId: string;
  lotId?: string;
  quantity: number;
  fromStatus?: StockStatus;
  toStatus?: StockStatus;
  userId: string;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

// Movement query filters
export interface MovementFilters {
  productId?: string;
  locationId?: string;
  warehouseId?: string;
  lotId?: string;
  type?: MovementType;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  referenceType?: string;
  referenceId?: string;
}

// Movement summary
export interface MovementSummary {
  totalMovements: number;
  totalInbound: number;
  totalOutbound: number;
  totalAdjustments: number;
  byType: Record<MovementType, number>;
}

// Stock adjustment request (simplified API)
export interface StockAdjustmentRequest {
  productId: string;
  locationId: string;
  quantity: number; // Positive for increase, negative for decrease
  reason: string;
  notes?: string;
}

// Stock status change request
export interface StockStatusChangeRequest {
  productId: string;
  locationId: string;
  quantity: number;
  fromStatus: StockStatus;
  toStatus: StockStatus;
  reason: string;
  notes?: string;
}
