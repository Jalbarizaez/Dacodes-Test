import { SupplierRepository } from './supplier.repository.js';
import {
  SupplierFilters,
  SupplierWithRelations,
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierStatistics,
} from './supplier.types.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { HttpStatus } from '../../shared/types/index.js';
import { auditCreate, auditUpdate, createAuditSummary } from '../../shared/utils/audit.js';

/**
 * Supplier Service
 * Contains business logic for supplier operations
 */
export class SupplierService {
  private repository: SupplierRepository;

  constructor() {
    this.repository = new SupplierRepository();
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(id: string, includeRelations: boolean = false): Promise<SupplierWithRelations> {
    const supplier = await this.repository.findById(id, includeRelations);

    if (!supplier) {
      throw new AppError(
        'SUPPLIER_NOT_FOUND',
        `Supplier with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return supplier;
  }

  /**
   * Get all suppliers with filters and pagination
   */
  async getAllSuppliers(
    filters: SupplierFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    includeRelations: boolean = false
  ): Promise<{ suppliers: SupplierWithRelations[]; total: number }> {
    if (page < 1) {
      throw new AppError('INVALID_PAGE', 'Page must be greater than 0', HttpStatus.BAD_REQUEST);
    }

    if (pageSize < 1 || pageSize > 100) {
      throw new AppError(
        'INVALID_PAGE_SIZE',
        'Page size must be between 1 and 100',
        HttpStatus.BAD_REQUEST
      );
    }

    return await this.repository.findAll(filters, page, pageSize, sortBy, sortOrder, includeRelations);
  }

  /**
   * Create a new supplier
   */
  async createSupplier(data: CreateSupplierDTO): Promise<SupplierWithRelations> {
    // Check if supplier with same name already exists
    const existingSupplier = await this.repository.findByName(data.name);

    if (existingSupplier) {
      throw new AppError(
        'SUPPLIER_NAME_EXISTS',
        `Supplier with name '${data.name}' already exists`,
        HttpStatus.CONFLICT
      );
    }

    // Validate email format if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new AppError(
          'INVALID_EMAIL',
          'Invalid email format',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    const supplier = await this.repository.create({
      name: data.name,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      paymentTerms: data.paymentTerms,
      leadTimeDays: data.leadTimeDays || 0,
    });

    // Audit log
    auditCreate(
      'supplier',
      supplier.id,
      createAuditSummary(supplier, ['id', 'name', 'contactName', 'email', 'isActive']),
      undefined,
      `Created supplier ${supplier.name}`
    ).catch(() => {});

    return await this.getSupplierById(supplier.id, true);
  }

  /**
   * Update supplier
   */
  async updateSupplier(id: string, data: UpdateSupplierDTO): Promise<SupplierWithRelations> {
    // Verify supplier exists
    const existingSupplier = await this.getSupplierById(id);

    // Check if new name conflicts with existing supplier
    if (data.name) {
      const supplierWithName = await this.repository.findByName(data.name);
      if (supplierWithName && supplierWithName.id !== id) {
        throw new AppError(
          'SUPPLIER_NAME_EXISTS',
          `Supplier with name '${data.name}' already exists`,
          HttpStatus.CONFLICT
        );
      }
    }

    // Validate email format if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new AppError(
          'INVALID_EMAIL',
          'Invalid email format',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    const updatedSupplier = await this.repository.update(id, data);

    // Audit log
    auditUpdate(
      'supplier',
      id,
      createAuditSummary(existingSupplier, ['name', 'contactName', 'email', 'phone', 'isActive']),
      createAuditSummary(updatedSupplier, ['name', 'contactName', 'email', 'phone', 'isActive']),
      undefined,
      `Updated supplier ${existingSupplier.name}`
    ).catch(() => {});

    return await this.getSupplierById(id, true);
  }

  /**
   * Deactivate supplier (soft delete)
   */
  async deactivateSupplier(id: string): Promise<SupplierWithRelations> {
    // Verify supplier exists
    const supplier = await this.getSupplierById(id);

    if (!supplier.isActive) {
      throw new AppError(
        'SUPPLIER_ALREADY_INACTIVE',
        'Supplier is already inactive',
        HttpStatus.BAD_REQUEST
      );
    }

    // Check if supplier has active purchase orders
    const hasActivePOs = await this.repository.hasActivePurchaseOrders(id);

    if (hasActivePOs) {
      throw new AppError(
        'SUPPLIER_HAS_ACTIVE_ORDERS',
        'Cannot deactivate supplier with active purchase orders',
        HttpStatus.BAD_REQUEST
      );
    }

    await this.repository.deactivate(id);

    // Audit log
    auditUpdate(
      'supplier',
      id,
      { isActive: true },
      { isActive: false },
      undefined,
      `Deactivated supplier ${supplier.name}`
    ).catch(() => {});

    return await this.getSupplierById(id, true);
  }

  /**
   * Activate supplier
   */
  async activateSupplier(id: string): Promise<SupplierWithRelations> {
    // Verify supplier exists
    const supplier = await this.getSupplierById(id);

    if (supplier.isActive) {
      throw new AppError(
        'SUPPLIER_ALREADY_ACTIVE',
        'Supplier is already active',
        HttpStatus.BAD_REQUEST
      );
    }

    await this.repository.activate(id);

    return await this.getSupplierById(id, true);
  }

  /**
   * Get supplier statistics (for future supplier scoring)
   */
  async getSupplierStatistics(id: string): Promise<SupplierStatistics> {
    // Verify supplier exists
    const supplier = await this.getSupplierById(id);

    const stats = await this.repository.getSupplierStatistics(id);

    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      totalPurchaseOrders: stats.totalPurchaseOrders,
      totalLots: stats.totalLots,
      // Placeholder for future metrics
      averageLeadTime: undefined,
      onTimeDeliveryRate: undefined,
      qualityScore: undefined,
      overallScore: undefined,
    };
  }

  /**
   * Get all active suppliers (for dropdowns)
   */
  async getActiveSuppliers(): Promise<SupplierWithRelations[]> {
    return await this.repository.findAllActive();
  }

  /**
   * Get active suppliers count
   */
  async getActiveCount(): Promise<number> {
    return await this.repository.getActiveCount();
  }
}
