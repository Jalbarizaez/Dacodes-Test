import { Button } from './Button';
import type { PurchaseOrder } from '../types';

interface PurchaseOrderDetailProps {
  order: PurchaseOrder;
  onReceive?: () => void;
  onClose: () => void;
}

export const PurchaseOrderDetail = ({ order, onReceive, onClose }: PurchaseOrderDetailProps) => {
  const formatDate = (date: string) => new Date(date).toLocaleDateString('es-MX');
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      DRAFT: { label: 'Borrador', class: 'badge-secondary' },
      SUBMITTED: { label: 'Enviada', class: 'badge-warning' },
      PARTIALLY_RECEIVED: { label: 'Parcialmente Recibida', class: 'badge-info' },
      RECEIVED: { label: 'Recibida', class: 'badge-success' },
      CANCELLED: { label: 'Cancelada', class: 'badge-danger' },
    };
    const config = statusMap[status] || { label: status, class: 'badge-secondary' };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const canReceive = order.status === 'SUBMITTED' || order.status === 'PARTIALLY_RECEIVED';

  return (
    <div className="purchase-order-detail">
      <div className="detail-section">
        <h3>Información General</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Número de Orden:</span>
            <span className="detail-value"><strong>{order.orderNumber}</strong></span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Estado:</span>
            <span className="detail-value">{getStatusBadge(order.status)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Proveedor:</span>
            <span className="detail-value">{order.supplierName}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Fecha de Orden:</span>
            <span className="detail-value">{formatDate(order.orderDate)}</span>
          </div>
          {order.expectedDate && (
            <div className="detail-item">
              <span className="detail-label">Fecha Esperada:</span>
              <span className="detail-value">{formatDate(order.expectedDate)}</span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">Total:</span>
            <span className="detail-value"><strong>{formatCurrency(order.totalAmount)}</strong></span>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="detail-section">
          <h3>Notas</h3>
          <p className="detail-description">{order.notes}</p>
        </div>
      )}

      <div className="detail-section">
        <h3>Productos</h3>
        <div className="line-items-table">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Recibido</th>
                <th>Pendiente</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
                <th>Progreso</th>
              </tr>
            </thead>
            <tbody>
              {order.lineItems?.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.productSku}</strong></td>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td className="received-qty">{item.receivedQuantity}</td>
                  <td className="pending-qty">{item.pendingQuantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{formatCurrency(item.lineTotal)}</td>
                  <td>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${item.completionPercentage}%` }}
                      />
                      <span className="progress-text">{item.completionPercentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
        {canReceive && onReceive && (
          <Button type="button" variant="primary" onClick={onReceive}>
            📦 Registrar Recepción
          </Button>
        )}
      </div>
    </div>
  );
};
