import { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { Modal } from '../components/Modal';
import { Select } from '../components/Select';
import { InventoryDetail } from '../components/InventoryDetail';
import { StockCard } from '../components/StockCard';
import { useStock } from '../hooks/useStock';
import { useProducts } from '../hooks/useProducts';
import { useWarehouses } from '../hooks/useWarehouses';
import { useLocations } from '../hooks/useLocations';
import { useStockUpdated, useMovementCreated } from '../hooks/useRealTimeEvents';
import type { StockLevel } from '../types';

export const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [showOnlyWithStock, setShowOnlyWithStock] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockLevel | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: '',
    warehouseId: '',
    locationId: '',
    quantity: 0,
    reason: '',
    notes: '',
  });
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { stock, loading, error, refetch, createAdjustment } = useStock({
    warehouseId: selectedWarehouse || undefined,
    productId: selectedProduct || undefined,
    hasStock: showOnlyWithStock || undefined,
  });
  
  const { products, loading: loadingProducts } = useProducts();
  const { warehouses, loading: loadingWarehouses } = useWarehouses();
  const { locations, loading: loadingLocations } = useLocations(adjustmentForm.warehouseId);

  // Real-time event handlers
  useStockUpdated((event) => {
    console.log('📊 Stock updated in inventory:', event.data);
    // Refresh stock data
    refetch();
  });

  useMovementCreated((event) => {
    console.log('📦 Movement created:', event.data);
    // Refresh stock data
    refetch();
  });

  // Filter stock (must be before early returns to avoid hook order issues)
  const filteredStock = useMemo(() => {
    return stock.filter(item =>
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productSku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.locationCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stock, searchTerm]);

  // Calculate totals (must be before early returns to avoid hook order issues)
  const totals = useMemo(() => {
    return filteredStock.reduce(
      (acc, item) => ({
        total: acc.total + item.quantityTotal,
        available: acc.available + item.quantityAvailable,
        reserved: acc.reserved + item.quantityReserved,
        damaged: acc.damaged + item.quantityDamaged,
      }),
      { total: 0, available: 0, reserved: 0, damaged: 0 }
    );
  }, [filteredStock]);

  if (loading || loadingProducts || loadingWarehouses) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const handleDetail = (item: StockLevel) => {
    setSelectedStockItem(item);
  };

  const handleCloseModal = () => {
    setSelectedStockItem(null);
  };

  const handleOpenAdjustmentModal = () => {
    setShowAdjustmentModal(true);
    setAdjustmentError(null);
    setAdjustmentForm({
      productId: '',
      warehouseId: '',
      locationId: '',
      quantity: 0,
      reason: '',
      notes: '',
    });
  };

  const handleCloseAdjustmentModal = () => {
    setShowAdjustmentModal(false);
    setAdjustmentError(null);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustmentError(null);
    setIsSubmitting(true);

    try {
      await createAdjustment(adjustmentForm);
      handleCloseAdjustmentModal();
      refetch();
    } catch (err) {
      setAdjustmentError(err instanceof Error ? err.message : 'Error al crear el ajuste');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWarehouseChange = (warehouseId: string) => {
    setAdjustmentForm(prev => ({ ...prev, warehouseId, locationId: '' }));
  };

  const columns = [
    { 
      header: 'SKU', 
      accessor: (row: StockLevel) => (
        <div className="product-cell">
          <strong>{row.productSku}</strong>
        </div>
      )
    },
    { 
      header: 'Producto', 
      accessor: (row: StockLevel) => (
        <div className="product-cell">
          <span className="product-name">{row.productName}</span>
        </div>
      )
    },
    { 
      header: 'Almacén', 
      accessor: (row: StockLevel) => (
        <div className="location-cell">
          <strong>{row.warehouseName}</strong>
        </div>
      )
    },
    { 
      header: 'Ubicación', 
      accessor: (row: StockLevel) => (
        <div className="location-cell">
          <span>{row.locationCode}</span>
          {row.locationName && <span className="location-name">{row.locationName}</span>}
        </div>
      )
    },
    { 
      header: 'Disponible', 
      accessor: (row: StockLevel) => (
        <span className="stock-value available">{row.quantityAvailable.toLocaleString('es-MX')}</span>
      )
    },
    { 
      header: 'Reservado', 
      accessor: (row: StockLevel) => (
        <span className="stock-value reserved">{row.quantityReserved.toLocaleString('es-MX')}</span>
      )
    },
    { 
      header: 'Dañado', 
      accessor: (row: StockLevel) => (
        <span className="stock-value damaged">{row.quantityDamaged.toLocaleString('es-MX')}</span>
      )
    },
    { 
      header: 'Total', 
      accessor: (row: StockLevel) => (
        <span className="stock-value total"><strong>{row.quantityTotal.toLocaleString('es-MX')}</strong></span>
      )
    },
    {
      header: 'Acciones',
      accessor: (row: StockLevel) => (
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
    <div className="inventory-page">
      <div className="page-header">
        <h1>Inventario</h1>
        <div className="header-actions">
          <button onClick={handleOpenAdjustmentModal} className="btn btn-primary">
            ➕ Ajustar Inventario
          </button>
          <button onClick={refetch} className="btn btn-secondary">
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="inventory-summary">
        <StockCard
          label="Total"
          value={totals.total}
          variant="total"
          icon="📦"
        />
        <StockCard
          label="Disponible"
          value={totals.available}
          variant="available"
          icon="✅"
        />
        <StockCard
          label="Reservado"
          value={totals.reserved}
          variant="reserved"
          icon="🔒"
        />
        <StockCard
          label="Dañado"
          value={totals.damaged}
          variant="damaged"
          icon="⚠️"
        />
      </div>

      <Card>
        {/* Filters */}
        <div className="inventory-filters">
          <div className="filter-row">
            <input
              type="text"
              placeholder="Buscar por producto, SKU, almacén o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-row">
            <Select
              label="Filtrar por Producto"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              options={products.map(p => ({
                value: p.id,
                label: `${p.sku} - ${p.name}`,
              }))}
            />

            <Select
              label="Filtrar por Almacén"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              options={warehouses.map(w => ({
                value: w.id,
                label: w.name,
              }))}
            />

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showOnlyWithStock}
                  onChange={(e) => setShowOnlyWithStock(e.target.checked)}
                />
                <span>Solo con stock</span>
              </label>
            </div>
          </div>

          <div className="filter-info">
            Mostrando {filteredStock.length} de {stock.length} ubicaciones
          </div>
        </div>

        {/* Table */}
        <Table 
          columns={columns} 
          data={filteredStock}
          onRowClick={handleDetail}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedStockItem}
        onClose={handleCloseModal}
        title="Detalle de Inventario"
        size="large"
      >
        {selectedStockItem && (
          <InventoryDetail
            stockItem={selectedStockItem}
            onClose={handleCloseModal}
          />
        )}
      </Modal>

      {/* Adjustment Modal */}
      <Modal
        isOpen={showAdjustmentModal}
        onClose={handleCloseAdjustmentModal}
        title="Ajustar Inventario"
        size="medium"
      >
        <form onSubmit={handleAdjustmentSubmit} className="adjustment-form">
          {adjustmentError && (
            <div className="error-message">{adjustmentError}</div>
          )}

          <div className="form-group">
            <label htmlFor="productId">Producto *</label>
            <select
              id="productId"
              value={adjustmentForm.productId}
              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, productId: e.target.value }))}
              required
              className="form-control"
            >
              <option value="">Seleccionar producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="warehouseId">Almacén *</label>
            <select
              id="warehouseId"
              value={adjustmentForm.warehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              required
              className="form-control"
            >
              <option value="">Seleccionar almacén...</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="locationId">Ubicación *</label>
            <select
              id="locationId"
              value={adjustmentForm.locationId}
              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, locationId: e.target.value }))}
              required
              className="form-control"
              disabled={loadingLocations || locations.length === 0}
            >
              <option value="">Seleccionar ubicación...</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>
                  {l.code} {l.name ? `- ${l.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Cantidad (+ para aumentar, - para disminuir) *</label>
            <input
              type="number"
              id="quantity"
              value={adjustmentForm.quantity}
              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
              required
              className="form-control"
              placeholder="Ej: 10 o -5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reason">Razón *</label>
            <select
              id="reason"
              value={adjustmentForm.reason}
              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
              required
              className="form-control"
            >
              <option value="">Seleccionar razón...</option>
              <option value="CONTEO_FISICO">Conteo físico</option>
              <option value="CORRECCION">Corrección de error</option>
              <option value="DANO">Daño o pérdida</option>
              <option value="VENCIMIENTO">Vencimiento</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas</label>
            <textarea
              id="notes"
              value={adjustmentForm.notes}
              onChange={(e) => setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
              className="form-control"
              rows={3}
              placeholder="Información adicional..."
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleCloseAdjustmentModal}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Ajuste'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
