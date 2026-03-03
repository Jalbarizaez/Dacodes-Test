import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { PurchaseOrder, CreatePurchaseOrderDTO, CreateReceptionDTO, ApiResponse } from '../types';

export const usePurchaseOrders = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<PurchaseOrder[]>>('/purchase-orders');
      setOrders(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (data: CreatePurchaseOrderDTO): Promise<PurchaseOrder> => {
    const response = await api.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data);
    const newOrder = response.data.data;
    setOrders(prev => [...prev, newOrder]);
    return newOrder;
  };

  const updateOrderStatus = async (id: string, status: string): Promise<PurchaseOrder> => {
    const response = await api.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/status`, { status });
    const updatedOrder = response.data.data;
    setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
    return updatedOrder;
  };

  const getOrderById = async (id: string): Promise<PurchaseOrder> => {
    const response = await api.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
    return response.data.data;
  };

  const createReception = async (data: CreateReceptionDTO): Promise<void> => {
    await api.post('/receptions', data);
    // Refresh orders to get updated status
    await fetchOrders();
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    createOrder,
    updateOrderStatus,
    getOrderById,
    createReception,
  };
};
