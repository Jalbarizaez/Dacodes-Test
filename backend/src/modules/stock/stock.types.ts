import { StockLevel } from '@prisma/client';

/**
 * Stock DTOs and Types
 */

// Stock status breakdown
export interface StockBreakdown {
  available: number;
  reserved: number;
  damaged: number;
  total: number;
}

// Stock level with relations
export interface StockLevelWithRelations extends StockLevel {
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
}

// Stock response (for API)
export interface StockResponse {
  id: string;
  productId: string;
  productSku?: string;
  productName?: string;
  locationId: string;
  locationCode?: string;
  locationName?: string | null;
  warehouseId?: string;
  warehouseName?: string;
  quantityAvailable: number;
  quantityReserved: number;
  quantityDamaged: number;
  quantityTotal: number;
  lastCountDate: Date | null;
  updatedAt: Date;
}

// Consolidated stock by product
export interface ConsolidatedStockByProduct {
  productId: string;
  productSku: string;
  productName: string;
  totalAvailable: number;
  totalReserved: number;
  totalDamaged: number;
  totalStock: number;
  locationCount: number;
  locations: StockResponse[];
}

// Consolidated stock by warehouse
export interface ConsolidatedStockByWarehouse {
  warehouseId: string;
  warehouseName: string;
  totalAvailable: number;
  totalReserved: number;
  totalDamaged: number;
  totalStock: number;
  productCount: number;
  locationCount: number;
  products: Array<{
    productId: string;
    productSku: string;
    productName: string;
    available: number;
    reserved: number;
    damaged: number;
    total: number;
  }>;
}

// Consolidated stock by location
export interface ConsolidatedStockByLocation {
  locationId: string;
  locationCode: string;
  locationName: string | null;
  warehouseId: string;
  warehouseName: string;
  totalAvailable: number;
  totalReserved: number;
  totalDamaged: number;
  totalStock: number;
  productCount: number;
  products: Array<{
    productId: string;
    productSku: string;
    productName: string;
    available: number;
    reserved: number;
    damaged: number;
    total: number;
  }>;
}

// Stock query filters
export interface StockFilters {
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  hasStock?: boolean; // Filter locations with stock > 0
  lowStock?: boolean; // Filter products below minimum stock
}

// Stock adjustment DTO (for future use)
export interface StockAdjustmentDTO {
  productId: string;
  locationId: string;
  quantityChange: number;
  fromStatus?: 'AVAILABLE' | 'RESERVED' | 'DAMAGED';
  toStatus?: 'AVAILABLE' | 'RESERVED' | 'DAMAGED';
  reason: string;
  notes?: string;
}

// Low stock alert
export interface LowStockAlert {
  productId: string;
  productSku: string;
  productName: string;
  minStock: number;
  currentStock: number;
  deficit: number;
}
