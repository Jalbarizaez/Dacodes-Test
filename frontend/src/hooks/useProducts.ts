import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { Product, ApiResponse, CreateProductDTO } from '../types';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<Product[]>>('/products');
      setProducts(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (data: CreateProductDTO): Promise<Product> => {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    const newProduct = response.data.data;
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = async (id: string, data: Partial<CreateProductDTO>): Promise<Product> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    const updatedProduct = response.data.data;
    setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
    return updatedProduct;
  };

  const deleteProduct = async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: false } : p));
  };

  const getProductById = async (id: string): Promise<Product> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { 
    products, 
    loading, 
    error, 
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
  };
};
