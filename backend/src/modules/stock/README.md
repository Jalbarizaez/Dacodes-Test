# Stock Module

Módulo de consulta y gestión de niveles de stock en DaCodes Inventory.

## Estructura

```
stock/
├── stock.types.ts       # Tipos e interfaces TypeScript
├── stock.validator.ts   # Schemas de validación con Zod
├── stock.repository.ts  # Acceso a datos con Prisma
├── stock.service.ts     # Lógica de negocio
├── stock.controller.ts  # Controladores HTTP
├── stock.routes.ts      # Definición de rutas
└── README.md           # Esta documentación
```

## Características Principales

### Estados de Stock
El sistema mantiene tres estados de stock por ubicación:
- **Available** (Disponible): Stock disponible para venta/uso
- **Reserved** (Reservado): Stock reservado para órdenes pendientes
- **Damaged** (Dañado): Stock dañado, no utilizable
- **Total**: Suma de los tres estados anteriores

### Consultas Consolidadas
- Por producto (todas las ubicaciones)
- Por almacén (todos los productos)
- Por ubicación (todos los productos)

### Helpers para Integración
- Verificación de stock disponible
- Cálculo de stock total
- Alertas de stock bajo

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1/stock
```

---

### 1. Get All Stock Levels

**GET** `/api/v1/stock`

Obtiene todos los niveles de stock con filtros y paginación.

**Query Parameters:**
- `page` (optional): Número de página (default: 1)
- `pageSize` (optional): Items por página (default: 20, max: 100)
- `productId` (optional): Filtrar por producto (UUID)
- `warehouseId` (optional): Filtrar por almacén (UUID)
- `locationId` (optional): Filtrar por ubicación (UUID)
- `hasStock` (optional): Filtrar ubicaciones con stock > 0 (true/false)
- `sortBy` (optional): Campo para ordenar (productName, locationCode, quantityTotal, updatedAt)
- `sortOrder` (optional): Orden (asc, desc)

**Example Request:**
```
GET /api/v1/stock?warehouseId=uuid&hasStock=true&page=1&pageSize=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "productId": "product-uuid",
      "productSku": "PROD-001",
      "productName": "Laptop Dell XPS 15",
      "locationId": "location-uuid",
      "locationCode": "A-01",
      "locationName": "Zone A - Shelf 1",
      "warehouseId": "warehouse-uuid",
      "warehouseName": "Main Warehouse",
      "quantityAvailable": 45,
      "quantityReserved": 5,
      "quantityDamaged": 2,
      "quantityTotal": 52,
      "lastCountDate": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 2. Get Stock by Product

**GET** `/api/v1/stock/product/:productId`

Obtiene stock consolidado de un producto en todas las ubicaciones.

**Example Request:**
```
GET /api/v1/stock/product/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "productSku": "PROD-001",
    "productName": "Laptop Dell XPS 15",
    "totalAvailable": 120,
    "totalReserved": 15,
    "totalDamaged": 5,
    "totalStock": 140,
    "locationCount": 3,
    "locations": [
      {
        "id": "uuid",
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "productSku": "PROD-001",
        "productName": "Laptop Dell XPS 15",
        "locationId": "location-uuid-1",
        "locationCode": "A-01",
        "locationName": "Zone A - Shelf 1",
        "warehouseId": "warehouse-uuid",
        "warehouseName": "Main Warehouse",
        "quantityAvailable": 45,
        "quantityReserved": 5,
        "quantityDamaged": 2,
        "quantityTotal": 52,
        "lastCountDate": "2024-01-10T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": "uuid",
        "locationId": "location-uuid-2",
        "locationCode": "B-03",
        "quantityAvailable": 75,
        "quantityReserved": 10,
        "quantityDamaged": 3,
        "quantityTotal": 88,
        ...
      }
    ]
  }
}
```

**Use Case**: Ver todo el stock de un producto específico distribuido en diferentes ubicaciones.

---

### 3. Get Stock by Warehouse

**GET** `/api/v1/stock/warehouse/:warehouseId`

Obtiene stock consolidado de un almacén (todos los productos).

**Example Request:**
```
GET /api/v1/stock/warehouse/warehouse-uuid
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "warehouseId": "warehouse-uuid",
    "warehouseName": "Main Warehouse",
    "totalAvailable": 5420,
    "totalReserved": 380,
    "totalDamaged": 45,
    "totalStock": 5845,
    "productCount": 125,
    "locationCount": 45,
    "products": [
      {
        "productId": "product-uuid-1",
        "productSku": "PROD-001",
        "productName": "Laptop Dell XPS 15",
        "available": 120,
        "reserved": 15,
        "damaged": 5,
        "total": 140
      },
      {
        "productId": "product-uuid-2",
        "productSku": "PROD-002",
        "productName": "Monitor LG 27\"",
        "available": 85,
        "reserved": 10,
        "damaged": 2,
        "total": 97
      }
    ]
  }
}
```

**Use Case**: Dashboard de almacén, ver inventario completo de un almacén.

---

### 4. Get Stock by Location

**GET** `/api/v1/stock/location/:locationId`

Obtiene stock consolidado de una ubicación específica (todos los productos).

**Example Request:**
```
GET /api/v1/stock/location/location-uuid
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "locationId": "location-uuid",
    "locationCode": "A-01",
    "locationName": "Zone A - Shelf 1",
    "warehouseId": "warehouse-uuid",
    "warehouseName": "Main Warehouse",
    "totalAvailable": 245,
    "totalReserved": 25,
    "totalDamaged": 8,
    "totalStock": 278,
    "productCount": 12,
    "products": [
      {
        "productId": "product-uuid-1",
        "productSku": "PROD-001",
        "productName": "Laptop Dell XPS 15",
        "available": 45,
        "reserved": 5,
        "damaged": 2,
        "total": 52
      },
      {
        "productId": "product-uuid-2",
        "productSku": "PROD-002",
        "productName": "Monitor LG 27\"",
        "available": 30,
        "reserved": 3,
        "damaged": 1,
        "total": 34
      }
    ]
  }
}
```

**Use Case**: Ver qué productos están en una ubicación específica, útil para picking o conteo físico.

---

### 5. Get Low Stock Alerts

**GET** `/api/v1/stock/alerts/low-stock`

Obtiene alertas de productos con stock bajo (por debajo del mínimo configurado).

**Example Request:**
```
GET /api/v1/stock/alerts/low-stock
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "productId": "product-uuid-1",
      "productSku": "PROD-001",
      "productName": "Laptop Dell XPS 15",
      "minStock": 50,
      "currentStock": 35,
      "deficit": 15
    },
    {
      "productId": "product-uuid-2",
      "productSku": "PROD-002",
      "productName": "Monitor LG 27\"",
      "minStock": 100,
      "currentStock": 75,
      "deficit": 25
    }
  ]
}
```

**Business Logic**:
- Solo incluye productos con `minStock` configurado
- Solo incluye productos activos
- Compara stock disponible total contra `minStock`
- Calcula el déficit (cuánto falta para llegar al mínimo)

**Use Case**: Dashboard de alertas, notificaciones automáticas, generación de órdenes de compra.

---

## Testing with cURL

### Get all stock levels
```bash
curl http://localhost:3000/api/v1/stock
```

### Get stock with filters
```bash
# Stock with quantity > 0
curl "http://localhost:3000/api/v1/stock?hasStock=true"

# Stock by warehouse
curl "http://localhost:3000/api/v1/stock?warehouseId=warehouse-uuid"

# Stock by product
curl "http://localhost:3000/api/v1/stock?productId=product-uuid"
```

### Get consolidated stock by product
```bash
curl http://localhost:3000/api/v1/stock/product/product-uuid
```

### Get consolidated stock by warehouse
```bash
curl http://localhost:3000/api/v1/stock/warehouse/warehouse-uuid
```

### Get consolidated stock by location
```bash
curl http://localhost:3000/api/v1/stock/location/location-uuid
```

### Get low stock alerts
```bash
curl http://localhost:3000/api/v1/stock/alerts/low-stock
```

---

## Helper Methods (Service Layer)

El servicio incluye métodos helper para integración con otros módulos:

### hasAvailableStock()
```typescript
await stockService.hasAvailableStock(productId, locationId, requiredQuantity);
// Returns: boolean
```
Verifica si hay suficiente stock disponible en una ubicación.

### getAvailableStock()
```typescript
await stockService.getAvailableStock(productId, locationId);
// Returns: number
```
Obtiene la cantidad disponible de un producto en una ubicación.

### getTotalAvailableStock()
```typescript
await stockService.getTotalAvailableStock(productId);
// Returns: number
```
Obtiene el stock disponible total de un producto en todas las ubicaciones.

**Uso en otros módulos**:
```typescript
// En módulo de transferencias
const hasStock = await stockService.hasAvailableStock(
  productId, 
  sourceLocationId, 
  transferQuantity
);

if (!hasStock) {
  throw new AppError('INSUFFICIENT_STOCK', 'Not enough stock for transfer');
}
```

---

## Stock Calculation Logic

### Cálculo de Total
```
quantityTotal = quantityAvailable + quantityReserved + quantityDamaged
```

### Actualización Automática
- El campo `quantityTotal` se calcula automáticamente en cada operación
- Se actualiza en el repository al hacer upsert o update
- Garantiza consistencia de datos

### Agregaciones
- Las consultas consolidadas usan `SUM` de Prisma
- Eficiente para grandes volúmenes de datos
- Cálculos en base de datos (no en memoria)

---

## Integration Points

### Preparado para:

**Movimientos de Stock** (futuro):
- Incrementar/decrementar stock disponible
- Cambiar estado (disponible → reservado)
- Registrar movimientos en audit trail

**Transferencias** (futuro):
- Verificar stock disponible en origen
- Decrementar en origen, incrementar en destino
- Transacciones atómicas

**Recepciones** (futuro):
- Incrementar stock disponible
- Crear registro de movimiento
- Actualizar órdenes de compra

**Reservas** (futuro):
- Mover de disponible a reservado
- Liberar reservas (reservado → disponible)
- Timeout automático de reservas

---

## Business Rules

### Stock Disponible
- Puede ser usado para ventas/transferencias
- Se decrementa en envíos
- Se incrementa en recepciones

### Stock Reservado
- Asignado a órdenes pendientes
- No disponible para nuevas ventas
- Se libera al cancelar orden o al enviar

### Stock Dañado
- No utilizable
- Requiere decisión (reparar, desechar, devolver)
- No cuenta para disponibilidad

### Validaciones
- Stock nunca puede ser negativo
- Total siempre es suma de los tres estados
- Cambios de estado requieren movimiento registrado

---

## Error Codes

| Code | Description |
|------|-------------|
| `PRODUCT_NOT_FOUND` | Product not found |
| `WAREHOUSE_NOT_FOUND` | Warehouse not found |
| `LOCATION_NOT_FOUND` | Location not found |
| `INSUFFICIENT_STOCK` | Not enough available stock |
| `INVALID_PAGE` | Invalid page number |
| `INVALID_PAGE_SIZE` | Invalid page size |

---

## Performance Considerations

### Índices Optimizados
- `(productId, locationId)` - Unique constraint y búsqueda rápida
- `productId` - Consultas por producto
- `locationId` - Consultas por ubicación
- `quantityAvailable` - Queries de stock bajo

### Queries Eficientes
- Agregaciones en base de datos
- Includes selectivos (solo campos necesarios)
- Paginación en todas las listas

### Caching Recommendations
- Stock consolidado por producto (TTL: 5 min)
- Alertas de stock bajo (TTL: 15 min)
- Stock por almacén (TTL: 10 min)

---

## Future Enhancements

- [ ] Stock adjustments (manual corrections)
- [ ] Stock reservations with timeout
- [ ] Stock movements tracking
- [ ] Batch/lot tracking integration
- [ ] Stock forecasting
- [ ] Automatic reorder suggestions
- [ ] Stock valuation (FIFO/LIFO/Average)
- [ ] Physical count reconciliation
- [ ] Stock aging reports
- [ ] Multi-currency stock valuation

---

## Dependencies

- `@prisma/client`: Database ORM
- `zod`: Schema validation
- `express`: Web framework

---

## Notes

- Este módulo solo maneja consultas de stock
- Las operaciones de modificación (transferencias, recepciones) se implementarán en módulos separados
- Los helper methods están listos para integración con otros módulos
- Todos los cálculos de totales son automáticos y consistentes
