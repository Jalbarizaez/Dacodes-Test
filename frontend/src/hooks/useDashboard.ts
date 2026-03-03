import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { 
  DashboardStats, 
  ReorderAlert, 
  PurchaseOrder, 
  Movement,
  WarehouseSummary,
  ApiResponse 
} from '../types';

interface DashboardData {
  stats: DashboardStats | null;
  lowStockAlerts: ReorderAlert[];
  pendingOrders: PurchaseOrder[];
  recentMovements: Movement[];
  warehouseSummary: WarehouseSummary[];
}

export const useDashboard = () => {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    lowStockAlerts: [],
    pendingOrders: [],
    recentMovements: [],
    warehouseSummary: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        productsRes,
        warehousesRes,
        stockRes,
        lowStockRes,
        ordersRes,
        movementsRes,
      ] = await Promise.all([
        api.get<ApiResponse>('/products'),
        api.get<ApiResponse>('/warehouses'),
        api.get<ApiResponse>('/stock'),
        api.get<ApiResponse>('/stock/alerts/low-stock'),
        api.get<ApiResponse>('/purchase-orders?status=SUBMITTED&status=PARTIALLY_RECEIVED'),
        api.get<ApiResponse>('/movements?limit=10'),
      ]);

      const products = productsRes.data.data || [];
      const warehouses = warehousesRes.data.data || [];
      const stock = stockRes.data.data || [];
      const lowStock = lowStockRes.data.data || [];
      const orders = ordersRes.data.data || [];
      const movements = movementsRes.data.data || [];

      // Calculate stats
      const activeProducts = products.filter((p: any) => p.isActive).length;
      const activeWarehouses = warehouses.filter((w: any) => w.isActive).length;
      
      const totalStock = stock.reduce((sum: number, item: any) => sum + item.quantityTotal, 0);
      const availableStock = stock.reduce((sum: number, item: any) => sum + item.quantityAvailable, 0);
      const reservedStock = stock.reduce((sum: number, item: any) => sum + item.quantityReserved, 0);
      const damagedStock = stock.reduce((sum: number, item: any) => sum + item.quantityDamaged, 0);

      // Group stock by warehouse
      const warehouseMap = new Map<string, WarehouseSummary>();
      stock.forEach((item: any) => {
        if (!item.warehouseId) return;
        
        const existing = warehouseMap.get(item.warehouseId);
        if (existing) {
          existing.totalAvailable += item.quantityAvailable;
          existing.totalReserved += item.quantityReserved;
          existing.totalDamaged += item.quantityDamaged;
          existing.totalStock += item.quantityTotal;
          existing.productCount += 1;
        } else {
          warehouseMap.set(item.warehouseId, {
            warehouseId: item.warehouseId,
            warehouseName: item.warehouseName || 'Sin nombre',
            totalAvailable: item.quantityAvailable,
            totalReserved: item.quantityReserved,
            totalDamaged: item.quantityDamaged,
            totalStock: item.quantityTotal,
            productCount: 1,
            locationCount: 1,
          });
        }
      });

      const warehouseSummary = Array.from(warehouseMap.values());

      const stats: DashboardStats = {
        totalProducts: products.length,
        activeProducts,
        totalWarehouses: warehouses.length,
        activeWarehouses,
        totalStock,
        availableStock,
        reservedStock,
        damagedStock,
        lowStockCount: lowStock.length,
        pendingPurchaseOrders: orders.length,
        recentMovements: movements.length,
      };

      setData({
        stats,
        lowStockAlerts: lowStock,
        pendingOrders: orders,
        recentMovements: movements,
        warehouseSummary,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return { ...data, loading, error, refetch: fetchDashboardData };
};
