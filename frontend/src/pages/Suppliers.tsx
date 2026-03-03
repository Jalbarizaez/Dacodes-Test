import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { Modal } from '../components/Modal';
import api, { getErrorMessage } from '../services/api';
import type { Supplier, ApiResponse } from '../types';

interface SupplierFormData {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
}

export const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: '',
    leadTimeDays: 0,
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('El nombre del proveedor es requerido');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      await api.post('/suppliers', formData);
      
      setShowModal(false);
      setFormData({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        paymentTerms: '',
        leadTimeDays: 0,
      });
      
      await fetchSuppliers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'leadTimeDays' ? Number(value) : value
    }));
  };

  if (loading) return <Loading />;
  if (error && !showModal) return <ErrorMessage message={error} onRetry={fetchSuppliers} />;

  const columns = [
    { header: 'Nombre', accessor: 'name' as keyof Supplier },
    { header: 'Contacto', accessor: 'contactName' as keyof Supplier },
    { header: 'Email', accessor: 'email' as keyof Supplier },
    { header: 'Teléfono', accessor: 'phone' as keyof Supplier },
    { 
      header: 'Días de Entrega', 
      accessor: 'leadTimeDays' as keyof Supplier 
    },
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
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Nuevo Proveedor
        </Button>
      </div>

      <Card>
        <Table 
          columns={columns} 
          data={suppliers}
          onRowClick={(supplier) => console.log('Ver proveedor:', supplier)}
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setError(null);
        }}
        title="Nuevo Proveedor"
      >
        <form onSubmit={handleSubmit} className="form">
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Nombre *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="form-control"
              placeholder="Nombre del proveedor"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactName">Nombre de Contacto</label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Persona de contacto"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-control"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Teléfono</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="form-control"
                placeholder="555-1234"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Dirección</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="form-control"
              rows={3}
              placeholder="Dirección completa"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="paymentTerms">Términos de Pago</label>
              <input
                type="text"
                id="paymentTerms"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Ej: 30 días"
              />
            </div>

            <div className="form-group">
              <label htmlFor="leadTimeDays">Días de Entrega</label>
              <input
                type="number"
                id="leadTimeDays"
                name="leadTimeDays"
                value={formData.leadTimeDays}
                onChange={handleInputChange}
                min="0"
                className="form-control"
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setError(null);
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
