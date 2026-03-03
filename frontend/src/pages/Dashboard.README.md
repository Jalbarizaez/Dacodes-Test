# Dashboard - Documentación

Dashboard principal del sistema DaCodes Inventory con KPIs, alertas y resumen en tiempo real.

## 🎯 Características

### 1. KPIs Principales
- **Productos Activos**: Total de productos registrados y activos
- **Stock Total**: Inventario total con desglose de disponible
- **Alertas de Stock Bajo**: Productos que requieren reorden
- **Órdenes Pendientes**: Órdenes de compra por recibir

### 2. Desglose de Inventario
- Stock Disponible
- Stock Reservado
- Stock Dañado
- Número de Almacenes

### 3. Alertas de Stock Bajo
- Lista de productos bajo el mínimo
- Nivel de urgencia (CRÍTICO, ALTO, MEDIO, BAJO)
- Stock actual vs mínimo
- Déficit calculado

### 4. Órdenes de Compra Pendientes
- Órdenes en estado SUBMITTED o PARTIALLY_RECEIVED
- Información del proveedor
- Monto total
- Fecha esperada de entrega

### 5. Movimientos Recientes
- Últimos 10 movimientos de inventario
- Tipo de movimiento con iconos
- Producto, almacén y cantidad
- Balance actualizado
- Razón del movimiento

### 6. Resumen por Almacén
- Stock consolidado por almacén
- Desglose: Total, Disponible, Reservado, Dañado
- Número de productos y ubicaciones

### 7. Sección de IA (Preparada)
- Placeholder para futuros insights de IA
- Predicciones de demanda
- Recomendaciones automáticas
- Optimización de inventario

## 📊 Componentes Utilizados

### StatCard
Tarjeta de estadística reutilizable con:
- Título e icono
- Valor principal
- Subtítulo opcional
- Tendencia opcional
- Variantes de color (default, success, warning, danger, info)
- Click handler opcional

```tsx
<StatCard
  title="Productos Activos"
  value={100}
  subtitle="150 total"
  icon="📦"
  variant="default"
  onClick={() => navigate('/products')}
/>
```

### EmptyState
Estado vacío reutilizable con:
- Icono personalizable
- Título y descripción
- Acción opcional

```tsx
<EmptyState
  icon="✅"
  title="Sin alertas"
  description="Todos los productos tienen stock suficiente"
/>
```

## 🔌 Hook: useDashboard

Hook personalizado que obtiene todos los datos del dashboard:

```tsx
const { 
  stats,              // DashboardStats
  lowStockAlerts,     // ReorderAlert[]
  pendingOrders,      // PurchaseOrder[]
  recentMovements,    // Movement[]
  warehouseSummary,   // WarehouseSummary[]
  loading,            // boolean
  error,              // string | null
  refetch             // () => void
} = useDashboard();
```

### Endpoints Consumidos

1. `GET /api/products` - Lista de productos
2. `GET /api/warehouses` - Lista de almacenes
3. `GET /api/stock` - Niveles de stock
4. `GET /api/stock/alerts/low-stock` - Alertas de stock bajo
5. `GET /api/purchase-orders?status=SUBMITTED&status=PARTIALLY_RECEIVED` - Órdenes pendientes
6. `GET /api/movements?limit=10` - Movimientos recientes

## 🎨 Estilos

Todos los estilos están en `App.css`:

- `.dashboard` - Contenedor principal
- `.stat-card` - Tarjetas de estadísticas
- `.alert-list` - Lista de alertas
- `.order-list` - Lista de órdenes
- `.movements-table` - Tabla de movimientos
- `.warehouse-grid` - Grid de almacenes
- `.empty-state` - Estado vacío

### Variantes de StatCard

- `stat-card-default` - Gris (por defecto)
- `stat-card-success` - Verde (border izquierdo)
- `stat-card-warning` - Amarillo (border izquierdo)
- `stat-card-danger` - Rojo (border izquierdo)
- `stat-card-info` - Azul (border izquierdo)

## 📱 Responsive

El dashboard es completamente responsive:
- Desktop: Grid de 2-4 columnas
- Tablet: Grid de 2 columnas
- Mobile: Grid de 1 columna

## 🔄 Estados

### Loading
Muestra componente `<Loading />` mientras carga datos

### Error
Muestra componente `<ErrorMessage />` con opción de reintentar

### Empty
Cada sección maneja su propio estado vacío con `<EmptyState />`

## 🚀 Navegación

Las tarjetas de KPI son clickeables y navegan a:
- Productos Activos → `/products`
- Stock Total → `/inventory`
- Alertas → `/reorder-alerts`
- Órdenes Pendientes → `/purchase-orders`

## 🎯 Cálculos

### Nivel de Urgencia
```typescript
if (currentStock <= 0) return 'CRÍTICO';
if (deficit >= 75% of min) return 'ALTO';
if (deficit >= 50% of min) return 'MEDIO';
return 'BAJO';
```

### Resumen por Almacén
Agrupa stock por `warehouseId` y suma:
- Total disponible
- Total reservado
- Total dañado
- Cuenta de productos

## 🔮 Futuras Mejoras

1. **Gráficos**
   - Tendencias de stock
   - Movimientos por tipo
   - Distribución por almacén

2. **Filtros de Tiempo**
   - Hoy, Semana, Mes, Año
   - Rango personalizado

3. **Insights de IA**
   - Predicción de demanda
   - Recomendaciones de reorden
   - Detección de anomalías
   - Optimización de stock

4. **Exportación**
   - PDF de reportes
   - Excel de datos
   - Programación de reportes

5. **Notificaciones**
   - Alertas en tiempo real
   - Notificaciones push
   - Email de resumen diario

## 🐛 Troubleshooting

### No se cargan los datos
- Verificar que el backend esté corriendo
- Verificar endpoints en consola del navegador
- Verificar que haya datos en la base de datos

### Alertas no aparecen
- Verificar que existan productos con `minStock` configurado
- Verificar que el stock actual esté por debajo del mínimo
- Ejecutar seed del backend: `npx tsx prisma/seed.ts`

### Órdenes no aparecen
- Verificar que existan órdenes con estado SUBMITTED o PARTIALLY_RECEIVED
- Crear órdenes de prueba desde el backend

## 📝 Tipos TypeScript

Todos los tipos están en `src/types/index.ts`:

```typescript
interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalWarehouses: number;
  activeWarehouses: number;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  lowStockCount: number;
  pendingPurchaseOrders: number;
  recentMovements: number;
}

interface WarehouseSummary {
  warehouseId: string;
  warehouseName: string;
  totalAvailable: number;
  totalReserved: number;
  totalDamaged: number;
  totalStock: number;
  productCount: number;
  locationCount: number;
}
```
