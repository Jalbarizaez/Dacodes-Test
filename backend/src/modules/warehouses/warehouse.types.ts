import { Warehouse, Location } from '@prisma/client';

/**
 * Warehouse and Location DTOs and Types
 */

// ============================================================================
// WAREHOUSE TYPES
// ============================================================================

// Create Warehouse DTO
export interface CreateWarehouseDTO {
  name: string;
  address: string;
}

// Update Warehouse DTO
export interface UpdateWarehouseDTO {
  name?: string;
  address?: string;
}

// Warehouse Query Filters
export interface WarehouseFilters {
  isActive?: boolean;
  search?: string; // Search in name or address
}

// Warehouse with relations
export interface WarehouseWithRelations extends Warehouse {
  _count?: {
    locations: number;
  };
  locations?: LocationResponse[];
}

// Warehouse response (for API)
export interface WarehouseResponse {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  locationCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// LOCATION TYPES
// ============================================================================

// Location type enum (flexible identification)
export type LocationType = 'ZONE' | 'RACK' | 'SHELF' | 'BIN' | 'PALLET' | 'FLOOR' | 'OTHER';

// Create Location DTO
export interface CreateLocationDTO {
  warehouseId: string;
  code: string;
  name?: string;
  type?: LocationType;
  capacity?: number;
}

// Update Location DTO
export interface UpdateLocationDTO {
  code?: string;
  name?: string;
  type?: LocationType;
  capacity?: number;
}

// Location Query Filters
export interface LocationFilters {
  warehouseId?: string;
  type?: LocationType;
  isActive?: boolean;
  search?: string; // Search in code or name
}

// Location with relations
export interface LocationWithRelations extends Location {
  warehouse?: {
    id: string;
    name: string;
  };
  _count?: {
    stockLevels: number;
  };
}

// Location response (for API)
export interface LocationResponse {
  id: string;
  warehouseId: string;
  warehouseName?: string;
  code: string;
  name: string | null;
  type: string | null;
  capacity: number | null;
  isActive: boolean;
  stockCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
