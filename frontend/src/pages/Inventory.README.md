# Inventario - Documentación

Pantalla completa de consulta y gestión de inventario con filtros avanzados y vista detallada.

## 🎯 Características

### 1. Resumen de Stock
- 4 tarjetas con totales agregados:
  - Total (azul)
  - Disponible (verde)
  - Reservado (amarillo)
  - Dañado (rojo)
- Actualización automática según filtros

### 2. Filtros Avanzados
- **Búsqueda de texto**: Producto, SKU, Almacén, Ubicación
- **Filtro por Producto**: Select con todos los productos
- **Filtro por Almacén**: Select con todos los almacenes
- **Solo con stock**: Checkbox para ocultar ubicaciones vacías
- Contador de resultados

### 3. Tabla de Inventario
- Columnas:
  - SKU
  - Producto
  - Almacén
  - Ubicación (código + nombre)
  - Disponible (verde)
  - Reservado (amarillo)
  - Dañado (rojo)
  - Total (azul)
  - Acciones
- Click en fila para ver detalle
- Valores con colores según tipo

### 4. Detalle de Inventario
Modal con información completa:
- **Información del Producto**: SKU, Nombre
- **Ubicación**: Almacén, Ubicación
- **Desglose de Stock**: 4 tarjetas con valores
- **Último Conteo**: Fecha del último conteo físico
- **Movimientos Recientes**: Últimos 10 movimientos
  - Tipo con icono
  - Fecha y hora
  - Cantidad (positiva/negativa)
  - Balance actualizado
  - Razón del movimiento

### 5. Movimientos Recientes
- Lista de últimos 10 movimientos
- Tipos de movimiento:
  - 📥 Entrada (RECEIPT)
  - 📤 Salida (SHIPMENT)
  - ⚖️ Ajuste (ADJUSTMENT)
  - 🔄 Transferencia Entrada/Salida
  - 🔒 Reserva (RESERVATION)
  - 🔓 Liberación (RELEASE)
  - ⚠️ Daño (DAMAGE)
- Cantidades con colores (verde/rojo)
- Balance actualizado después de cada movimiento

## 📋 Componentes

### InventoryDetail
Vista detallada de un item de inventario con movimientos.

**Props:**
```typescript
interface InventoryDetailProps {
  stockItem: StockLevel;
  onClose: () => void;
}
```

**Características:**
- Carga movimientos automáticamente
- Muestra últimos 10 movimientos
- Scroll en lista de movimientos
- Estados de loading y error

### StockCard
Tarjeta de stock reutilizable con variantes de color.

**Props:**
```typescript
interface StockCardProps {
  label: string;
  value: number;
  variant: 'total' | 'available' | 'reserved' | 'damaged';
  icon?: string;
}
```

**Variantes:**
- `total`: Azul (#007bff)
- `available`: Verde (#28a745)
- `reserved`: Amarillo (#ffc107)
- `damaged`: Rojo (#dc3545)

## 🔌 Hooks

### useStock (actualizado)
Hook con soporte para filtros.

```typescript
const { 
  stock,      // StockLevel[]
  loading,    // boolean
  error,      // string | null
  refetch,    // () => Promise<void>
} = useStock({
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  hasStock?: boolean;
});
```

**Endpoints:**
- `GET /api/stock` - Lista de stock
- `GET /api/stock?productId=xxx` - Filtrado por producto
- `GET /api/stock?warehouseId=xxx` - Filtrado por almacén
- `GET /api/stock?hasStock=true` - Solo con stock

### useProducts
Hook para obtener lista de productos (para filtro).

### useWarehouses
Hook para obtener lista de almacenes (para filtro).

## 🎨 Estados

### Loading
- Muestra `<Loading />` mientras carga datos iniciales
- Loading en modal de detalle para movimientos

### Error
- Muestra `<ErrorMessage />` si falla la carga
- Error en modal de detalle si fallan movimientos
- Botón "Reintentar"

### Empty
- Tabla muestra "No hay datos disponibles" si no hay stock
- "No hay movimientos registrados" si no hay movimientos
- Contador "0 de X ubicaciones"

## 🔄 Flujo de Trabajo

### Consultar Inventario
1. Página carga con todo el stock
2. Tarjetas de resumen muestran totales
3. Tabla muestra todas las ubicaciones
4. Usuario puede filtrar y buscar

### Filtrar por Producto
1. Seleccionar producto del dropdown
2. Hook se recarga con filtro
3. Tabla y tarjetas se actualizan
4. Solo muestra ubicaciones de ese producto

### Filtrar por Almacén
1. Seleccionar almacén del dropdown
2. Hook se recarga con filtro
3. Tabla y tarjetas se actualizan
4. Solo muestra ubicaciones de ese almacén

### Ver Detalle
1. Click en fila o icono 👁️
2. Modal se abre
3. Carga movimientos del producto en esa ubicación
4. Muestra últimos 10 movimientos
5. Usuario puede cerrar modal

### Búsqueda de Texto
1. Usuario escribe en campo de búsqueda
2. Filtrado en tiempo real (frontend)
3. Busca en: Producto, SKU, Almacén, Ubicación
4. Actualiza contador de resultados

## 📊 Tipos TypeScript

```typescript
interface StockLevel {
  id: string;
  productId: string;
  productSku?: string;
  productName?: string;
  locationId: string;
  locationCode?: string;
  locationName?: string | null;
  warehouseId?: string;
  warehouseName?: string;
  quantityAvailable: number;
  quantityReserved: number;
  quantityDamaged: number;
  quantityTotal: number;
  lastCountDate: string | null;
  updatedAt: string;
}

interface Movement {
  id: string;
  type: 'RECEIPT' | 'SHIPMENT' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'RESERVATION' | 'RELEASE' | 'DAMAGE';
  productId: string;
  productSku?: string;
  productName?: string;
  locationId: string;
  locationCode?: string;
  warehouseId?: string;
  warehouseName?: string;
  quantity: number;
  fromStatus?: string | null;
  toStatus?: string | null;
  date: string;
  userId: string;
  userEmail?: string;
  reason?: string | null;
  runningBalance: number;
}
```

## 🎯 Cálculos

### Totales Agregados
```typescript
const totals = filteredStock.reduce(
  (acc, item) => ({
    total: acc.total + item.quantityTotal,
    available: acc.available + item.quantityAvailable,
    reserved: acc.reserved + item.quantityReserved,
    damaged: acc.damaged + item.quantityDamaged,
  }),
  { total: 0, available: 0, reserved: 0, damaged: 0 }
);
```

### Filtrado de Búsqueda
```typescript
const filteredStock = stock.filter(item =>
  item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.productSku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.locationCode?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

## 🐛 Manejo de Errores

### Errores Comunes

**"No stock found"**
- Causa: No hay stock en el sistema
- Solución: Crear recepciones de productos

**"Product not found"**
- Causa: Producto filtrado no existe
- Solución: Verificar ID del producto

**"Warehouse not found"**
- Causa: Almacén filtrado no existe
- Solución: Verificar ID del almacén

**"Network Error"**
- Causa: Backend no disponible
- Solución: Verificar que backend esté corriendo

## 🚀 Mejoras Futuras

1. **Exportación**
   - Exportar a Excel
   - Exportar a PDF
   - Incluir filtros aplicados

2. **Gráficos**
   - Gráfico de distribución por almacén
   - Gráfico de stock disponible vs reservado
   - Tendencias de movimientos

3. **Lotes**
   - Mostrar información de lotes
   - Filtrar por lote
   - Ver vencimientos

4. **Alertas**
   - Resaltar stock bajo
   - Resaltar stock dañado alto
   - Alertas de vencimiento

5. **Acciones Rápidas**
   - Ajustar stock desde tabla
   - Reservar/Liberar desde tabla
   - Transferir entre ubicaciones

6. **Historial Completo**
   - Ver todos los movimientos (no solo 10)
   - Filtrar movimientos por fecha
   - Exportar historial

7. **Búsqueda Avanzada**
   - Filtro por rango de fechas
   - Filtro por tipo de movimiento
   - Filtro por usuario

8. **Consolidación**
   - Vista consolidada por producto
   - Vista consolidada por almacén
   - Comparación entre almacenes

## 📝 Ejemplos de Uso

### Consultar Todo el Stock
```typescript
const { stock } = useStock();
// Retorna todo el stock del sistema
```

### Filtrar por Producto
```typescript
const { stock } = useStock({ 
  productId: 'prod-123' 
});
// Retorna solo stock del producto especificado
```

### Filtrar por Almacén
```typescript
const { stock } = useStock({ 
  warehouseId: 'warehouse-456' 
});
// Retorna solo stock del almacén especificado
```

### Solo con Stock
```typescript
const { stock } = useStock({ 
  hasStock: true 
});
// Retorna solo ubicaciones con stock > 0
```

### Combinación de Filtros
```typescript
const { stock } = useStock({ 
  productId: 'prod-123',
  warehouseId: 'warehouse-456',
  hasStock: true
});
// Retorna stock del producto en el almacén con stock > 0
```

## ✅ Checklist de Pruebas

- [ ] Ver todo el inventario
- [ ] Tarjetas de resumen muestran totales correctos
- [ ] Búsqueda por nombre de producto
- [ ] Búsqueda por SKU
- [ ] Búsqueda por almacén
- [ ] Búsqueda por ubicación
- [ ] Filtro por producto funciona
- [ ] Filtro por almacén funciona
- [ ] Checkbox "Solo con stock" funciona
- [ ] Ver detalle de ubicación
- [ ] Movimientos recientes se cargan
- [ ] Movimientos muestran tipo correcto
- [ ] Cantidades positivas en verde
- [ ] Cantidades negativas en rojo
- [ ] Balance actualizado es correcto
- [ ] Modal cierra correctamente
- [ ] Botón actualizar funciona
- [ ] Responsive en mobile
- [ ] Manejo de errores funciona
- [ ] Estado vacío se muestra correctamente

## 🎓 Casos de Uso

### Operador de Almacén
- Consultar stock disponible de un producto
- Ver en qué ubicaciones está un producto
- Verificar movimientos recientes
- Identificar stock dañado

### Gerente de Inventario
- Ver resumen general de stock
- Identificar productos con stock bajo
- Analizar distribución por almacén
- Revisar movimientos sospechosos

### Administrador
- Auditar todo el inventario
- Verificar consistencia de datos
- Exportar reportes
- Analizar tendencias

## 📈 Métricas

La pantalla permite visualizar:
- Stock total del sistema
- Stock disponible para venta
- Stock reservado (comprometido)
- Stock dañado (pérdida)
- Distribución por almacén
- Distribución por ubicación
- Historial de movimientos
