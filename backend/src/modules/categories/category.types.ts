import { Category } from '@prisma/client';

/**
 * Category DTOs and Types
 */

// Category with relations
export interface CategoryWithRelations extends Category {
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

// Create category DTO
export interface CreateCategoryDTO {
  name: string;
  description?: string;
  parentId?: string;
}

// Update category DTO
export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

// Category filters
export interface CategoryFilters {
  parentId?: string | null;
  isActive?: boolean;
  search?: string;
}
