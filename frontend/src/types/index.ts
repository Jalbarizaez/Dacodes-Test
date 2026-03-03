// API Response types
export interface ApiResponse<T = any> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Product types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName?: string;
  unitOfMeasure: string;
  minStock: number | null;
  maxStock: number | null;
  weight: string | null;
  dimensions: string | null;
  barcode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
  } | null;
  children?: {
    id: string;
    name: string;
    isActive: boolean;
  }[];
  _count?: {
    products: number;
    children: number;
  };
}

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

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

// Stock types
export interface StockLevel {
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
  lastCountDate: string | null;
  updatedAt: string;
}

// Warehouse types
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Supplier types
export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Purchase Order types (removed duplicate)

// Transfer types
export interface Transfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouseName?: string;
  toWarehouseId: string;
  toWarehouseName?: string;
  status: 'DRAFT' | 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  requestDate: string;
  shippedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Reorder Alert types
export interface ReorderAlert {
  productId: string;
  productSku: string;
  productName: string;
  minStock: number;
  currentStock: number;
  deficit: number;
}

// Purchase Order types
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName?: string;
  warehouseId: string;
  warehouseName?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  orderDate: string;
  expectedDate: string | null;
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems?: PurchaseOrderLineItem[];
}

export interface PurchaseOrderLineItem {
  id: string;
  productId: string;
  productSku?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
  lineTotal: number;
  pendingQuantity: number;
  completionPercentage: number;
}

export interface CreatePurchaseOrderDTO {
  supplierId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  lineItems: CreateLineItemDTO[];
  notes?: string;
}

export interface CreateLineItemDTO {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateReceptionDTO {
  purchaseOrderId: string;
  receivedDate: string;
  receivedBy: string;
  items: ReceptionItemDTO[];
  notes?: string;
}

export interface ReceptionItemDTO {
  lineItemId: string;
  receivedQuantity: number;
  locationId: string;
  batchNumber?: string;
  expirationDate?: string;
  notes?: string;
}

// Movement types
export interface Movement {
  id: string;
  type: 'RECEIPT' | 'SHIPMENT' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'RESERVATION' | 'RELEASE' | 'DAMAGE';
  productId: string;
  productSku?: string;
  productName?: string;
  locationId: string;
  locationCode?: string;
  warehouseId?: string;
  warehouseName?: string;
  quantity: number;
  fromStatus?: string | null;
  toStatus?: string | null;
  date: string;
  userId: string;
  userEmail?: string;
  reason?: string | null;
  runningBalance: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalWarehouses: number;
  activeWarehouses: number;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  lowStockCount: number;
  pendingPurchaseOrders: number;
  recentMovements: number;
}

// Warehouse Summary
export interface WarehouseSummary {
  warehouseId: string;
  warehouseName: string;
  totalAvailable: number;
  totalReserved: number;
  totalDamaged: number;
  totalStock: number;
  productCount: number;
  locationCount: number;
}
