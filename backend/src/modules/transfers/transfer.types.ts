import { StockTransfer, StockTransferItem, TransferStatus } from '@prisma/client';

/**
 * Transfer DTOs and Types
 */

// Transfer with relations
export interface TransferWithRelations extends StockTransfer {
  sourceLocation?: {
    id: string;
    code: string;
    warehouse: {
      id: string;
      name: string;
    };
  };
  destinationLocation?: {
    id: string;
    code: string;
    warehouse: {
      id: string;
      name: string;
    };
  };
  requestedByUser?: {
    id: string;
    email: string;
  };
  approvedByUser?: {
    id: string;
    email: string;
  } | null;
  items?: TransferItemWithRelations[];
}

// Transfer item with relations
export interface TransferItemWithRelations extends StockTransferItem {
  product?: {
    id: string;
    sku: string;
    name: string;
    unitOfMeasure: string;
  };
}

// Transfer response (for API)
export interface TransferResponse {
  id: string;
  transferNumber: string;
  sourceLocationId: string;
  sourceLocationCode?: string;
  sourceWarehouseName?: string;
  destinationLocationId: string;
  destinationLocationCode?: string;
  destinationWarehouseName?: string;
  status: TransferStatus;
  requestedDate: Date;
  shippedDate?: Date | null;
  completedDate?: Date | null;
  requestedBy: string;
  requestedByEmail?: string;
  approvedBy?: string | null;
  approvedByEmail?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: TransferItemResponse[];
  totalItemsRequested?: number;
  totalItemsShipped?: number;
  totalItemsReceived?: number;
}

// Transfer item response
export interface TransferItemResponse {
  id: string;
  productId: string;
  productSku?: string;
  productName?: string;
  unitOfMeasure?: string;
  lotId?: string | null;
  quantityRequested: number;
  quantityShipped: number;
  quantityReceived: number;
  notes?: string | null;
}

// Create transfer DTO
export interface CreateTransferDTO {
  sourceLocationId: string;
  destinationLocationId: string;
  requestedDate: Date;
  requestedBy: string;
  items: CreateTransferItemDTO[];
  notes?: string;
}

// Create transfer item DTO
export interface CreateTransferItemDTO {
  productId: string;
  lotId?: string;
  quantityRequested: number;
  notes?: string;
}

// Update transfer status DTO
export interface UpdateTransferStatusDTO {
  status: TransferStatus;
  approvedBy?: string;
  shippedDate?: Date;
  completedDate?: Date;
}

// Ship transfer DTO
export interface ShipTransferDTO {
  shippedDate: Date;
  items: ShipTransferItemDTO[];
}

// Ship transfer item DTO
export interface ShipTransferItemDTO {
  itemId: string;
  quantityShipped: number;
}

// Complete transfer DTO
export interface CompleteTransferDTO {
  completedDate: Date;
  items: CompleteTransferItemDTO[];
}

// Complete transfer item DTO
export interface CompleteTransferItemDTO {
  itemId: string;
  quantityReceived: number;
}

// Transfer query filters
export interface TransferFilters {
  status?: TransferStatus;
  sourceLocationId?: string;
  destinationLocationId?: string;
  requestedDateFrom?: Date;
  requestedDateTo?: Date;
  requestedBy?: string;
}

// Transfer statistics
export interface TransferStatistics {
  totalTransfers: number;
  byStatus: Record<TransferStatus, number>;
  totalItemsTransferred: number;
  averageItemsPerTransfer: number;
}

// Valid status transitions
export const VALID_TRANSFER_STATUS_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  PENDING: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};
