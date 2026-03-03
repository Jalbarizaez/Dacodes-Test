import { useState } from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import type { CreatePurchaseOrderDTO, CreateLineItemDTO, Product, Supplier, Warehouse } from '../types';

interface PurchaseOrderFormProps {
  products: Product[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  onSubmit: (data: CreatePurchaseOrderDTO) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PurchaseOrderForm = ({
  products,
  suppliers,
  onSubmit,
  onCancel,
  isLoading = false,
}: PurchaseOrderFormProps) => {
  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<CreateLineItemDTO[]>([
    { productId: '', quantity: 1, unitPrice: 0 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplierId) newErrors.supplierId = 'Proveedor es requerido';
    if (!formData.orderDate) newErrors.orderDate = 'Fecha de orden es requerida';
    
    if (lineItems.length === 0) {
      newErrors.lineItems = 'Debe agregar al menos un producto';
    } else {
      lineItems.forEach((item, index) => {
        if (!item.productId) newErrors[`product-${index}`] = 'Producto requerido';
        if (item.quantity <= 0) newErrors[`quantity-${index}`] = 'Cantidad debe ser mayor a 0';
        if (item.unitPrice < 0) newErrors[`price-${index}`] = 'Precio no puede ser negativo';
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreatePurchaseOrderDTO = {
      ...formData,
      lineItems: lineItems.filter(item => item.productId),
    };

    await onSubmit(data);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof CreateLineItemDTO, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  return (
    <form onSubmit={handleSubmit} className="purchase-order-form">
      <div className="form-grid">
        <Select
          label="Proveedor *"
          value={formData.supplierId}
          onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
          error={errors.supplierId}
          disabled={isLoading}
          options={suppliers.map(s => ({ value: s.id, label: s.name }))}
        />

        <Input
          label="Fecha de Orden *"
          type="date"
          value={formData.orderDate}
          onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
          error={errors.orderDate}
          disabled={isLoading}
        />

        <Input
          label="Fecha Esperada de Entrega"
          type="date"
          value={formData.expectedDeliveryDate}
          onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
          disabled={isLoading}
        />
      </div>

      <div className="line-items-section">
        <div className="section-header">
          <h3>Productos</h3>
          <Button type="button" variant="secondary" onClick={addLineItem} disabled={isLoading}>
            + Agregar Producto
          </Button>
        </div>

        {errors.lineItems && <span className="error-text">{errors.lineItems}</span>}

        <div className="line-items-list">
          {lineItems.map((item, index) => (
            <div key={index} className="line-item">
              <Select
                label="Producto *"
                value={item.productId}
                onChange={(e) => updateLineItem(index, 'productId', e.target.value)}
                error={errors[`product-${index}`]}
                disabled={isLoading}
                options={products.map(p => ({ value: p.id, label: `${p.sku} - ${p.name}` }))}
              />

              <Input
                label="Cantidad *"
                type="number"
                value={item.quantity}
                onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                error={errors[`quantity-${index}`]}
                disabled={isLoading}
                min="1"
              />

              <Input
                label="Precio Unitario *"
                type="number"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                error={errors[`price-${index}`]}
                disabled={isLoading}
                min="0"
              />

              <div className="line-item-total">
                <span className="label">Subtotal:</span>
                <span className="value">${(item.quantity * item.unitPrice).toFixed(2)}</span>
              </div>

              {lineItems.length > 1 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeLineItem(index)}
                  disabled={isLoading}
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="order-total">
          <strong>Total:</strong>
          <strong>${calculateTotal().toFixed(2)}</strong>
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Notas</label>
        <textarea
          className="input textarea"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          disabled={isLoading}
          placeholder="Notas adicionales..."
          rows={3}
        />
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Creando...' : 'Crear Orden'}
        </Button>
      </div>
    </form>
  );
};
