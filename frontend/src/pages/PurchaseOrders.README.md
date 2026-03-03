# Purchase Orders Screen

## Descripción
Pantalla completa para la gestión de órdenes de compra con flujo completo de creación y recepción de productos.

## Características Principales

### 1. Lista de Órdenes de Compra
- Tabla con todas las órdenes de compra
- Columnas: Número, Proveedor, Fecha, Fecha Esperada, Total, Estado, Acciones
- Estados con badges de colores:
  - **Borrador** (gris): Orden en borrador
  - **Enviada** (amarillo): Orden enviada al proveedor
  - **Parcialmente Recibida** (azul): Algunos productos recibidos
  - **Recibida** (verde): Todos los productos recibidos
  - **Cancelada** (rojo): Orden cancelada

### 2. Filtros y Búsqueda
- **Búsqueda**: Por número de orden o nombre de proveedor
- **Filtro por Estado**: Dropdown para filtrar por estado de la orden
- **Contador**: Muestra cantidad de órdenes filtradas vs total

### 3. Crear Nueva Orden
Modal con formulario que incluye:
- **Información General**:
  - Proveedor (requerido)
  - Fecha de orden (requerido, por defecto hoy)
  - Fecha esperada de entrega (opcional)
  - Notas (opcional)

- **Productos (Line Items)**:
  - Lista dinámica de productos
  - Campos por producto:
    - Producto (dropdown con SKU y nombre)
    - Cantidad (número, mínimo 1)
    - Precio unitario (número, mínimo 0)
    - Subtotal (calculado automáticamente)
  - Botón "Agregar Producto" para añadir más líneas
  - Botón de eliminar (🗑️) para remover líneas (mínimo 1)
  - Total general calculado automáticamente

- **Validaciones**:
  - Proveedor requerido
  - Fecha de orden requerida
  - Al menos un producto requerido
  - Cantidad debe ser mayor a 0
  - Precio no puede ser negativo

### 4. Ver Detalle de Orden
Modal con información completa:
- **Información General**:
  - Número de orden
  - Estado (badge)
  - Proveedor
  - Fecha de orden
  - Fecha esperada
  - Total
  - Notas (si existen)

- **Tabla de Productos**:
  - SKU
  - Nombre del producto
  - Cantidad ordenada
  - Cantidad recibida (verde)
  - Cantidad pendiente (amarillo)
  - Precio unitario
  - Subtotal
  - Barra de progreso visual con porcentaje

- **Acciones**:
  - Botón "Cerrar"
  - Botón "📦 Registrar Recepción" (solo si estado es SUBMITTED o PARTIALLY_RECEIVED)

### 5. Registrar Recepción
Modal para registrar la recepción de productos:
- **Información de Recepción**:
  - Fecha de recepción (requerido, por defecto hoy)
  - Recibido por (requerido, nombre completo)
  - Notas de recepción (opcional)

- **Productos a Recibir**:
  - Lista de todos los productos de la orden
  - Por cada producto:
    - Información: SKU y nombre
    - Cantidad pendiente destacada
    - Cantidad a recibir (editable, máximo = pendiente)
    - Ubicación (dropdown, requerido si cantidad > 0)
    - Número de lote (opcional)
    - Fecha de vencimiento (opcional)
  
- **Acciones Rápidas**:
  - "Recibir Todo": Llena todas las cantidades con el pendiente
  - "Limpiar": Pone todas las cantidades en 0

- **Validaciones**:
  - Fecha de recepción requerida
  - Nombre de quien recibe requerido
  - Al menos un producto con cantidad > 0
  - Ubicación requerida para productos con cantidad > 0
  - Cantidad no puede exceder el pendiente

- **UX Inteligente**:
  - Campos de ubicación, lote y vencimiento se deshabilitan si cantidad = 0
  - Validación en tiempo real
  - Mensajes de error claros

## Componentes Utilizados

### Componentes Principales
- `PurchaseOrders.tsx`: Página principal con lista y modales
- `PurchaseOrderForm.tsx`: Formulario de creación
- `PurchaseOrderDetail.tsx`: Vista de detalle con progreso
- `ReceptionForm.tsx`: Formulario de recepción

### Componentes Reutilizables
- `Card`: Contenedor de la tabla
- `Table`: Tabla de órdenes
- `Button`: Botones de acción
- `Modal`: Modales para formularios
- `Input`: Campos de entrada
- `Select`: Dropdowns
- `Loading`: Estado de carga
- `ErrorMessage`: Mensajes de error

## Hooks Personalizados

### `usePurchaseOrders`
```typescript
const {
  orders,           // Lista de órdenes
  loading,          // Estado de carga
  error,            // Error si existe
  refetch,          // Recargar datos
  createOrder,      // Crear nueva orden
  getOrderById,     // Obtener orden completa por ID
  createReception   // Crear recepción
} = usePurchaseOrders();
```

### `useProducts`
```typescript
const {
  products,         // Lista de productos
  loading           // Estado de carga
} = useProducts();
```

### `useSuppliers`
```typescript
const {
  suppliers,        // Lista de proveedores
  loading           // Estado de carga
} = useSuppliers();
```

### `useWarehouses`
```typescript
const {
  warehouses,       // Lista de almacenes
  loading           // Estado de carga
} = useWarehouses();
```

### `useLocations`
```typescript
const {
  locations         // Lista de ubicaciones del almacén
} = useLocations(warehouseId);
```

## Flujo de Trabajo Completo

### 1. Crear Orden de Compra
1. Usuario hace clic en "+ Nueva Orden"
2. Se abre modal con formulario
3. Usuario selecciona proveedor y fechas
4. Usuario agrega productos con cantidades y precios
5. Sistema calcula subtotales y total automáticamente
6. Usuario hace clic en "Crear Orden"
7. Sistema valida y envía al backend
8. Modal se cierra y lista se actualiza

### 2. Ver Detalle
1. Usuario hace clic en el ícono 👁️ o en la fila
2. Sistema carga detalle completo con line items
3. Se muestra modal con toda la información
4. Barras de progreso muestran estado de recepción

### 3. Registrar Recepción
1. Desde el detalle, usuario hace clic en "📦 Registrar Recepción"
2. Se abre modal de recepción
3. Usuario puede usar "Recibir Todo" o ajustar cantidades manualmente
4. Para cada producto con cantidad > 0:
   - Selecciona ubicación (requerido)
   - Opcionalmente ingresa lote y vencimiento
5. Usuario ingresa nombre de quien recibe
6. Usuario hace clic en "Registrar Recepción"
7. Sistema valida y crea:
   - Registro de recepción
   - Movimientos de inventario (RECEIPT)
   - Actualiza stock en ubicaciones
   - Actualiza cantidades recibidas en line items
   - Actualiza estado de la orden si corresponde
8. Modal se cierra y detalle se actualiza

## Integración con Backend

### Endpoints Utilizados

#### Purchase Orders
- `GET /api/v1/purchase-orders` - Lista de órdenes
- `GET /api/v1/purchase-orders/:id` - Detalle de orden
- `POST /api/v1/purchase-orders` - Crear orden

#### Receptions
- `POST /api/v1/receptions` - Crear recepción

#### Otros
- `GET /api/v1/products` - Lista de productos
- `GET /api/v1/suppliers` - Lista de proveedores
- `GET /api/v1/warehouses` - Lista de almacenes
- `GET /api/v1/warehouses/:id/locations` - Ubicaciones de almacén

## Estilos CSS

Los estilos están en `App.css` bajo las secciones:
- `.purchase-orders-page`: Contenedor principal
- `.purchase-order-form`: Formulario de creación
- `.line-items-section`: Sección de productos
- `.line-item`: Cada línea de producto
- `.purchase-order-detail`: Vista de detalle
- `.progress-bar`: Barras de progreso
- `.reception-form`: Formulario de recepción
- `.reception-item`: Cada producto a recibir

## Manejo de Estados

### Estados de Carga
- Carga inicial de datos (productos, proveedores, almacenes)
- Carga de detalle de orden
- Carga durante creación de orden
- Carga durante creación de recepción

### Estados de Error
- Errores de red
- Errores de validación
- Errores del servidor
- Mensajes claros y accionables

### Estados de Formulario
- Validación en tiempo real
- Mensajes de error por campo
- Deshabilitación durante envío
- Limpieza al cerrar modales

## Responsive Design

- Grid adaptativo para line items
- Tabla con scroll horizontal en móviles
- Modales con altura máxima y scroll
- Botones apilados en pantallas pequeñas
- Campos de formulario en columnas en desktop, apilados en móvil

## Mejoras Futuras Sugeridas

1. **Edición de Órdenes**: Permitir editar órdenes en estado DRAFT
2. **Cancelación**: Implementar cancelación de órdenes
3. **Historial**: Ver historial de recepciones de una orden
4. **Impresión**: Generar PDF de la orden
5. **Notificaciones**: Alertas cuando una orden está por vencer
6. **Búsqueda Avanzada**: Filtros por fecha, monto, etc.
7. **Exportación**: Exportar lista a Excel/CSV
8. **Adjuntos**: Permitir adjuntar documentos a la orden
9. **Comentarios**: Sistema de comentarios en la orden
10. **Aprobaciones**: Flujo de aprobación para órdenes grandes

## Notas Técnicas

- Todos los cálculos de totales se hacen en el frontend para UX inmediata
- El backend recalcula y valida todos los montos por seguridad
- Las recepciones parciales permiten múltiples entregas
- El sistema actualiza automáticamente el estado de la orden según recepciones
- Las ubicaciones se cargan dinámicamente según el almacén de la orden
- Los campos opcionales (lote, vencimiento) se deshabilitan inteligentemente
