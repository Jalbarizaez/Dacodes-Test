import { Category, Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { CategoryFilters, CategoryWithRelations } from './category.types.js';

/**
 * Category Repository
 */
export class CategoryRepository {
  /**
   * Find category by ID
   */
  async findById(id: string, includeRelations: boolean = true): Promise<CategoryWithRelations | null> {
    return prisma.category.findUnique({
      where: { id },
      include: includeRelations ? {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
          where: {
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      } : undefined,
    });
  }

  /**
   * Find category by name
   */
  async findByName(name: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { name },
    });
  }

  /**
   * Find all categories with filters
   */
  async findAll(filters: CategoryFilters = {}): Promise<CategoryWithRelations[]> {
    const where: Prisma.CategoryWhereInput = {};

    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.category.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
          where: {
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Create category
   */
  async create(data: {
    name: string;
    description?: string;
    parentId?: string;
  }): Promise<Category> {
    return prisma.category.create({
      data,
    });
  }

  /**
   * Update category
   */
  async update(id: string, data: {
    name?: string;
    description?: string;
    parentId?: string;
    isActive?: boolean;
  }): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete category (soft delete by setting isActive = false)
   */
  async delete(id: string): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Check if category has products
   */
  async hasProducts(id: string): Promise<boolean> {
    const count = await prisma.product.count({
      where: { categoryId: id },
    });
    return count > 0;
  }

  /**
   * Check if category has children
   */
  async hasChildren(id: string): Promise<boolean> {
    const count = await prisma.category.count({
      where: { parentId: id, isActive: true },
    });
    return count > 0;
  }
}
