import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Category, CreateCategoryDTO, UpdateCategoryDTO, ApiResponse } from '../types';

interface UseCategoriesOptions {
  parentId?: string | null;
  isActive?: boolean;
  search?: string;
  autoFetch?: boolean;
}

export const useCategories = (options: UseCategoriesOptions = {}) => {
  const { parentId, isActive, search, autoFetch = true } = options;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (parentId !== undefined) params.append('parentId', parentId || 'null');
      if (isActive !== undefined) params.append('isActive', String(isActive));
      if (search) params.append('search', search);

      const response = await api.get<ApiResponse<Category[]>>(
        `/categories?${params.toString()}`
      );
      setCategories(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (data: CreateCategoryDTO): Promise<Category | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post<ApiResponse<Category>>('/categories', data);
      const newCategory = response.data.data;
      
      // Add to local state
      setCategories((prev) => [...prev, newCategory]);
      
      return newCategory;
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create category');
      console.error('Error creating category:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: string, data: UpdateCategoryDTO): Promise<Category | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
      const updatedCategory = response.data.data;
      
      // Update local state
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? updatedCategory : cat))
      );
      
      return updatedCategory;
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update category');
      console.error('Error updating category:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await api.delete(`/categories/${id}`);
      
      // Remove from local state
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete category');
      console.error('Error deleting category:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchCategories();
    }
  }, [parentId, isActive, search, autoFetch]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
