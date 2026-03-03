import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { useDashboard } from '../hooks/useDashboard';
import {
  useStockUpdated,
  useStockLow,
  usePurchaseOrderReceived,
  useReceptionCreated,
} from '../hooks/useRealTimeEvents';
import type { ReorderAlert, PurchaseOrder, Movement, WarehouseSummary } from '../types';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    stats, 
    lowStockAlerts, 
    pendingOrders, 
    recentMovements, 
    warehouseSummary,
    loading, 
    error, 
    refetch 
  } = useDashboard();

  // Real-time event handlers
  useStockUpdated((event) => {
    console.log('📊 Stock updated:', event.data);
    // Refresh dashboard data
    refetch();
  });

  useStockLow((event) => {
    console.log('⚠️ Low stock alert:', event.data);
    // Show notification or refresh alerts
    refetch();
  });

  usePurchaseOrderReceived((event) => {
    console.log('✅ Purchase order received:', event.data);
    // Refresh pending orders
    refetch();
  });

  useReceptionCreated((event) => {
    console.log('📦 Reception created:', event.data);
    // Refresh recent movements
    refetch();
  });

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!stats) return <ErrorMessage message="No se pudieron cargar los datos" onRetry={refetch} />;

  const formatNumber = (num: number) => num.toLocaleString('es-MX');
  const formatDate = (date: string) => new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      RECEIPT: 'Entrada',
      SHIPMENT: 'Salida',
      ADJUSTMENT: 'Ajuste',
      TRANSFER_IN: 'Transferencia Entrada',
      TRANSFER_OUT: 'Transferencia Salida',
      RESERVATION: 'Reserva',
      RELEASE: 'Liberación',
      DAMAGE: 'Daño',
    };
    return labels[type] || type;
  };

  const getMovementIcon = (type: string) => {
    const icons: Record<string, string> = {
      RECEIPT: '📥',
      SHIPMENT: '📤',
      ADJUSTMENT: '⚖️',
      TRANSFER_IN: '🔄',
      TRANSFER_OUT: '🔄',
      RESERVATION: '🔒',
      RELEASE: '🔓',
      DAMAGE: '⚠️',
    };
    return icons[type] || '📦';
  };

  const getOrderStatusBadge = (status: string) => {
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

  const getUrgencyBadge = (currentStock: number, minStock: number) => {
    const deficit = minStock - currentStock;
    const percentage = (deficit / minStock) * 100;
    
    if (currentStock <= 0) {
      return <span className="badge badge-danger">CRÍTICO</span>;
    } else if (percentage >= 75) {
      return <span className="badge badge-danger">ALTO</span>;
    } else if (percentage >= 50) {
      return <span className="badge badge-warning">MEDIO</span>;
    } else {
      return <span className="badge badge-info">BAJO</span>;
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={refetch} className="btn btn-secondary">
          🔄 Actualizar
        </button>
      </div>

      {/* KPIs Section */}
      <div className="dashboard-section">
        <h2 className="section-title">Indicadores Clave</h2>
        <div className="stats-grid">
          <StatCard
            title="Productos Activos"
            value={formatNumber(stats.activeProducts)}
            subtitle={`${stats.totalProducts} total`}
            icon="📦"
            variant="default"
            onClick={() => navigate('/products')}
          />
          <StatCard
            title="Stock Total"
            value={formatNumber(stats.totalStock)}
            subtitle={`${formatNumber(stats.availableStock)} disponible`}
            icon="📊"
            variant="info"
            onClick={() => navigate('/inventory')}
          />
          <StatCard
            title="Alertas de Stock Bajo"
            value={stats.lowStockCount}
            subtitle={stats.lowStockCount > 0 ? 'Requieren atención' : 'Todo en orden'}
            icon="⚠️"
            variant={stats.lowStockCount > 0 ? 'danger' : 'success'}
            onClick={() => navigate('/reorder-alerts')}
          />
          <StatCard
            title="Órdenes Pendientes"
            value={stats.pendingPurchaseOrders}
            subtitle="Por recibir"
            icon="🛒"
            variant={stats.pendingPurchaseOrders > 0 ? 'warning' : 'default'}
            onClick={() => navigate('/purchase-orders')}
          />
        </div>
      </div>

      {/* Stock Breakdown */}
      <div className="dashboard-section">
        <h2 className="section-title">Desglose de Inventario</h2>
        <div className="stats-grid-small">
          <StatCard
            title="Disponible"
            value={formatNumber(stats.availableStock)}
            icon="✅"
            variant="success"
          />
          <StatCard
            title="Reservado"
            value={formatNumber(stats.reservedStock)}
            icon="🔒"
            variant="warning"
          />
          <StatCard
            title="Dañado"
            value={formatNumber(stats.damagedStock)}
            icon="⚠️"
            variant="danger"
          />
          <StatCard
            title="Almacenes"
            value={stats.activeWarehouses}
            icon="🏢"
            variant="info"
          />
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Low Stock Alerts */}
        <Card title="🚨 Alertas de Stock Bajo">
          {lowStockAlerts.length === 0 ? (
            <EmptyState
              icon="✅"
              title="Sin alertas"
              description="Todos los productos tienen stock suficiente"
            />
          ) : (
            <div className="alert-list">
              {lowStockAlerts.slice(0, 5).map((alert: ReorderAlert) => (
                <div key={alert.productId} className="alert-item">
                  <div className="alert-info">
                    <div className="alert-product">
                      <strong>{alert.productSku}</strong> - {alert.productName}
                    </div>
                    <div className="alert-stats">
                      <span className="stock-current">
                        Stock: <strong>{alert.currentStock}</strong>
                      </span>
                      <span className="stock-min">
                        Mínimo: {alert.minStock}
                      </span>
                      <span className="stock-deficit">
                        Déficit: <strong className="text-danger">{alert.deficit}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="alert-urgency">
                    {getUrgencyBadge(alert.currentStock, alert.minStock)}
                  </div>
                </div>
              ))}
              {lowStockAlerts.length > 5 && (
                <button 
                  onClick={() => navigate('/reorder-alerts')}
                  className="btn-link"
                >
                  Ver todas las alertas ({lowStockAlerts.length})
                </button>
              )}
            </div>
          )}
        </Card>

        {/* Pending Purchase Orders */}
        <Card title="🛒 Órdenes de Compra Pendientes">
          {pendingOrders.length === 0 ? (
            <EmptyState
              icon="📋"
              title="Sin órdenes pendientes"
              description="No hay órdenes de compra por recibir"
            />
          ) : (
            <div className="order-list">
              {pendingOrders.slice(0, 5).map((order: PurchaseOrder) => (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <div className="order-header">
                      <strong>{order.orderNumber}</strong>
                      {getOrderStatusBadge(order.status)}
                    </div>
                    <div className="order-details">
                      <span>📦 {order.supplierName}</span>
                      <span>💰 ${parseFloat(order.totalAmount).toLocaleString('es-MX')}</span>
                    </div>
                    <div className="order-date">
                      Esperada: {formatDate(order.expectedDate || order.orderDate)}
                    </div>
                  </div>
                </div>
              ))}
              {pendingOrders.length > 5 && (
                <button 
                  onClick={() => navigate('/purchase-orders')}
                  className="btn-link"
                >
                  Ver todas las órdenes ({pendingOrders.length})
                </button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Movements */}
      <div className="dashboard-section">
        <Card title="📋 Movimientos Recientes">
          {recentMovements.length === 0 ? (
            <EmptyState
              icon="📦"
              title="Sin movimientos"
              description="No hay movimientos de inventario registrados"
            />
          ) : (
            <div className="movements-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th>Almacén</th>
                    <th>Cantidad</th>
                    <th>Balance</th>
                    <th>Fecha</th>
                    <th>Razón</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.map((movement: Movement) => (
                    <tr key={movement.id}>
                      <td>
                        <span className="movement-type">
                          {getMovementIcon(movement.type)} {getMovementTypeLabel(movement.type)}
                        </span>
                      </td>
                      <td>
                        <div className="product-cell">
                          <strong>{movement.productSku}</strong>
                          <span className="product-name">{movement.productName}</span>
                        </div>
                      </td>
                      <td>{movement.warehouseName}</td>
                      <td>
                        <span className={`quantity ${movement.quantity >= 0 ? 'positive' : 'negative'}`}>
                          {movement.quantity >= 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </td>
                      <td>
                        <strong>{movement.runningBalance}</strong>
                      </td>
                      <td className="date-cell">{formatDate(movement.date)}</td>
                      <td className="reason-cell">{movement.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Warehouse Summary */}
      <div className="dashboard-section">
        <Card title="🏢 Resumen por Almacén">
          {warehouseSummary.length === 0 ? (
            <EmptyState
              icon="🏢"
              title="Sin almacenes"
              description="No hay almacenes configurados"
            />
          ) : (
            <div className="warehouse-grid">
              {warehouseSummary.map((warehouse: WarehouseSummary) => (
                <div key={warehouse.warehouseId} className="warehouse-card">
                  <div className="warehouse-header">
                    <h3>{warehouse.warehouseName}</h3>
                    <span className="warehouse-badge">
                      {warehouse.productCount} productos
                    </span>
                  </div>
                  <div className="warehouse-stats">
                    <div className="warehouse-stat">
                      <span className="stat-label">Total</span>
                      <span className="stat-value">{formatNumber(warehouse.totalStock)}</span>
                    </div>
                    <div className="warehouse-stat success">
                      <span className="stat-label">Disponible</span>
                      <span className="stat-value">{formatNumber(warehouse.totalAvailable)}</span>
                    </div>
                    <div className="warehouse-stat warning">
                      <span className="stat-label">Reservado</span>
                      <span className="stat-value">{formatNumber(warehouse.totalReserved)}</span>
                    </div>
                    <div className="warehouse-stat danger">
                      <span className="stat-label">Dañado</span>
                      <span className="stat-value">{formatNumber(warehouse.totalDamaged)}</span>
                    </div>
                  </div>
                  <div className="warehouse-footer">
                    <span>{warehouse.locationCount} ubicaciones</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* AI Insights Section (Prepared for future) */}
      <div className="dashboard-section">
        <Card title="🤖 Insights de IA (Próximamente)">
          <EmptyState
            icon="🚀"
            title="Análisis Inteligente en Desarrollo"
            description="Pronto tendrás predicciones de demanda, recomendaciones de reorden automático y optimización de inventario impulsada por IA"
          />
        </Card>
      </div>
    </div>
  );
};
