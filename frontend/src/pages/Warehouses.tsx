import { useState } from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { Modal } from '../components/Modal';
import { useWarehouses } from '../hooks/useWarehouses';
import { getErrorMessage } from '../services/api';
import type { Warehouse } from '../types';

type ModalMode = 'create' | 'edit' | null;

interface WarehouseFormData {
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export const Warehouses = () => {
  const { warehouses, loading, error, refetch, createWarehouse, updateWarehouse } = useWarehouses();
  
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<WarehouseFormData>({
    code: '',
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const handleCreate = () => {
    setSelectedWarehouse(null);
    setFormData({
      code: '',
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    });
    setModalMode('create');
    setFormError(null);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormData({
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address || '',
      city: warehouse.city || '',
      state: warehouse.state || '',
      country: warehouse.country || '',
      postalCode: warehouse.postalCode || '',
    });
    setModalMode('edit');
    setFormError(null);
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedWarehouse(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setFormLoading(true);
      setFormError(null);

      if (modalMode === 'create') {
        await createWarehouse(formData);
      } else if (modalMode === 'edit' && selectedWarehouse) {
        await updateWarehouse(selectedWarehouse.id, formData);
      }

      handleCloseModal();
      refetch();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleChange = (field: keyof WarehouseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const columns = [
    { header: 'Código', accessor: 'code' as keyof Warehouse },
    { header: 'Nombre', accessor: 'name' as keyof Warehouse },
    { header: 'Ciudad', accessor: 'city' as keyof Warehouse },
    { header: 'Estado', accessor: 'state' as keyof Warehouse },
    { header: 'País', accessor: 'country' as keyof Warehouse },
    { 
      header: 'Estado', 
      accessor: (row: Warehouse) => (
        <span className={`badge ${row.isActive ? 'badge-success' : 'badge-danger'}`}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: (row: Warehouse) => (
        <div className="table-actions">
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Editar"
          >
            ✏️
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="warehouses-page">
      <div className="page-header">
        <h1>Almacenes</h1>
        <Button variant="primary" onClick={handleCreate}>+ Nuevo Almacén</Button>
      </div>

      <Card>
        <Table 
          columns={columns} 
          data={warehouses}
          onRowClick={handleEdit}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={handleCloseModal}
        title={modalMode === 'create' ? 'Crear Almacén' : 'Editar Almacén'}
        size="large"
      >
        {formError && (
          <div className="form-error">
            {formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="warehouse-form">
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Código *</label>
              <input
                type="text"
                className="input"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                disabled={!!selectedWarehouse || formLoading}
                required
                placeholder="WH-001"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Nombre *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={formLoading}
                required
                placeholder="Almacén Central"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Dirección</label>
              <input
                type="text"
                className="input"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                disabled={formLoading}
                placeholder="Calle Principal 123"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Ciudad</label>
              <input
                type="text"
                className="input"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={formLoading}
                placeholder="Ciudad de México"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Estado</label>
              <input
                type="text"
                className="input"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                disabled={formLoading}
                placeholder="CDMX"
              />
            </div>

            <div className="input-group">
              <label className="input-label">País</label>
              <input
                type="text"
                className="input"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                disabled={formLoading}
                placeholder="México"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Código Postal</label>
              <input
                type="text"
                className="input"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                disabled={formLoading}
                placeholder="01000"
              />
            </div>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={handleCloseModal} disabled={formLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={formLoading}>
              {formLoading ? 'Guardando...' : selectedWarehouse ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
