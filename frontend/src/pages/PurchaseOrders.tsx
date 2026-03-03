import { useState } from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { Modal } from '../components/Modal';
import { PurchaseOrderForm } from '../components/PurchaseOrderForm';
import { PurchaseOrderDetail } from '../components/PurchaseOrderDetail';
import { ReceptionForm } from '../components/ReceptionForm';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import { useProducts } from '../hooks/useProducts';
import { useSuppliers } from '../hooks/useSuppliers';
import { useWarehouses } from '../hooks/useWarehouses';
import { useLocations } from '../hooks/useLocations';
import { getErrorMessage } from '../services/api';
import type { PurchaseOrder, CreatePurchaseOrderDTO, CreateReceptionDTO } from '../types';

type ModalMode = 'create' | 'detail' | 'receive' | null;

export const PurchaseOrders = () => {
  const { orders, loading, error, refetch, createOrder, getOrderById, createReception } = usePurchaseOrders();
  const { products, loading: loadingProducts } = useProducts();
  const { suppliers, loading: loadingSuppliers } = useSuppliers();
  const { warehouses, loading: loadingWarehouses } = useWarehouses();
  
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Get locations for selected order's warehouse
  const { locations } = useLocations(selectedOrder?.warehouseId);

  if (loading || loadingProducts || loadingSuppliers || loadingWarehouses) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedOrder(null);
    setModalMode('create');
    setFormError(null);
  };

  const handleDetail = async (order: PurchaseOrder) => {
    try {
      setFormLoading(true);
      const fullOrder = await getOrderById(order.id);
      setSelectedOrder(fullOrder);
      setModalMode('detail');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleReceive = () => {
    setModalMode('receive');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedOrder(null);
    setFormError(null);
  };

  const handleSubmitOrder = async (data: CreatePurchaseOrderDTO) => {
    try {
      setFormLoading(true);
      setFormError(null);
      await createOrder(data);
      handleCloseModal();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitReception = async (data: CreateReceptionDTO) => {
    try {
      setFormLoading(true);
      setFormError(null);
      await createReception(data);
      handleCloseModal();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      DRAFT: { label: 'Borrador', class: 'badge-secondary' },
      SUBMITTED: { label: 'Enviada', class: 'badge-warning' },
      PARTIALLY_RECEIVED: { label: 'Parcial', class: 'badge-info' },
      RECEIVED: { label: 'Recibida', class: 'badge-success' },
      CANCELLED: { label: 'Cancelada', class: 'badge-danger' },
    };
    const config = statusMap[status] || { label: status, class: 'badge-secondary' };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX');
  };

  const columns = [
    { header: 'Número', accessor: 'orderNumber' as keyof PurchaseOrder },
    { header: 'Proveedor', accessor: 'supplierName' as keyof PurchaseOrder },
    { 
      header: 'Fecha', 
      accessor: (row: PurchaseOrder) => formatDate(row.orderDate)
    },
    { 
      header: 'Fecha Esperada', 
      accessor: (row: PurchaseOrder) => row.expectedDate ? formatDate(row.expectedDate) : '-'
    },
    { 
      header: 'Total', 
      accessor: (row: PurchaseOrder) => formatCurrency(row.totalAmount)
    },
    { 
      header: 'Estado', 
      accessor: (row: PurchaseOrder) => getStatusBadge(row.status)
    },
    {
      header: 'Acciones',
      accessor: (row: PurchaseOrder) => (
        <div className="table-actions">
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDetail(row);
            }}
            title="Ver detalle"
          >
            👁️
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="purchase-orders-page">
      <div className="page-header">
        <h1>Órdenes de Compra</h1>
        <Button variant="primary" onClick={handleCreate}>
          + Nueva Orden
        </Button>
      </div>

      <Card>
        <div className="filters">
          <div className="filter-row">
            <input
              type="text"
              placeholder="Buscar por número de orden o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
              style={{ maxWidth: '200px' }}
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="SUBMITTED">Enviada</option>
              <option value="PARTIALLY_RECEIVED">Parcialmente Recibida</option>
              <option value="RECEIVED">Recibida</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>

          <div className="filter-info">
            Mostrando {filteredOrders.length} de {orders.length} órdenes
          </div>
        </div>

        <Table 
          columns={columns} 
          data={filteredOrders}
          onRowClick={handleDetail}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={modalMode === 'create'}
        onClose={handleCloseModal}
        title="Nueva Orden de Compra"
        size="large"
      >
        {formError && <div className="form-error">{formError}</div>}
        <PurchaseOrderForm
          products={products}
          suppliers={suppliers}
          warehouses={warehouses}
          onSubmit={handleSubmitOrder}
          onCancel={handleCloseModal}
          isLoading={formLoading}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={modalMode === 'detail'}
        onClose={handleCloseModal}
        title="Detalle de Orden de Compra"
        size="large"
      >
        {formLoading ? (
          <Loading />
        ) : selectedOrder ? (
          <PurchaseOrderDetail
            order={selectedOrder}
            onReceive={handleReceive}
            onClose={handleCloseModal}
          />
        ) : null}
      </Modal>

      {/* Reception Modal */}
      <Modal
        isOpen={modalMode === 'receive'}
        onClose={handleCloseModal}
        title="Registrar Recepción"
        size="large"
      >
        {formError && <div className="form-error">{formError}</div>}
        {selectedOrder && (
          <ReceptionForm
            order={selectedOrder}
            locations={locations}
            onSubmit={handleSubmitReception}
            onCancel={handleCloseModal}
            isLoading={formLoading}
          />
        )}
      </Modal>
    </div>
  );
};
