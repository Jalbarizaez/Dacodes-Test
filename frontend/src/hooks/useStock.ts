import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { StockLevel, ApiResponse } from '../types';

interface UseStockOptions {
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  hasStock?: boolean;
}

export const useStock = (options: UseStockOptions = {}) => {
  const [stock, setStock] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStock = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (options.productId) params.append('productId', options.productId);
      if (options.warehouseId) params.append('warehouseId', options.warehouseId);
      if (options.locationId) params.append('locationId', options.locationId);
      if (options.hasStock !== undefined) params.append('hasStock', String(options.hasStock));
      
      const queryString = params.toString();
      const url = `/stock${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<ApiResponse<StockLevel[]>>(url);
      setStock(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createAdjustment = async (data: {
    productId: string;
    locationId: string;
    quantity: number;
    reason: string;
    notes?: string;
  }) => {
    try {
      setError(null);
      await api.post('/movements/adjust', data);
      await fetchStock(); // Refresh stock after adjustment
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [options.productId, options.warehouseId, options.locationId, options.hasStock]);

  return { stock, loading, error, refetch: fetchStock, createAdjustment };
};
