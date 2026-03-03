import { Product } from '@prisma/client';

/**
 * Product DTOs and Types
 */

// Create Product DTO
export interface CreateProductDTO {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  unitOfMeasure: string;
  minStock?: number;
  maxStock?: number;
  weight?: number;
  dimensions?: string;
  barcode?: string;
}

// Update Product DTO
export interface UpdateProductDTO {
  name?: string;
  description?: string;
  categoryId?: string;
  unitOfMeasure?: string;
  minStock?: number;
  maxStock?: number;
  weight?: number;
  dimensions?: string;
  barcode?: string;
}

// Product Query Filters
export interface ProductFilters {
  categoryId?: string;
  isActive?: boolean;
  search?: string; // Search in name, sku, or barcode
  minStock?: number;
  maxStock?: number;
}

// Product with relations
export interface ProductWithRelations extends Product {
  category?: {
    id: string;
    name: string;
  };
  _count?: {
    stockLevels: number;
  };
}

// Product response (for API)
export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName?: string;
  unitOfMeasure: string;
  minStock: number | null;
  maxStock: number | null;
  weight: string | null; // Decimal as string
  dimensions: string | null;
  barcode: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
