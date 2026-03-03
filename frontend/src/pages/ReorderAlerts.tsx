import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import api, { getErrorMessage } from '../services/api';
import type { ReorderAlert, ApiResponse } from '../types';

export const ReorderAlerts = () => {
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<ReorderAlert[]>>('/reorder/alerts');
      setAlerts(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAlerts} />;

  const columns = [
    { header: 'SKU', accessor: 'productSku' as keyof ReorderAlert },
    { header: 'Producto', accessor: 'productName' as keyof ReorderAlert },
    { 
      header: 'Stock Actual', 
      accessor: (row: ReorderAlert) => (
        <span className="stock-value alert">{row.currentStock}</span>
      )
    },
    { 
      header: 'Stock Mínimo', 
      accessor: (row: ReorderAlert) => (
        <span className="stock-value">{row.minStock}</span>
      )
    },
    { 
      header: 'Déficit', 
      accessor: (row: ReorderAlert) => (
        <span className="stock-value deficit">{row.deficit}</span>
      )
    },
  ];

  return (
    <div className="reorder-alerts-page">
      <div className="page-header">
        <h1>Alertas de Reorden</h1>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <div className="empty-state">
            <p>✅ No hay productos bajo el stock mínimo</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="alert-banner">
            ⚠️ Hay {alerts.length} producto(s) que requieren reorden
          </div>
          <Table columns={columns} data={alerts} />
        </Card>
      )}
    </div>
  );
};
