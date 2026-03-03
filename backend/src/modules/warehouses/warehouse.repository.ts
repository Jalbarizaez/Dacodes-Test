import { Warehouse, Location, Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
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

/**
 * Warehouse Repository
 * Handles all database operations for warehouses and locations
 */
export class WarehouseRepository {
  // ============================================================================
  // WAREHOUSE OPERATIONS
  // ============================================================================

  /**
   * Create a new warehouse
   */
  async createWarehouse(data: CreateWarehouseDTO): Promise<Warehouse> {
    return prisma.warehouse.create({
      data: {
        name: data.name,
        address: data.address,
      },
    });
  }

  /**
   * Find warehouse by ID
   */
  async findWarehouseById(id: string): Promise<WarehouseWithRelations | null> {
    return prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            locations: true,
          },
        },
      },
    });
  }

  /**
   * Find all warehouses with filters and pagination
   */
  async findAllWarehouses(
    filters: WarehouseFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ warehouses: WarehouseWithRelations[]; total: number }> {
    const where: Prisma.WarehouseWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        include: {
          _count: {
            select: {
              locations: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.warehouse.count({ where }),
    ]);

    return { warehouses, total };
  }

  /**
   * Update warehouse
   */
  async updateWarehouse(id: string, data: UpdateWarehouseDTO): Promise<Warehouse> {
    return prisma.warehouse.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete warehouse
   */
  async softDeleteWarehouse(id: string): Promise<Warehouse> {
    return prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Check if warehouse has active locations
   */
  async hasActiveLocations(id: string): Promise<boolean> {
    const count = await prisma.location.count({
      where: {
        warehouseId: id,
        isActive: true,
      },
    });

    return count > 0;
  }

  // ============================================================================
  // LOCATION OPERATIONS
  // ============================================================================

  /**
   * Create a new location
   */
  async createLocation(data: CreateLocationDTO): Promise<Location> {
    return prisma.location.create({
      data: {
        warehouseId: data.warehouseId,
        code: data.code,
        name: data.name,
        type: data.type,
        capacity: data.capacity,
      },
    });
  }

  /**
   * Find location by ID
   */
  async findLocationById(id: string): Promise<LocationWithRelations | null> {
    return prisma.location.findUnique({
      where: { id },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            stockLevels: true,
          },
        },
      },
    });
  }

  /**
   * Find location by warehouse and code
   */
  async findLocationByCode(
    warehouseId: string,
    code: string
  ): Promise<Location | null> {
    return prisma.location.findUnique({
      where: {
        warehouseId_code: {
          warehouseId,
          code,
        },
      },
    });
  }

  /**
   * Find all locations with filters and pagination
   */
  async findAllLocations(
    filters: LocationFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'code',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ locations: LocationWithRelations[]; total: number }> {
    const where: Prisma.LocationWhereInput = {};

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              stockLevels: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.location.count({ where }),
    ]);

    return { locations, total };
  }

  /**
   * Find locations by warehouse
   */
  async findLocationsByWarehouse(warehouseId: string): Promise<LocationWithRelations[]> {
    return prisma.location.findMany({
      where: { warehouseId },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            stockLevels: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Update location
   */
  async updateLocation(id: string, data: UpdateLocationDTO): Promise<Location> {
    return prisma.location.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete location
   */
  async softDeleteLocation(id: string): Promise<Location> {
    return prisma.location.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Check if location has stock
   */
  async hasStock(id: string): Promise<boolean> {
    const stockCount = await prisma.stockLevel.count({
      where: {
        locationId: id,
        quantityTotal: { gt: 0 },
      },
    });

    return stockCount > 0;
  }

  /**
   * Check if location code exists in warehouse (excluding a specific location ID)
   */
  async locationCodeExists(
    warehouseId: string,
    code: string,
    excludeId?: string
  ): Promise<boolean> {
    const where: Prisma.LocationWhereInput = {
      warehouseId,
      code,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.location.count({ where });
    return count > 0;
  }
}
