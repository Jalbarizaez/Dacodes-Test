import type { Product } from '../types';

interface ProductDetailProps {
  product: Product;
  onEdit: () => void;
  onClose: () => void;
}

export const ProductDetail = ({ product, onEdit, onClose }: ProductDetailProps) => {
  return (
    <div className="product-detail">
      <div className="detail-section">
        <h3>Información General</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">SKU:</span>
            <span className="detail-value">{product.sku}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Nombre:</span>
            <span className="detail-value">{product.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Categoría:</span>
            <span className="detail-value">{product.categoryName || 'Sin categoría'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Unidad:</span>
            <span className="detail-value">{product.unitOfMeasure}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Estado:</span>
            <span className={`badge ${product.isActive ? 'badge-success' : 'badge-danger'}`}>
              {product.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {product.description && (
        <div className="detail-section">
          <h3>Descripción</h3>
          <p className="detail-description">{product.description}</p>
        </div>
      )}

      <div className="detail-section">
        <h3>Stock</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Mínimo:</span>
            <span className="detail-value">{product.minStock || 'No definido'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Máximo:</span>
            <span className="detail-value">{product.maxStock || 'No definido'}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3>Información Adicional</h3>
        <div className="detail-grid">
          {product.weight && (
            <div className="detail-item">
              <span className="detail-label">Peso:</span>
              <span className="detail-value">{product.weight} kg</span>
            </div>
          )}
          {product.dimensions && (
            <div className="detail-item">
              <span className="detail-label">Dimensiones:</span>
              <span className="detail-value">{product.dimensions}</span>
            </div>
          )}
          {product.barcode && (
            <div className="detail-item">
              <span className="detail-label">Código de Barras:</span>
              <span className="detail-value">{product.barcode}</span>
            </div>
          )}
        </div>
      </div>

      <div className="detail-section">
        <h3>Fechas</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Creado:</span>
            <span className="detail-value">
              {new Date(product.createdAt).toLocaleString('es-MX')}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Actualizado:</span>
            <span className="detail-value">
              {new Date(product.updatedAt).toLocaleString('es-MX')}
            </span>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onClose}>
          Cerrar
        </button>
        <button className="btn btn-primary" onClick={onEdit}>
          Editar
        </button>
      </div>
    </div>
  );
};
