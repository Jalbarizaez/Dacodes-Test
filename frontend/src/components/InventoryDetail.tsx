import { useState, useEffect } from 'react';
import { Loading } from './Loading';
import { ErrorMessage } from './ErrorMessage';
import { StockCard } from './StockCard';
import api, { getErrorMessage } from '../services/api';
import type { StockLevel, Movement, ApiResponse } from '../types';

interface InventoryDetailProps {
  stockItem: StockLevel;
  onClose: () => void;
}

export const InventoryDetail = ({ stockItem, onClose }: InventoryDetailProps) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<ApiResponse<Movement[]>>(
          `/movements?productId=${stockItem.productId}&locationId=${stockItem.locationId}&limit=10`
        );
        setMovements(response.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [stockItem.productId, stockItem.locationId]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  return (
    <div className="inventory-detail">
      {/* Product Info */}
      <div className="detail-section">
        <h3>Información del Producto</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">SKU:</span>
            <span className="detail-value">{stockItem.productSku}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Producto:</span>
            <span className="detail-value">{stockItem.productName}</span>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="detail-section">
        <h3>Ubicación</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Almacén:</span>
            <span className="detail-value">{stockItem.warehouseName}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Ubicación:</span>
            <span className="detail-value">
              {stockItem.locationCode} {stockItem.locationName ? `- ${stockItem.locationName}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Stock Breakdown */}
      <div className="detail-section">
        <h3>Desglose de Stock</h3>
        <div className="stock-cards-grid">
          <StockCard
            label="Total"
            value={stockItem.quantityTotal}
            variant="total"
            icon="📦"
          />
          <StockCard
            label="Disponible"
            value={stockItem.quantityAvailable}
            variant="available"
            icon="✅"
          />
          <StockCard
            label="Reservado"
            value={stockItem.quantityReserved}
            variant="reserved"
            icon="🔒"
          />
          <StockCard
            label="Dañado"
            value={stockItem.quantityDamaged}
            variant="damaged"
            icon="⚠️"
          />
        </div>
      </div>

      {/* Last Count */}
      {stockItem.lastCountDate && (
        <div className="detail-section">
          <h3>Último Conteo</h3>
          <p className="detail-value">{formatDate(stockItem.lastCountDate)}</p>
        </div>
      )}

      {/* Recent Movements */}
      <div className="detail-section">
        <h3>Movimientos Recientes</h3>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : movements.length === 0 ? (
          <p className="empty-message">No hay movimientos registrados</p>
        ) : (
          <div className="movements-list">
            {movements.map((movement) => (
              <div key={movement.id} className="movement-item">
                <div className="movement-header">
                  <span className="movement-type">
                    {getMovementIcon(movement.type)} {getMovementTypeLabel(movement.type)}
                  </span>
                  <span className="movement-date">{formatDate(movement.date)}</span>
                </div>
                <div className="movement-details">
                  <span className={`movement-quantity ${movement.quantity >= 0 ? 'positive' : 'negative'}`}>
                    {movement.quantity >= 0 ? '+' : ''}{movement.quantity}
                  </span>
                  <span className="movement-balance">Balance: {movement.runningBalance}</span>
                </div>
                {movement.reason && (
                  <div className="movement-reason">{movement.reason}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};
