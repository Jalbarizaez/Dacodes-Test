import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { ApiResponse } from '../types';

export interface Location {
  id: string;
  code: string;
  name: string | null;
  warehouseId: string;
  warehouseName?: string;
  isActive: boolean;
}

export const useLocations = (warehouseId?: string) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    if (!warehouseId) {
      setLocations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const url = `/warehouses/${warehouseId}/locations`;
      const response = await api.get<ApiResponse<Location[]>>(url);
      setLocations(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [warehouseId]);

  return { locations, loading, error, refetch: fetchLocations };
};
