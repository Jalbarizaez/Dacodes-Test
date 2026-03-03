import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { Warehouse, ApiResponse } from '../types';

interface CreateWarehouseDTO {
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export const useWarehouses = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<Warehouse[]>>('/warehouses');
      setWarehouses(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createWarehouse = async (data: CreateWarehouseDTO) => {
    const response = await api.post<ApiResponse<Warehouse>>('/warehouses', data);
    return response.data.data;
  };

  const updateWarehouse = async (id: string, data: Partial<CreateWarehouseDTO>) => {
    const response = await api.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, data);
    return response.data.data;
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  return { 
    warehouses, 
    loading, 
    error, 
    refetch: fetchWarehouses,
    createWarehouse,
    updateWarehouse,
  };
};
