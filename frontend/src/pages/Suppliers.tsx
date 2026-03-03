import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import api, { getErrorMessage } from '../services/api';
import type { Supplier, ApiResponse } from '../types';

export const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<Supplier[]>>('/suppliers');
      setSuppliers(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={fetchSuppliers} />;

  const columns = [
    { header: 'Código', accessor: 'code' as keyof Supplier },
    { header: 'Nombre', accessor: 'name' as keyof Supplier },
    { header: 'Contacto', accessor: 'contactName' as keyof Supplier },
    { header: 'Email', accessor: 'email' as keyof Supplier },
    { header: 'Teléfono', accessor: 'phone' as keyof Supplier },
    { 
      header: 'Estado', 
      accessor: (row: Supplier) => (
        <span className={`badge ${row.isActive ? 'badge-success' : 'badge-danger'}`}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
  ];

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <h1>Proveedores</h1>
        <Button variant="primary">+ Nuevo Proveedor</Button>
      </div>

      <Card>
        <Table 
          columns={columns} 
          data={suppliers}
          onRowClick={(supplier) => console.log('Ver proveedor:', supplier)}
        />
      </Card>
    </div>
  );
};
