import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import api, { getErrorMessage } from '../services/api';
import type { Transfer, ApiResponse } from '../types';

export const Transfers = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<Transfer[]>>('/transfers');
      setTransfers(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={fetchTransfers} />;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      DRAFT: 'badge-secondary',
      PENDING: 'badge-warning',
      IN_TRANSIT: 'badge-info',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
    };
    return statusMap[status] || 'badge-secondary';
  };

  const columns = [
    { header: 'Número', accessor: 'transferNumber' as keyof Transfer },
    { header: 'Origen', accessor: 'fromWarehouseName' as keyof Transfer },
    { header: 'Destino', accessor: 'toWarehouseName' as keyof Transfer },
    { 
      header: 'Fecha Solicitud', 
      accessor: (row: Transfer) => new Date(row.requestDate).toLocaleDateString()
    },
    { 
      header: 'Estado', 
      accessor: (row: Transfer) => (
        <span className={`badge ${getStatusBadge(row.status)}`}>
          {row.status}
        </span>
      )
    },
  ];

  return (
    <div className="transfers-page">
      <div className="page-header">
        <h1>Transferencias</h1>
        <Button variant="primary">+ Nueva Transferencia</Button>
      </div>

      <Card>
        <Table 
          columns={columns} 
          data={transfers}
          onRowClick={(transfer) => console.log('Ver transferencia:', transfer)}
        />
      </Card>
    </div>
  );
};
