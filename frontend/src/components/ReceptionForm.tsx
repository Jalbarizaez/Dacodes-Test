import { useState } from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import type { PurchaseOrder, CreateReceptionDTO, ReceptionItemDTO } from '../types';
import type { Location } from '../hooks/useLocations';

interface ReceptionFormProps {
  order: PurchaseOrder;
  locations: Location[];
  onSubmit: (data: CreateReceptionDTO) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ReceptionForm = ({
  order,
  locations,
  onSubmit,
  onCancel,
  isLoading = false,
}: ReceptionFormProps) => {
  const [formData, setFormData] = useState({
    receivedDate: new Date().toISOString().split('T')[0],
    receivedBy: '',
    notes: '',
  });

  const [receptionItems, setReceptionItems] = useState<ReceptionItemDTO[]>(
    order.lineItems?.map(item => ({
      lineItemId: item.id,
      receivedQuantity: item.pendingQuantity,
      locationId: '',
      batchNumber: '',
      expirationDate: '',
      notes: '',
    })) || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.receivedDate) newErrors.receivedDate = 'Fecha es requerida';
    if (!formData.receivedBy.trim()) newErrors.receivedBy = 'Nombre de quien recibe es requerido';

    receptionItems.forEach((item, index) => {
      if (item.receivedQuantity > 0) {
        if (!item.locationId) {
          newErrors[`location-${index}`] = 'Ubicación requerida';
        }
        const lineItem = order.lineItems?.find(li => li.id === item.lineItemId);
        if (lineItem && item.receivedQuantity > lineItem.pendingQuantity) {
          newErrors[`quantity-${index}`] = `Máximo ${lineItem.pendingQuantity}`;
        }
      }
    });

    const totalReceiving = receptionItems.reduce((sum, item) => sum + item.receivedQuantity, 0);
    if (totalReceiving === 0) {
      newErrors.general = 'Debe recibir al menos un producto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateReceptionDTO = {
      purchaseOrderId: order.id,
      receivedDate: formData.receivedDate,
      receivedBy: formData.receivedBy,
      items: receptionItems.filter(item => item.receivedQuantity > 0),
      notes: formData.notes || undefined,
    };

    await onSubmit(data);
  };

  const updateReceptionItem = (index: number, field: keyof ReceptionItemDTO, value: any) => {
    const updated = [...receptionItems];
    updated[index] = { ...updated[index], [field]: value };
    setReceptionItems(updated);
  };

  const receiveAll = () => {
    const updated = receptionItems.map(item => {
      const lineItem = order.lineItems?.find(li => li.id === item.lineItemId);
      return {
        ...item,
        receivedQuantity: lineItem?.pendingQuantity || 0,
      };
    });
    setReceptionItems(updated);
  };

  const clearAll = () => {
    const updated = receptionItems.map(item => ({
      ...item,
      receivedQuantity: 0,
    }));
    setReceptionItems(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="reception-form">
      <div className="form-grid">
        <Input
          label="Fecha de Recepción *"
          type="date"
          value={formData.receivedDate}
          onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
          error={errors.receivedDate}
          disabled={isLoading}
        />

        <Input
          label="Recibido Por *"
          value={formData.receivedBy}
          onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
          error={errors.receivedBy}
          disabled={isLoading}
          placeholder="Nombre completo"
        />
      </div>

      {errors.general && (
        <div className="form-error">{errors.general}</div>
      )}

      <div className="reception-items-section">
        <div className="section-header">
          <h3>Productos a Recibir</h3>
          <div className="quick-actions">
            <button type="button" className="btn-link" onClick={receiveAll} disabled={isLoading}>
              Recibir Todo
            </button>
            <button type="button" className="btn-link" onClick={clearAll} disabled={isLoading}>
              Limpiar
            </button>
          </div>
        </div>

        <div className="reception-items-list">
          {receptionItems.map((item, index) => {
            const lineItem = order.lineItems?.find(li => li.id === item.lineItemId);
            if (!lineItem) return null;

            return (
              <div key={item.lineItemId} className="reception-item">
                <div className="item-header">
                  <div className="item-info">
                    <strong>{lineItem.productSku}</strong> - {lineItem.productName}
                  </div>
                  <div className="item-pending">
                    Pendiente: <strong>{lineItem.pendingQuantity}</strong>
                  </div>
                </div>

                <div className="item-fields">
                  <Input
                    label="Cantidad a Recibir *"
                    type="number"
                    value={item.receivedQuantity}
                    onChange={(e) => updateReceptionItem(index, 'receivedQuantity', parseInt(e.target.value) || 0)}
                    error={errors[`quantity-${index}`]}
                    disabled={isLoading}
                    min="0"
                    max={lineItem.pendingQuantity}
                  />

                  <Select
                    label="Ubicación *"
                    value={item.locationId}
                    onChange={(e) => updateReceptionItem(index, 'locationId', e.target.value)}
                    error={errors[`location-${index}`]}
                    disabled={isLoading || item.receivedQuantity === 0}
                    options={locations.map(l => ({
                      value: l.id,
                      label: `${l.code} - ${l.warehouseName}`,
                    }))}
                  />

                  <Input
                    label="Número de Lote"
                    value={item.batchNumber}
                    onChange={(e) => updateReceptionItem(index, 'batchNumber', e.target.value)}
                    disabled={isLoading || item.receivedQuantity === 0}
                    placeholder="Opcional"
                  />

                  <Input
                    label="Fecha de Vencimiento"
                    type="date"
                    value={item.expirationDate}
                    onChange={(e) => updateReceptionItem(index, 'expirationDate', e.target.value)}
                    disabled={isLoading || item.receivedQuantity === 0}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Notas de Recepción</label>
        <textarea
          className="input textarea"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          disabled={isLoading}
          placeholder="Observaciones sobre la recepción..."
          rows={3}
        />
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Registrando...' : 'Registrar Recepción'}
        </Button>
      </div>
    </form>
  );
};
