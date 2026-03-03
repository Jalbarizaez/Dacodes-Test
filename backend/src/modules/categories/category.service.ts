import { Category } from '@prisma/client';
import { CategoryRepository } from './category.repository.js';
import { CreateCategoryDTO, UpdateCategoryDTO, CategoryFilters, CategoryWithRelations } from './category.types.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { HttpStatus } from '../../shared/types/index.js';

/**
 * Category Service
 */
export class CategoryService {
  private repository: CategoryRepository;

  constructor() {
    this.repository = new CategoryRepository();
  }

  /**
   * Get all categories
   */
  async getAllCategories(filters: CategoryFilters = {}): Promise<CategoryWithRelations[]> {
    return this.repository.findAll(filters);
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<CategoryWithRelations> {
    const category = await this.repository.findById(id);
    
    if (!category) {
      throw new AppError('CATEGORY_NOT_FOUND', 'Category not found', HttpStatus.NOT_FOUND);
    }

    return category;
  }

  /**
   * Create category
   */
  async createCategory(data: CreateCategoryDTO): Promise<Category> {
    // Check if category name already exists
    const existing = await this.repository.findByName(data.name);
    if (existing) {
      throw new AppError(
        'CATEGORY_NAME_EXISTS',
        'Category name already exists',
        HttpStatus.CONFLICT
      );
    }

    // If parentId is provided, verify it exists
    if (data.parentId) {
      const parent = await this.repository.findById(data.parentId, false);
      if (!parent) {
        throw new AppError(
          'PARENT_CATEGORY_NOT_FOUND',
          'Parent category not found',
          HttpStatus.NOT_FOUND
        );
      }
    }

    return this.repository.create(data);
  }

  /**
   * Update category
   */
  async updateCategory(id: string, data: UpdateCategoryDTO): Promise<Category> {
    // Verify category exists
    const category = await this.repository.findById(id, false);
    if (!category) {
      throw new AppError('CATEGORY_NOT_FOUND', 'Category not found', HttpStatus.NOT_FOUND);
    }

    // If updating name, check it doesn't conflict
    if (data.name && data.name !== category.name) {
      const existing = await this.repository.findByName(data.name);
      if (existing) {
        throw new AppError(
          'CATEGORY_NAME_EXISTS',
          'Category name already exists',
          HttpStatus.CONFLICT
        );
      }
    }

    // If updating parentId, verify it exists and prevent circular reference
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new AppError(
          'CIRCULAR_REFERENCE',
          'Category cannot be its own parent',
          HttpStatus.BAD_REQUEST
        );
      }

      if (data.parentId) {
        const parent = await this.repository.findById(data.parentId, false);
        if (!parent) {
          throw new AppError(
            'PARENT_CATEGORY_NOT_FOUND',
            'Parent category not found',
            HttpStatus.NOT_FOUND
          );
        }

        // Check if parent is a child of this category (prevent circular reference)
        if (parent.parentId === id) {
          throw new AppError(
            'CIRCULAR_REFERENCE',
            'Cannot set a child category as parent',
            HttpStatus.BAD_REQUEST
          );
        }
      }
    }

    return this.repository.update(id, data);
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<Category> {
    // Verify category exists
    const category = await this.repository.findById(id, false);
    if (!category) {
      throw new AppError('CATEGORY_NOT_FOUND', 'Category not found', HttpStatus.NOT_FOUND);
    }

    // Check if category has products
    const hasProducts = await this.repository.hasProducts(id);
    if (hasProducts) {
      throw new AppError(
        'CATEGORY_HAS_PRODUCTS',
        'Cannot delete category with products',
        HttpStatus.CONFLICT
      );
    }

    // Check if category has children
    const hasChildren = await this.repository.hasChildren(id);
    if (hasChildren) {
      throw new AppError(
        'CATEGORY_HAS_CHILDREN',
        'Cannot delete category with subcategories',
        HttpStatus.CONFLICT
      );
    }

    return this.repository.delete(id);
  }
}
