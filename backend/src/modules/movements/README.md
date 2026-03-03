# Stock Movements Module

Módulo de registro y gestión de movimientos de stock en DaCodes Inventory.

## Estructura

```
movements/
├── movement.types.ts       # Tipos e interfaces TypeScript
├── movement.validator.ts   # Schemas de validación con Zod
├── movement.repository.ts  # Acceso a datos con Prisma
├── movement.service.ts     # Lógica de negocio
├── movement.controller.ts  # Controladores HTTP
├── movement.routes.ts      # Definición de rutas
└── README.md              # Esta documentación
```

## Características Principales

### Tipos de Movimiento
- **RECEIPT**: Recepción de mercancía
- **SHIPMENT**: Salida/envío
- **ADJUSTMENT**: Ajuste manual de inventario
- **TRANSFER_OUT**: Salida por transferencia
- **TRANSFER_IN**: Entrada por transferencia
- **EXPIRATION**: Baja por expiración
- **DAMAGE**: Baja por daño
- **RETURN**: Devolución
- **RESERVATION**: Reserva de stock
- **RELEASE**: Liberación de reserva

### Estados de Stock
- **AVAILABLE**: Disponible para venta/uso
- **RESERVED**: Reservado para órdenes
- **DAMAGED**: Dañado, no utilizable
- **QUARANTINE**: En cuarentena (pendiente inspección)

### Características Críticas
- ✅ Transacciones atómicas (movimiento + actualización de stock)
- ✅ Validación de stock negativo (configurable)
- ✅ Trazabilidad completa con running balance
- ✅ Cambios de estado (disponible → reservado, etc.)
- ✅ Soporte para lotes (opcional)
- ✅ Referencias a documentos externos (órdenes, transferencias)
- ✅ Auditoría completa (usuario, fecha, razón)

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1/movements
```

---

### 1. Create Movement

**POST** `/api/v1/movements`

Crea un movimiento de stock con actualización automática del nivel de stock.

**Request Body:**
```json
{
  "type": "ADJUSTMENT",
  "productId": "product-uuid",
  "locationId": "location-uuid",
  "lotId": "lot-uuid",
  "quantity": 10,
  "fromStatus": "AVAILABLE",
  "toStatus": "RESERVED",
  "userId": "user-uuid",
  "reason": "Manual adjustment",
  "referenceType": "purchase_order",
  "referenceId": "po-uuid",
  "notes": "Additional notes"
}
```

**Campos:**
- `type` (required): Tipo de movimiento
- `productId` (required): UUID del producto
- `locationId` (required): UUID de la ubicación
- `lotId` (optional): UUID del lote
- `quantity` (required): Cantidad (positivo = entrada, negativo = salida)
- `fromStatus` (optional): Estado origen (para cambios de estado)
- `toStatus` (optional): Estado destino (default: AVAILABLE)
- `userId` (required): UUID del usuario que registra el movimiento
- `reason` (optional): Razón del movimiento
- `referenceType` (optional): Tipo de documento relacionado
- `referenceId` (optional): ID del documento relacionado
- `notes` (optional): Notas adicionales

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "movement-uuid",
    "type": "ADJUSTMENT",
    "productId": "product-uuid",
    "productSku": "PROD-001",
    "productName": "Laptop Dell XPS 15",
    "locationId": "location-uuid",
    "locationCode": "A-01",
    "locationName": "Zone A - Shelf 1",
    "warehouseId": "warehouse-uuid",
    "warehouseName": "Main Warehouse",
    "lotId": "lot-uuid",
    "lotNumber": "LOT-2024-001",
    "quantity": 10,
    "fromStatus": "AVAILABLE",
    "toStatus": "RESERVED",
    "date": "2024-01-15T10:30:00.000Z",
    "userId": "user-uuid",
    "userEmail": "user@example.com",
    "reason": "Manual adjustment",
    "referenceType": "purchase_order",
    "referenceId": "po-uuid",
    "notes": "Additional notes",
    "runningBalance": 110
  }
}
```

**Business Logic:**
- Valida que producto, ubicación y usuario existan y estén activos
- Valida que el lote pertenezca al producto (si se especifica)
- Actualiza el nivel de stock en la misma transacción
- Calcula el running balance automáticamente
- Previene stock negativo (salvo configuración explícita)
- Maneja cambios de estado entre AVAILABLE, RESERVED, DAMAGED

---

### 2. Create Stock Adjustment (Simplified)

**POST** `/api/v1/movements/adjust`

API simplificada para ajustes manuales de inventario.

**Request Body:**
```json
{
  "productId": "product-uuid",
  "locationId": "location-uuid",
  "quantity": 5,
  "reason": "Physical count adjustment",
  "notes": "Found 5 extra units during count"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "movement-uuid",
    "type": "ADJUSTMENT",
    "quantity": 5,
    "runningBalance": 115,
    ...
  }
}
```

**Use Case**: Ajustes rápidos después de conteos físicos o correcciones de inventario.

---

### 3. Change Stock Status

**POST** `/api/v1/movements/change-status`

Cambia el estado del stock (ej: disponible → dañado).

**Request Body:**
```json
{
  "productId": "product-uuid",
  "locationId": "location-uuid",
  "quantity": 3,
  "fromStatus": "AVAILABLE",
  "toStatus": "DAMAGED",
  "reason": "Found damaged during inspection",
  "notes": "Water damage"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "movement-uuid",
    "type": "ADJUSTMENT",
    "quantity": 3,
    "fromStatus": "AVAILABLE",
    "toStatus": "DAMAGED",
    "runningBalance": 115,
    ...
  }
}
```

**Business Logic:**
- Decrementa el estado origen
- Incrementa el estado destino
- El total no cambia (solo redistribución entre estados)
- Valida que haya suficiente stock en el estado origen

**Use Case**: Marcar productos como dañados, mover a cuarentena, liberar reservas.

---

### 4. Get All Movements

**GET** `/api/v1/movements`

Obtiene todos los movimientos con filtros y paginación.

**Query Parameters:**
- `page` (optional): Número de página (default: 1)
- `pageSize` (optional): Items por página (default: 20, max: 100)
- `productId` (optional): Filtrar por producto (UUID)
- `locationId` (optional): Filtrar por ubicación (UUID)
- `warehouseId` (optional): Filtrar por almacén (UUID)
- `lotId` (optional): Filtrar por lote (UUID)
- `type` (optional): Filtrar por tipo de movimiento
- `userId` (optional): Filtrar por usuario (UUID)
- `dateFrom` (optional): Fecha desde (ISO 8601)
- `dateTo` (optional): Fecha hasta (ISO 8601)
- `referenceType` (optional): Tipo de referencia
- `referenceId` (optional): ID de referencia (UUID)
- `sortBy` (optional): Campo para ordenar (date, type, quantity)
- `sortOrder` (optional): Orden (asc, desc)

**Example Request:**
```
GET /api/v1/movements?productId=uuid&dateFrom=2024-01-01&dateTo=2024-01-31&sortBy=date&sortOrder=desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "movement-uuid",
      "type": "ADJUSTMENT",
      "quantity": 10,
      "date": "2024-01-15T10:30:00.000Z",
      "runningBalance": 110,
      ...
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

### 5. Get Movement by ID

**GET** `/api/v1/movements/:id`

Obtiene un movimiento específico por ID.

**Example Request:**
```
GET /api/v1/movements/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "movement-uuid",
    "type": "ADJUSTMENT",
    "productId": "product-uuid",
    "productSku": "PROD-001",
    "productName": "Laptop Dell XPS 15",
    "quantity": 10,
    "runningBalance": 110,
    ...
  }
}
```

---

### 6. Get Movement Summary

**GET** `/api/v1/movements/summary`

Obtiene resumen estadístico de movimientos.

**Query Parameters:**
- `productId` (optional): Filtrar por producto
- `locationId` (optional): Filtrar por ubicación
- `warehouseId` (optional): Filtrar por almacén
- `dateFrom` (optional): Fecha desde
- `dateTo` (optional): Fecha hasta

**Example Request:**
```
GET /api/v1/movements/summary?warehouseId=uuid&dateFrom=2024-01-01&dateTo=2024-01-31
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalMovements": 450,
    "totalInbound": 280,
    "totalOutbound": 150,
    "totalAdjustments": 20,
    "byType": {
      "RECEIPT": 200,
      "SHIPMENT": 150,
      "ADJUSTMENT": 20,
      "TRANSFER_IN": 50,
      "TRANSFER_OUT": 30
    }
  }
}
```

**Use Case**: Dashboard de actividad, reportes de movimientos.

---

### 7. Get Movement History

**GET** `/api/v1/movements/history/:productId/:locationId`

Obtiene historial de movimientos para un producto en una ubicación específica.

**Query Parameters:**
- `limit` (optional): Número máximo de registros (default: 50)

**Example Request:**
```
GET /api/v1/movements/history/product-uuid/location-uuid?limit=100
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "movement-uuid",
      "type": "RECEIPT",
      "quantity": 50,
      "date": "2024-01-15T10:30:00.000Z",
      "runningBalance": 110,
      ...
    },
    {
      "id": "movement-uuid-2",
      "type": "SHIPMENT",
      "quantity": -20,
      "date": "2024-01-14T15:00:00.000Z",
      "runningBalance": 60,
      ...
    }
  ]
}
```

**Use Case**: Auditoría de movimientos, investigación de discrepancias.

---

## Testing with cURL

### Create stock adjustment (increase)
```bash
curl -X POST http://localhost:3000/api/v1/movements/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid",
    "locationId": "location-uuid",
    "quantity": 10,
    "reason": "Physical count adjustment"
  }'
```

### Create stock adjustment (decrease)
```bash
curl -X POST http://localhost:3000/api/v1/movements/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid",
    "locationId": "location-uuid",
    "quantity": -5,
    "reason": "Damaged units removed"
  }'
```

### Change stock status (available to damaged)
```bash
curl -X POST http://localhost:3000/api/v1/movements/change-status \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid",
    "locationId": "location-uuid",
    "quantity": 3,
    "fromStatus": "AVAILABLE",
    "toStatus": "DAMAGED",
    "reason": "Found damaged during inspection"
  }'
```

### Get all movements with filters
```bash
# All movements for a product
curl "http://localhost:3000/api/v1/movements?productId=product-uuid"

# Movements in date range
curl "http://localhost:3000/api/v1/movements?dateFrom=2024-01-01&dateTo=2024-01-31"

# Movements by type
curl "http://localhost:3000/api/v1/movements?type=ADJUSTMENT"
```

### Get movement history
```bash
curl "http://localhost:3000/api/v1/movements/history/product-uuid/location-uuid?limit=50"
```

### Get movement summary
```bash
curl "http://localhost:3000/api/v1/movements/summary?warehouseId=warehouse-uuid&dateFrom=2024-01-01"
```

---

## Transaction Logic

### Atomic Operations
Cada movimiento se ejecuta en una transacción de base de datos que:

1. **Lee el stock actual**
2. **Calcula el nuevo balance**
3. **Valida restricciones** (stock negativo, estados)
4. **Actualiza StockLevel** (upsert)
5. **Crea registro de StockMovement**
6. **Commit o Rollback** (todo o nada)

```typescript
// Ejemplo de transacción
await prisma.$transaction(async (tx) => {
  // 1. Get current stock
  const currentStock = await tx.stockLevel.findUnique(...);
  
  // 2. Calculate new balance
  const runningBalance = currentBalance + quantity;
  
  // 3. Validate
  if (!allowNegativeStock && runningBalance < 0) {
    throw new Error('Insufficient stock');
  }
  
  // 4. Update stock level
  await tx.stockLevel.upsert(...);
  
  // 5. Create movement record
  await tx.stockMovement.create(...);
});
```

---

## Stock Status Changes

### Cambio de Estado (Status Change)
Cuando se cambia el estado del stock (ej: AVAILABLE → DAMAGED):

- **Quantity**: Siempre positivo (cantidad a mover)
- **fromStatus**: Estado origen (se decrementa)
- **toStatus**: Estado destino (se incrementa)
- **Total**: No cambia (solo redistribución)

**Ejemplo:**
```
Stock actual:
- Available: 100
- Reserved: 20
- Damaged: 5
- Total: 125

Movimiento: 10 unidades de AVAILABLE → DAMAGED

Stock después:
- Available: 90  (100 - 10)
- Reserved: 20  (sin cambio)
- Damaged: 15   (5 + 10)
- Total: 125    (sin cambio)
```

### Movimiento Regular (Inbound/Outbound)
Cuando se agrega o quita stock:

- **Quantity**: Positivo (entrada) o negativo (salida)
- **toStatus**: Estado destino (default: AVAILABLE)
- **Total**: Cambia

**Ejemplo:**
```
Stock actual:
- Available: 100
- Total: 125

Movimiento: +50 unidades (RECEIPT)

Stock después:
- Available: 150  (100 + 50)
- Total: 175      (125 + 50)
```

---

## Running Balance

El campo `runningBalance` mantiene el balance total después de cada movimiento:

```
Movement 1: +100 → Balance: 100
Movement 2: +50  → Balance: 150
Movement 3: -20  → Balance: 130
Movement 4: +10  → Balance: 140
```

Esto permite:
- Auditoría completa del historial
- Detección de discrepancias
- Reconstrucción del estado en cualquier punto del tiempo

---

## Validation Rules

### Stock Negativo
Por defecto, el sistema **NO permite stock negativo**:
- Valida antes de crear el movimiento
- Lanza error `INSUFFICIENT_STOCK` si no hay suficiente
- Configurable con `allowNegativeStock: true` en el servicio

### Validaciones de Negocio
- ✅ Producto debe existir y estar activo
- ✅ Ubicación debe existir y estar activa
- ✅ Usuario debe existir y estar activo
- ✅ Lote debe pertenecer al producto (si se especifica)
- ✅ Quantity no puede ser cero
- ✅ fromStatus y toStatus deben ser diferentes (en cambios de estado)
- ✅ Debe haber suficiente stock en el estado origen

---

## Error Codes

| Code | Description |
|------|-------------|
| `MOVEMENT_NOT_FOUND` | Movement not found |
| `PRODUCT_NOT_FOUND` | Product not found |
| `PRODUCT_INACTIVE` | Product is inactive |
| `LOCATION_NOT_FOUND` | Location not found |
| `LOCATION_INACTIVE` | Location is inactive |
| `LOT_NOT_FOUND` | Lot not found |
| `LOT_PRODUCT_MISMATCH` | Lot does not belong to product |
| `USER_NOT_FOUND` | User not found |
| `USER_INACTIVE` | User is inactive |
| `INSUFFICIENT_STOCK` | Not enough stock available |
| `INVALID_PAGE` | Invalid page number |
| `INVALID_PAGE_SIZE` | Invalid page size |

---

## Integration Points

### Módulos que usan Movements

**Recepciones** (futuro):
```typescript
// Al recibir mercancía
await movementService.createMovement({
  type: 'RECEIPT',
  productId,
  locationId,
  quantity: receivedQuantity,
  userId,
  referenceType: 'purchase_order',
  referenceId: purchaseOrderId,
  reason: 'Purchase order receipt',
});
```

**Transferencias** (futuro):
```typescript
// Salida de ubicación origen
await movementService.createMovement({
  type: 'TRANSFER_OUT',
  productId,
  locationId: sourceLocationId,
  quantity: -transferQuantity,
  userId,
  referenceType: 'transfer',
  referenceId: transferId,
});

// Entrada a ubicación destino
await movementService.createMovement({
  type: 'TRANSFER_IN',
  productId,
  locationId: destinationLocationId,
  quantity: transferQuantity,
  userId,
  referenceType: 'transfer',
  referenceId: transferId,
});
```

**Reservas** (futuro):
```typescript
// Reservar stock para una orden
await movementService.reserveStock(
  productId,
  locationId,
  quantity,
  userId,
  'sales_order',
  orderId
);

// Liberar reserva al cancelar
await movementService.releaseStock(
  productId,
  locationId,
  quantity,
  userId,
  'sales_order',
  orderId
);
```

---

## Performance Considerations

### Índices Optimizados
- `productId` - Búsquedas por producto
- `locationId` - Búsquedas por ubicación
- `lotId` - Búsquedas por lote
- `date` - Ordenamiento y filtros por fecha
- `type` - Filtros por tipo de movimiento
- `(referenceType, referenceId)` - Búsquedas por documento relacionado

### Transacciones
- Usa transacciones de Prisma para atomicidad
- Timeout configurado para evitar bloqueos largos
- Isolation level adecuado para prevenir race conditions

### Queries Eficientes
- Includes selectivos (solo campos necesarios)
- Paginación en todas las listas
- Agregaciones en base de datos

---

## Future Enhancements

- [ ] Batch movements (múltiples productos en una transacción)
- [ ] Movement approval workflow
- [ ] Automatic movement generation from events
- [ ] Movement templates for common operations
- [ ] Movement reversal/cancellation
- [ ] Integration with barcode scanning
- [ ] Real-time movement notifications
- [ ] Movement analytics and reporting
- [ ] Export movement history to CSV/Excel
- [ ] Movement scheduling (future-dated movements)

---

## Dependencies

- `@prisma/client`: Database ORM
- `zod`: Schema validation
- `express`: Web framework

---

## Notes

- Este módulo es crítico para la integridad del inventario
- Todas las operaciones usan transacciones atómicas
- El running balance permite auditoría completa
- Los cambios de estado no afectan el total, solo redistribuyen
- El sistema previene stock negativo por defecto
- Cada movimiento queda registrado permanentemente para trazabilidad
