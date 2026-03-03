import { useState } from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import { Modal } from '../components/Modal';
import { ProductForm } from '../components/ProductForm';
import { ProductDetail } from '../components/ProductDetail';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { getErrorMessage } from '../services/api';
import type { Product, CreateProductDTO, CreateCategoryDTO } from '../types';

type ModalMode = 'create' | 'edit' | 'detail' | 'categories' | null;

export const Products = () => {
  const { products, loading, error, refetch, createProduct, updateProduct, deleteProduct } = useProducts();
  const { categories, loading: loadingCategories, createCategory, fetchCategories } = useCategories();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Category management state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  if (loading || loadingCategories) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  const handleCreate = () => {
    setSelectedProduct(null);
    setModalMode('create');
    setFormError(null);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setFormError(null);
  };

  const handleDetail = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('detail');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedProduct(null);
    setFormError(null);
    setCategoryError(null);
    setNewCategoryName('');
    setNewCategoryDescription('');
  };

  const handleManageCategories = () => {
    setModalMode('categories');
    setCategoryError(null);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      setCategoryError('El nombre de la categoría es requerido');
      return;
    }

    try {
      setFormLoading(true);
      setCategoryError(null);

      const categoryData: CreateCategoryDTO = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
      };

      await createCategory(categoryData);
      await fetchCategories();
      
      setNewCategoryName('');
      setNewCategoryDescription('');
      alert('Categoría creada exitosamente');
    } catch (err) {
      setCategoryError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmit = async (data: CreateProductDTO) => {
    try {
      setFormLoading(true);
      setFormError(null);

      if (modalMode === 'create') {
        await createProduct(data);
      } else if (modalMode === 'edit' && selectedProduct) {
        await updateProduct(selectedProduct.id, data);
      }

      handleCloseModal();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Estás seguro de desactivar el producto "${product.name}"?`)) {
      return;
    }

    try {
      await deleteProduct(product.id);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const columns = [
    { header: 'SKU', accessor: 'sku' as keyof Product },
    { header: 'Nombre', accessor: 'name' as keyof Product },
    { header: 'Categoría', accessor: 'categoryName' as keyof Product },
    { header: 'Unidad', accessor: 'unitOfMeasure' as keyof Product },
    { 
      header: 'Stock Mín/Máx', 
      accessor: (row: Product) => `${row.minStock || '-'} / ${row.maxStock || '-'}` 
    },
    { 
      header: 'Estado', 
      accessor: (row: Product) => (
        <span className={`badge ${row.isActive ? 'badge-success' : 'badge-danger'}`}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: (row: Product) => (
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
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Editar"
          >
            ✏️
          </button>
          {row.isActive && (
            <button
              className="btn-icon btn-icon-danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              title="Desactivar"
            >
              🗑️
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Productos</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={handleManageCategories}>
            📁 Gestionar Categorías
          </Button>
          <Button variant="primary" onClick={handleCreate}>
            + Nuevo Producto
          </Button>
        </div>
      </div>

      <Card>
        <div className="filters">
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="filter-info">
            Mostrando {filteredProducts.length} de {products.length} productos
          </div>
        </div>

        <Table 
          columns={columns} 
          data={filteredProducts}
          onRowClick={handleDetail}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={handleCloseModal}
        title={modalMode === 'create' ? 'Crear Producto' : 'Editar Producto'}
        size="large"
      >
        {formError && (
          <div className="form-error">
            {formError}
          </div>
        )}
        <ProductForm
          product={selectedProduct}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={formLoading}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={modalMode === 'detail'}
        onClose={handleCloseModal}
        title="Detalle del Producto"
        size="large"
      >
        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onEdit={() => {
              setModalMode('edit');
            }}
            onClose={handleCloseModal}
          />
        )}
      </Modal>

      {/* Categories Management Modal */}
      <Modal
        isOpen={modalMode === 'categories'}
        onClose={handleCloseModal}
        title="Gestionar Categorías"
        size="medium"
      >
        <div className="categories-management">
          <form onSubmit={handleCreateCategory} className="category-form">
            <h3>Crear Nueva Categoría</h3>
            
            {categoryError && (
              <div className="form-error">
                {categoryError}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Nombre *</label>
              <input
                type="text"
                className="input"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nombre de la categoría"
                disabled={formLoading}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Descripción</label>
              <textarea
                className="input textarea"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Descripción de la categoría..."
                rows={3}
                disabled={formLoading}
              />
            </div>

            <Button type="submit" variant="primary" disabled={formLoading}>
              {formLoading ? 'Creando...' : 'Crear Categoría'}
            </Button>
          </form>

          <div className="categories-list">
            <h3>Categorías Existentes</h3>
            {categories.length === 0 ? (
              <p className="empty-message">No hay categorías creadas</p>
            ) : (
              <div className="category-items">
                {categories.map((category) => (
                  <div key={category.id} className="category-item">
                    <div className="category-info">
                      <strong>{category.name}</strong>
                      {category.description && (
                        <p className="category-description">{category.description}</p>
                      )}
                      {category._count && (
                        <span className="category-count">
                          {category._count.products} producto(s)
                        </span>
                      )}
                    </div>
                    <span className={`badge ${category.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {category.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
