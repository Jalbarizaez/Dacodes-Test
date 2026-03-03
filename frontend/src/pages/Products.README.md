# Productos - Documentación

Pantalla completa de gestión de productos con CRUD, búsqueda y validación.

## 🎯 Características

### 1. Lista de Productos
- Tabla con todos los productos
- Columnas: SKU, Nombre, Categoría, Unidad, Stock Mín/Máx, Estado, Acciones
- Click en fila para ver detalle
- Paginación automática (si hay muchos productos)

### 2. Búsqueda
- Búsqueda en tiempo real
- Filtra por: Nombre, SKU, Código de barras
- Contador de resultados

### 3. Crear Producto
- Modal con formulario completo
- Validación de campos requeridos
- Validación de stock mínimo/máximo
- SKU único (no editable después de crear)

### 4. Editar Producto
- Modal con formulario pre-llenado
- Mismas validaciones que crear
- SKU no editable
- Actualización en tiempo real

### 5. Ver Detalle
- Modal con información completa
- Secciones organizadas:
  - Información General
  - Descripción
  - Stock
  - Información Adicional
  - Fechas
- Botón para editar desde detalle

### 6. Desactivar Producto
- Soft delete (isActive = false)
- Confirmación antes de desactivar
- Producto permanece en base de datos

## 📋 Componentes

### ProductForm
Formulario reutilizable para crear/editar productos.

**Props:**
```typescript
interface ProductFormProps {
  product?: Product | null;      // Si existe, modo edición
  categories: Category[];         // Lista de categorías
  onSubmit: (data: CreateProductDTO) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**Campos:**
- SKU * (requerido, no editable en modo edición)
- Nombre * (requerido)
- Categoría * (requerido, select)
- Unidad de Medida * (requerido)
- Stock Mínimo (opcional, número)
- Stock Máximo (opcional, número)
- Peso (opcional, decimal)
- Código de Barras (opcional)
- Dimensiones (opcional)
- Descripción (opcional, textarea)

**Validaciones:**
- SKU no vacío
- Nombre no vacío
- Categoría seleccionada
- Unidad de medida no vacía
- Stock mínimo >= 0
- Stock máximo >= 0
- Stock máximo >= Stock mínimo

### ProductDetail
Vista de solo lectura con toda la información del producto.

**Props:**
```typescript
interface ProductDetailProps {
  product: Product;
  onEdit: () => void;
  onClose: () => void;
}
```

**Secciones:**
1. Información General (SKU, Nombre, Categoría, Unidad, Estado)
2. Descripción (si existe)
3. Stock (Mínimo, Máximo)
4. Información Adicional (Peso, Dimensiones, Código de Barras)
5. Fechas (Creado, Actualizado)

### Modal
Modal reutilizable para formularios y detalles.

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'small' | 'medium' | 'large';
}
```

**Características:**
- Cierre con ESC
- Cierre con click fuera
- Bloqueo de scroll del body
- 3 tamaños: small (400px), medium (600px), large (800px)

### Select
Select reutilizable con label y error.

**Props:**
```typescript
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

interface SelectOption {
  value: string;
  label: string;
}
```

## 🔌 Hooks

### useProducts
Hook principal para gestión de productos.

```typescript
const { 
  products,           // Product[]
  loading,            // boolean
  error,              // string | null
  refetch,            // () => Promise<void>
  createProduct,      // (data: CreateProductDTO) => Promise<Product>
  updateProduct,      // (id: string, data: Partial<CreateProductDTO>) => Promise<Product>
  deleteProduct,      // (id: string) => Promise<void>
  getProductById,     // (id: string) => Promise<Product>
} = useProducts();
```

**Endpoints:**
- `GET /api/products` - Lista de productos
- `POST /api/products` - Crear producto
- `GET /api/products/:id` - Obtener por ID
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Desactivar producto

### useCategories
Hook para obtener categorías.

```typescript
const { 
  categories,   // Category[]
  loading,      // boolean
  error,        // string | null
  refetch,      // () => Promise<void>
} = useCategories();
```

**Endpoint:**
- `GET /api/categories` - Lista de categorías

## 🎨 Estados

### Loading
- Muestra `<Loading />` mientras carga productos y categorías
- Formulario deshabilitado durante submit

### Error
- Muestra `<ErrorMessage />` si falla la carga inicial
- Muestra error en formulario si falla el submit
- Botón "Reintentar" para recargar

### Empty
- Tabla muestra "No hay datos disponibles" si no hay productos
- Búsqueda muestra "0 de X productos" si no hay resultados

### Success
- Cierra modal automáticamente después de crear/editar
- Actualiza lista sin recargar página
- Feedback visual con badges de estado

## 🔄 Flujo de Trabajo

### Crear Producto
1. Click en "Nuevo Producto"
2. Modal se abre con formulario vacío
3. Llenar campos requeridos
4. Click en "Crear"
5. Validación del formulario
6. POST a `/api/products`
7. Si éxito: cierra modal, actualiza lista
8. Si error: muestra mensaje de error

### Editar Producto
1. Click en icono ✏️ o botón "Editar" en detalle
2. Modal se abre con formulario pre-llenado
3. Modificar campos (excepto SKU)
4. Click en "Actualizar"
5. Validación del formulario
6. PUT a `/api/products/:id`
7. Si éxito: cierra modal, actualiza lista
8. Si error: muestra mensaje de error

### Ver Detalle
1. Click en fila o icono 👁️
2. Modal se abre con información completa
3. Opciones: Cerrar o Editar
4. Si edita: cambia a modo edición

### Desactivar
1. Click en icono 🗑️
2. Confirmación: "¿Estás seguro?"
3. Si confirma: DELETE a `/api/products/:id`
4. Producto se marca como inactivo
5. Badge cambia a "Inactivo" (rojo)

## 📊 Tipos TypeScript

```typescript
interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName?: string;
  unitOfMeasure: string;
  minStock: number | null;
  maxStock: number | null;
  weight: string | null;
  dimensions: string | null;
  barcode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateProductDTO {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  unitOfMeasure: string;
  minStock?: number;
  maxStock?: number;
  weight?: number;
  dimensions?: string;
  barcode?: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## 🎯 Validaciones

### Frontend
- Campos requeridos no vacíos
- Stock mínimo >= 0
- Stock máximo >= 0
- Stock máximo >= Stock mínimo
- Números válidos para campos numéricos

### Backend (Zod)
- SKU único
- Formato de campos
- Longitud de strings
- Rangos de números
- Categoría existe

## 🐛 Manejo de Errores

### Errores Comunes

**"SKU already exists"**
- Causa: SKU duplicado
- Solución: Usar otro SKU

**"Category not found"**
- Causa: Categoría no existe
- Solución: Seleccionar categoría válida

**"Invalid input"**
- Causa: Datos inválidos
- Solución: Revisar validaciones

**"Network Error"**
- Causa: Backend no disponible
- Solución: Verificar que backend esté corriendo

## 🚀 Mejoras Futuras

1. **Paginación**
   - Paginación del lado del servidor
   - Límite de resultados por página

2. **Filtros Avanzados**
   - Filtro por categoría
   - Filtro por estado (activo/inactivo)
   - Filtro por rango de stock

3. **Ordenamiento**
   - Ordenar por columna
   - Ascendente/Descendente

4. **Importación/Exportación**
   - Importar desde Excel/CSV
   - Exportar a Excel/PDF

5. **Imágenes**
   - Subir imagen del producto
   - Galería de imágenes

6. **Stock en Tiempo Real**
   - Mostrar stock actual en la tabla
   - Alertas de stock bajo

7. **Historial**
   - Ver historial de cambios
   - Auditoría de modificaciones

8. **Búsqueda Avanzada**
   - Búsqueda por múltiples campos
   - Autocompletado

## 📝 Ejemplos de Uso

### Crear Producto Básico
```typescript
const newProduct = {
  sku: 'PROD-001',
  name: 'Laptop Dell',
  categoryId: 'cat-123',
  unitOfMeasure: 'PZA',
};

await createProduct(newProduct);
```

### Crear Producto Completo
```typescript
const newProduct = {
  sku: 'PROD-002',
  name: 'Mouse Logitech',
  description: 'Mouse inalámbrico ergonómico',
  categoryId: 'cat-456',
  unitOfMeasure: 'PZA',
  minStock: 10,
  maxStock: 100,
  weight: 0.15,
  dimensions: '10x6x4 cm',
  barcode: '1234567890123',
};

await createProduct(newProduct);
```

### Actualizar Producto
```typescript
await updateProduct('prod-id', {
  name: 'Mouse Logitech MX Master',
  minStock: 15,
  maxStock: 150,
});
```

## ✅ Checklist de Pruebas

- [ ] Crear producto con campos mínimos
- [ ] Crear producto con todos los campos
- [ ] Validación de campos requeridos
- [ ] Validación de stock mínimo/máximo
- [ ] Editar producto existente
- [ ] Ver detalle de producto
- [ ] Desactivar producto
- [ ] Búsqueda por nombre
- [ ] Búsqueda por SKU
- [ ] Búsqueda por código de barras
- [ ] Manejo de errores de red
- [ ] Manejo de errores de validación
- [ ] Modal cierra con ESC
- [ ] Modal cierra con click fuera
- [ ] Responsive en mobile
