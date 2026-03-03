import { Warehouse, Location, Prisma } from '@prisma/client';
import { WarehouseRepository } from './warehouse.repository.js';
import {
  CreateWarehouseDTO,
  UpdateWarehouseDTO,
  WarehouseFilters,
  WarehouseWithRelations,
  CreateLocationDTO,
  UpdateLocationDTO,
  LocationFilters,
  LocationWithRelations,
} from './warehouse.types.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { HttpStatus } from '../../shared/types/index.js';
import { auditCreate, auditUpdate, createAuditSummary } from '../../shared/utils/audit.js';

/**
 * Warehouse Service
 * Contains business logic for warehouse and location operations
 */
export class WarehouseService {
  private repository: WarehouseRepository;

  constructor() {
    this.repository = new WarehouseRepository();
  }

  // ============================================================================
  // WAREHOUSE OPERATIONS
  // ============================================================================

  /**
   * Create a new warehouse
   */
  async createWarehouse(data: CreateWarehouseDTO): Promise<Warehouse> {
    const warehouse = await this.repository.createWarehouse(data);

    // Create a default location for the warehouse
    try {
      await this.repository.createLocation({
        warehouseId: warehouse.id,
        code: 'DEFAULT',
        name: 'Ubicación Principal',
        type: 'FLOOR',
      });
    } catch (error) {
      // Log error but don't fail warehouse creation
      console.error('Failed to create default location for warehouse:', error);
    }

    // Audit log
    auditCreate(
      'warehouse',
      warehouse.id,
      createAuditSummary(warehouse, ['id', 'name', 'code', 'isActive']),
      undefined,
      `Created warehouse ${warehouse.name}`
    ).catch(() => {});

    return warehouse;
  }

  /**
   * Get warehouse by ID
   */
  async getWarehouseById(id: string): Promise<WarehouseWithRelations> {
    const warehouse = await this.repository.findWarehouseById(id);

    if (!warehouse) {
      throw new AppError(
        'WAREHOUSE_NOT_FOUND',
        `Warehouse with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return warehouse;
  }

  /**
   * Get all warehouses with filters and pagination
   */
  async getAllWarehouses(
    filters: WarehouseFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ warehouses: WarehouseWithRelations[]; total: number }> {
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

    return await this.repository.findAllWarehouses(filters, page, pageSize, sortBy, sortOrder);
  }

  /**
   * Update warehouse
   */
  async updateWarehouse(id: string, data: UpdateWarehouseDTO): Promise<Warehouse> {
    try {
      const existingWarehouse = await this.repository.findWarehouseById(id);
      if (!existingWarehouse) {
        throw new AppError(
          'WAREHOUSE_NOT_FOUND',
          `Warehouse with ID '${id}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      const updatedWarehouse = await this.repository.updateWarehouse(id, data);

      // Audit log
      auditUpdate(
        'warehouse',
        id,
        createAuditSummary(existingWarehouse, ['name', 'code', 'address', 'isActive']),
        createAuditSummary(updatedWarehouse, ['name', 'code', 'address', 'isActive']),
        undefined,
        `Updated warehouse ${existingWarehouse.name}`
      ).catch(() => {});

      return updatedWarehouse;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError(
            'WAREHOUSE_NOT_FOUND',
            `Warehouse with ID '${id}' not found`,
            HttpStatus.NOT_FOUND
          );
        }
      }

      throw error;
    }
  }

  /**
   * Deactivate warehouse (soft delete)
   */
  async deactivateWarehouse(id: string): Promise<Warehouse> {
    try {
      const existingWarehouse = await this.repository.findWarehouseById(id);
      if (!existingWarehouse) {
        throw new AppError(
          'WAREHOUSE_NOT_FOUND',
          `Warehouse with ID '${id}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      if (!existingWarehouse.isActive) {
        throw new AppError(
          'WAREHOUSE_ALREADY_INACTIVE',
          'Warehouse is already inactive',
          HttpStatus.BAD_REQUEST
        );
      }

      const hasActiveLocations = await this.repository.hasActiveLocations(id);
      if (hasActiveLocations) {
        throw new AppError(
          'WAREHOUSE_HAS_ACTIVE_LOCATIONS',
          'Cannot deactivate warehouse with active locations. Please deactivate all locations first.',
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }

      return await this.repository.softDeleteWarehouse(id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError(
            'WAREHOUSE_NOT_FOUND',
            `Warehouse with ID '${id}' not found`,
            HttpStatus.NOT_FOUND
          );
        }
      }

      throw error;
    }
  }

  // ============================================================================
  // LOCATION OPERATIONS
  // ============================================================================

  /**
   * Create a new location
   */
  async createLocation(data: CreateLocationDTO): Promise<Location> {
    try {
      // Check if warehouse exists
      const warehouse = await this.repository.findWarehouseById(data.warehouseId);
      if (!warehouse) {
        throw new AppError(
          'WAREHOUSE_NOT_FOUND',
          `Warehouse with ID '${data.warehouseId}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      // Check if warehouse is active
      if (!warehouse.isActive) {
        throw new AppError(
          'WAREHOUSE_INACTIVE',
          'Cannot create location in inactive warehouse',
          HttpStatus.BAD_REQUEST
        );
      }

      // Check if location code already exists in this warehouse
      const codeExists = await this.repository.locationCodeExists(
        data.warehouseId,
        data.code
      );
      if (codeExists) {
        throw new AppError(
          'DUPLICATE_LOCATION_CODE',
          `Location with code '${data.code}' already exists in this warehouse`,
          HttpStatus.CONFLICT
        );
      }

      const location = await this.repository.createLocation(data);

      // Audit log
      auditCreate(
        'location',
        location.id,
        createAuditSummary(location, ['id', 'code', 'warehouseId', 'type', 'isActive']),
        undefined,
        `Created location ${location.code} in warehouse ${data.warehouseId}`
      ).catch(() => {});

      return location;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new AppError(
            'WAREHOUSE_NOT_FOUND',
            'Warehouse does not exist',
            HttpStatus.BAD_REQUEST
          );
        }
      }

      throw error;
    }
  }

  /**
   * Get location by ID
   */
  async getLocationById(id: string): Promise<LocationWithRelations> {
    const location = await this.repository.findLocationById(id);

    if (!location) {
      throw new AppError(
        'LOCATION_NOT_FOUND',
        `Location with ID '${id}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return location;
  }

  /**
   * Get all locations with filters and pagination
   */
  async getAllLocations(
    filters: LocationFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'code',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ locations: LocationWithRelations[]; total: number }> {
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

    return await this.repository.findAllLocations(filters, page, pageSize, sortBy, sortOrder);
  }

  /**
   * Get locations by warehouse
   */
  async getLocationsByWarehouse(warehouseId: string): Promise<LocationWithRelations[]> {
    // Verify warehouse exists
    const warehouse = await this.repository.findWarehouseById(warehouseId);
    if (!warehouse) {
      throw new AppError(
        'WAREHOUSE_NOT_FOUND',
        `Warehouse with ID '${warehouseId}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    const locations = await this.repository.findLocationsByWarehouse(warehouseId);

    // If warehouse has no locations, create a default one
    if (locations.length === 0) {
      try {
        const defaultLocation = await this.repository.createLocation({
          warehouseId: warehouseId,
          code: 'DEFAULT',
          name: 'Ubicación Principal',
          type: 'FLOOR',
        });

        // Return the newly created location with warehouse info
        return await this.repository.findLocationsByWarehouse(warehouseId);
      } catch (error) {
        console.error('Failed to create default location:', error);
        // Return empty array if creation fails
        return [];
      }
    }

    return locations;
  }

  /**
   * Update location
   */
  async updateLocation(id: string, data: UpdateLocationDTO): Promise<Location> {
    try {
      const existingLocation = await this.repository.findLocationById(id);
      if (!existingLocation) {
        throw new AppError(
          'LOCATION_NOT_FOUND',
          `Location with ID '${id}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      // If code is being updated, check if it already exists
      if (data.code) {
        const codeExists = await this.repository.locationCodeExists(
          existingLocation.warehouseId,
          data.code,
          id
        );
        if (codeExists) {
          throw new AppError(
            'DUPLICATE_LOCATION_CODE',
            `Location with code '${data.code}' already exists in this warehouse`,
            HttpStatus.CONFLICT
          );
        }
      }

      const updatedLocation = await this.repository.updateLocation(id, data);

      // Audit log
      auditUpdate(
        'location',
        id,
        createAuditSummary(existingLocation, ['code', 'type', 'capacity', 'isActive']),
        createAuditSummary(updatedLocation, ['code', 'type', 'capacity', 'isActive']),
        undefined,
        `Updated location ${existingLocation.code}`
      ).catch(() => {});

      return updatedLocation;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError(
            'LOCATION_NOT_FOUND',
            `Location with ID '${id}' not found`,
            HttpStatus.NOT_FOUND
          );
        }
      }

      throw error;
    }
  }

  /**
   * Deactivate location (soft delete)
   */
  async deactivateLocation(id: string): Promise<Location> {
    try {
      const existingLocation = await this.repository.findLocationById(id);
      if (!existingLocation) {
        throw new AppError(
          'LOCATION_NOT_FOUND',
          `Location with ID '${id}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      if (!existingLocation.isActive) {
        throw new AppError(
          'LOCATION_ALREADY_INACTIVE',
          'Location is already inactive',
          HttpStatus.BAD_REQUEST
        );
      }

      const hasStock = await this.repository.hasStock(id);
      if (hasStock) {
        throw new AppError(
          'LOCATION_HAS_STOCK',
          'Cannot deactivate location with existing stock. Please transfer or adjust stock first.',
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }

      return await this.repository.softDeleteLocation(id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError(
            'LOCATION_NOT_FOUND',
            `Location with ID '${id}' not found`,
            HttpStatus.NOT_FOUND
          );
        }
      }

      throw error;
    }
  }
}
