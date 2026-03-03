import { useState, useEffect } from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import type { Product, CreateProductDTO, Category } from '../types';

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  onSubmit: (data: CreateProductDTO) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ProductForm = ({ 
  product, 
  categories, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ProductFormProps) => {
  const [formData, setFormData] = useState<CreateProductDTO>({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    unitOfMeasure: '',
    minStock: undefined,
    maxStock: undefined,
    weight: undefined,
    dimensions: '',
    barcode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId,
        unitOfMeasure: product.unitOfMeasure,
        minStock: product.minStock || undefined,
        maxStock: product.maxStock || undefined,
        weight: product.weight ? parseFloat(product.weight) : undefined,
        dimensions: product.dimensions || '',
        barcode: product.barcode || '',
      });
    }
  }, [product]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU es requerido';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Nombre es requerido';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Categoría es requerida';
    }
    if (!formData.unitOfMeasure.trim()) {
      newErrors.unitOfMeasure = 'Unidad de medida es requerida';
    }
    if (formData.minStock !== undefined && formData.minStock < 0) {
      newErrors.minStock = 'Stock mínimo no puede ser negativo';
    }
    if (formData.maxStock !== undefined && formData.maxStock < 0) {
      newErrors.maxStock = 'Stock máximo no puede ser negativo';
    }
    if (
      formData.minStock !== undefined &&
      formData.maxStock !== undefined &&
      formData.minStock > formData.maxStock
    ) {
      newErrors.maxStock = 'Stock máximo debe ser mayor al mínimo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleChange = (field: keyof CreateProductDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div className="form-grid">
        <Input
          label="SKU *"
          value={formData.sku}
          onChange={(e) => handleChange('sku', e.target.value)}
          error={errors.sku}
          disabled={!!product || isLoading}
          placeholder="PROD-001"
        />

        <Input
          label="Nombre *"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          disabled={isLoading}
          placeholder="Nombre del producto"
        />

        <Select
          label="Categoría *"
          value={formData.categoryId}
          onChange={(e) => handleChange('categoryId', e.target.value)}
          error={errors.categoryId}
          disabled={isLoading}
          options={categories.map(cat => ({
            value: cat.id,
            label: cat.name,
          }))}
        />

        <Input
          label="Unidad de Medida *"
          value={formData.unitOfMeasure}
          onChange={(e) => handleChange('unitOfMeasure', e.target.value)}
          error={errors.unitOfMeasure}
          disabled={isLoading}
          placeholder="PZA, KG, LT, etc."
        />

        <Input
          label="Stock Mínimo"
          type="number"
          value={formData.minStock || ''}
          onChange={(e) => handleChange('minStock', e.target.value ? parseInt(e.target.value) : undefined)}
          error={errors.minStock}
          disabled={isLoading}
          placeholder="0"
        />

        <Input
          label="Stock Máximo"
          type="number"
          value={formData.maxStock || ''}
          onChange={(e) => handleChange('maxStock', e.target.value ? parseInt(e.target.value) : undefined)}
          error={errors.maxStock}
          disabled={isLoading}
          placeholder="0"
        />

        <Input
          label="Peso (kg)"
          type="number"
          step="0.01"
          value={formData.weight || ''}
          onChange={(e) => handleChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
          disabled={isLoading}
          placeholder="0.00"
        />

        <Input
          label="Código de Barras"
          value={formData.barcode || ''}
          onChange={(e) => handleChange('barcode', e.target.value)}
          disabled={isLoading}
          placeholder="1234567890123"
        />
      </div>

      <Input
        label="Dimensiones"
        value={formData.dimensions || ''}
        onChange={(e) => handleChange('dimensions', e.target.value)}
        disabled={isLoading}
        placeholder="10x20x30 cm"
      />

      <div className="input-group">
        <label className="input-label">Descripción</label>
        <textarea
          className="input textarea"
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          disabled={isLoading}
          placeholder="Descripción del producto..."
          rows={3}
        />
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};
