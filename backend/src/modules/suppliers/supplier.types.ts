import { Supplier } from '@prisma/client';

/**
 * Supplier DTOs and Types
 */

// Supplier with relations
export interface SupplierWithRelations extends Supplier {
  _count?: {
    purchaseOrders: number;
    lots: number;
  };
}

// Supplier response (for API)
export interface SupplierResponse {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  paymentTerms: string | null;
  leadTimeDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Extended fields for future supplier scoring
  purchaseOrderCount?: number;
  lotCount?: number;
}

// Create supplier DTO
export interface CreateSupplierDTO {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
}

// Update supplier DTO
export interface UpdateSupplierDTO {
  name?: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  paymentTerms?: string | null;
  leadTimeDays?: number;
}

// Supplier query filters
export interface SupplierFilters {
  isActive?: boolean;
  search?: string; // Search by name, contact name, or email
}

// Supplier statistics (for future supplier scoring)
export interface SupplierStatistics {
  supplierId: string;
  supplierName: string;
  totalPurchaseOrders: number;
  totalLots: number;
  averageLeadTime?: number;
  onTimeDeliveryRate?: number;
  qualityScore?: number;
  overallScore?: number;
}

// Supplier performance metrics (extensible for future)
export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  metrics: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    averageLeadTime: number;
    onTimeDeliveries: number;
    lateDeliveries: number;
    onTimeRate: number;
  };
  // Placeholder for future scoring
  scoring?: {
    deliveryScore?: number;
    qualityScore?: number;
    priceScore?: number;
    overallScore?: number;
  };
}
