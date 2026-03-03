# Transfers Module

Módulo para gestionar transferencias de inventario entre ubicaciones en el sistema de inventario DaCodes.

## Descripción

Este módulo permite crear y gestionar transferencias de productos entre diferentes ubicaciones (que pueden estar en el mismo almacén o en almacenes diferentes). El flujo incluye:

1. **Creación** (PENDING): Se crea la solicitud de transferencia
2. **Envío** (IN_TRANSIT): Se envía el inventario desde la ubicación origen
3. **Recepción** (COMPLETED): Se recibe el inventario en la ubicación destino
4. **Cancelación** (CANCELLED): Se puede cancelar en cualquier momento antes de completar

Cada cambio de estado genera movimientos de stock automáticos para mantener la trazabilidad completa.

## Características

- ✅ Transferencias entre ubicaciones del mismo o diferente almacén
- ✅ Validación de stock suficiente en origen
- ✅ Validación de ubicaciones activas
- ✅ Estados de transferencia (PENDING, IN_TRANSIT, COMPLETED, CANCELLED)
- ✅ Movimientos de stock automáticos (TRANSFER_OUT, TRANSFER_IN)
- ✅ Transacciones atómicas (todo o nada)
- ✅ Soporte para envío parcial
- ✅ Soporte para recepción parcial
- ✅ Tracking de lotes (opcional)
- ✅ Trazabilidad completa
- ✅ Estadísticas de transferencias

## Endpoints

### 1. Crear Transferencia
**POST** `/api/v1/transfers`

Crea una nueva solicitud de transferencia en estado PENDING.

**Request Body:**
```json
{
  "sourceLocationId": "uuid",
  "destinationLocationId": "uuid",
  "requestedDate": "2024-01-15T10:00:00Z",
  "requestedBy": "uuid",
  "items": [
    {
      "productId": "uuid",
      "lotId": "uuid",
      "quantityRequested": 50,
      "notes": "Handle with care"
    }
  ],
  "notes": "Urgent transfer for warehouse B"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "transferNumber": "TR-2024-0001",
    "sourceLocationId": "uuid",
    "sourceLocationCode": "A-01",
    "sourceWarehouseName": "Main Warehouse",
    "destinationLocationId": "uuid",
    "destinationLocationCode": "B-01",
    "destinationWarehouseName": "Secondary Warehouse",
    "status": "PENDING",
    "requestedDate": "2024-01-15T10:00:00Z",
    "shippedDate": null,
    "completedDate": null,
    "requestedBy": "uuid",
    "requestedByEmail": "user@example.com",
    "approvedBy": null,
    "approvedByEmail": null,
    "notes": "Urgent transfer for warehouse B",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productSku": "PROD-001",
        "productName": "Sample Product 1",
        "unitOfMeasure": "UNIT",
        "lotId": "uuid",
        "quantityRequested": 50,
        "quantityShipped": 0,
        "quantityReceived": 0,
        "notes": "Handle with care"
      }
    ],
    "totalItemsRequested": 50,
    "totalItemsShipped": 0,
    "totalItemsReceived": 0
  }
}
```

**Validaciones:**
- Ubicaciones origen y destino deben ser diferentes
- Ubicaciones deben existir y estar activas
- Productos deben existir y estar activos
- Stock suficiente en ubicación origen
- No se permiten productos duplicados
- Usuario debe existir y estar activo

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLocationId": "00000000-0000-0000-0000-000000000011",
    "destinationLocationId": "00000000-0000-0000-0000-000000000012",
    "requestedDate": "2024-01-15T10:00:00Z",
    "requestedBy": "user-uuid",
    "items": [
      {
        "productId": "product-uuid",
        "quantityRequested": 50
      }
    ]
  }'
```

---

### 2. Listar Transferencias
**GET** `/api/v1/transfers`

Obtiene todas las transferencias con filtros y paginación.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `pageSize` (opcional): Tamaño de página (default: 20, max: 100)
- `status` (opcional): Filtrar por estado (PENDING, IN_TRANSIT, COMPLETED, CANCELLED)
- `sourceLocationId` (opcional): Filtrar por ubicación origen
- `destinationLocationId` (opcional): Filtrar por ubicación destino
- `requestedDateFrom` (opcional): Fecha de solicitud desde (ISO 8601)
- `requestedDateTo` (opcional): Fecha de solicitud hasta (ISO 8601)
- `requestedBy` (opcional): Filtrar por usuario solicitante
- `sortBy` (opcional): Campo de ordenamiento (requestedDate, createdAt, status)
- `sortOrder` (opcional): Orden (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "transferNumber": "TR-2024-0001",
      "sourceLocationId": "uuid",
      "sourceLocationCode": "A-01",
      "sourceWarehouseName": "Main Warehouse",
      "destinationLocationId": "uuid",
      "destinationLocationCode": "B-01",
      "destinationWarehouseName": "Secondary Warehouse",
      "status": "PENDING",
      "requestedDate": "2024-01-15T10:00:00Z",
      "items": [...],
      "totalItemsRequested": 50,
      "totalItemsShipped": 0,
      "totalItemsReceived": 0
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

**Ejemplo cURL:**
```bash
# Listar todas las transferencias
curl http://localhost:3000/api/v1/transfers

# Filtrar por estado
curl "http://localhost:3000/api/v1/transfers?status=PENDING"

# Filtrar por ubicación origen
curl "http://localhost:3000/api/v1/transfers?sourceLocationId=uuid"

# Con paginación
curl "http://localhost:3000/api/v1/transfers?page=1&pageSize=10"
```

---

### 3. Obtener Transferencia por ID
**GET** `/api/v1/transfers/:id`

Obtiene los detalles de una transferencia específica.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "transferNumber": "TR-2024-0001",
    "sourceLocationId": "uuid",
    "sourceLocationCode": "A-01",
    "sourceWarehouseName": "Main Warehouse",
    "destinationLocationId": "uuid",
    "destinationLocationCode": "B-01",
    "destinationWarehouseName": "Secondary Warehouse",
    "status": "PENDING",
    "requestedDate": "2024-01-15T10:00:00Z",
    "shippedDate": null,
    "completedDate": null,
    "requestedBy": "uuid",
    "requestedByEmail": "user@example.com",
    "approvedBy": null,
    "approvedByEmail": null,
    "notes": "Urgent transfer",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productSku": "PROD-001",
        "productName": "Sample Product 1",
        "unitOfMeasure": "UNIT",
        "lotId": null,
        "quantityRequested": 50,
        "quantityShipped": 0,
        "quantityReceived": 0,
        "notes": null
      }
    ],
    "totalItemsRequested": 50,
    "totalItemsShipped": 0,
    "totalItemsReceived": 0
  }
}
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/v1/transfers/uuid
```

---

### 4. Actualizar Estado de Transferencia
**PATCH** `/api/v1/transfers/:id/status`

Actualiza el estado de una transferencia (sin mover inventario).

**Request Body:**
```json
{
  "status": "IN_TRANSIT",
  "approvedBy": "uuid"
}
```

**Transiciones válidas:**
- PENDING → IN_TRANSIT, CANCELLED
- IN_TRANSIT → COMPLETED, CANCELLED
- COMPLETED → (ninguna)
- CANCELLED → (ninguna)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "transferNumber": "TR-2024-0001",
    "status": "IN_TRANSIT",
    "approvedBy": "uuid",
    "approvedByEmail": "approver@example.com",
    ...
  }
}
```

**Ejemplo cURL:**
```bash
curl -X PATCH http://localhost:3000/api/v1/transfers/uuid/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_TRANSIT",
    "approvedBy": "approver-uuid"
  }'
```

---

### 5. Enviar Transferencia
**POST** `/api/v1/transfers/:id/ship`

Envía la transferencia, moviendo el inventario desde la ubicación origen.

**Request Body:**
```json
{
  "shippedDate": "2024-01-15T14:00:00Z",
  "items": [
    {
      "itemId": "uuid",
      "quantityShipped": 50
    }
  ]
}
```

**Proceso:**
1. Valida que la transferencia esté en estado PENDING
2. Valida stock suficiente en ubicación origen
3. Decrementa stock en ubicación origen
4. Crea movimiento TRANSFER_OUT
5. Actualiza estado a IN_TRANSIT
6. Registra fecha de envío

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "transferNumber": "TR-2024-0001",
    "status": "IN_TRANSIT",
    "shippedDate": "2024-01-15T14:00:00Z",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productSku": "PROD-001",
        "productName": "Sample Product 1",
        "quantityRequested": 50,
        "quantityShipped": 50,
        "quantityReceived": 0
      }
    ],
    "totalItemsShipped": 50
  }
}
```

**Validaciones:**
- Transferencia debe estar en estado PENDING
- Cantidad enviada no puede exceder cantidad solicitada
- Stock suficiente en ubicación origen
- Todos los items deben pertenecer a la transferencia

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/transfers/uuid/ship \
  -H "Content-Type: application/json" \
  -d '{
    "shippedDate": "2024-01-15T14:00:00Z",
    "items": [
      {
        "itemId": "item-uuid",
        "quantityShipped": 50
      }
    ]
  }'
```

---

### 6. Completar Transferencia
**POST** `/api/v1/transfers/:id/complete`

Completa la transferencia, recibiendo el inventario en la ubicación destino.

**Request Body:**
```json
{
  "completedDate": "2024-01-16T10:00:00Z",
  "items": [
    {
      "itemId": "uuid",
      "quantityReceived": 50
    }
  ]
}
```

**Proceso:**
1. Valida que la transferencia esté en estado IN_TRANSIT
2. Incrementa stock en ubicación destino
3. Crea movimiento TRANSFER_IN
4. Actualiza estado a COMPLETED
5. Registra fecha de completado

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "transferNumber": "TR-2024-0001",
    "status": "COMPLETED",
    "shippedDate": "2024-01-15T14:00:00Z",
    "completedDate": "2024-01-16T10:00:00Z",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productSku": "PROD-001",
        "productName": "Sample Product 1",
        "quantityRequested": 50,
        "quantityShipped": 50,
        "quantityReceived": 50
      }
    ],
    "totalItemsReceived": 50
  }
}
```

**Validaciones:**
- Transferencia debe estar en estado IN_TRANSIT
- Cantidad recibida no puede exceder cantidad enviada
- Todos los items deben pertenecer a la transferencia

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/transfers/uuid/complete \
  -H "Content-Type: application/json" \
  -d '{
    "completedDate": "2024-01-16T10:00:00Z",
    "items": [
      {
        "itemId": "item-uuid",
        "quantityReceived": 50
      }
    ]
  }'
```

---

### 7. Cancelar Transferencia
**POST** `/api/v1/transfers/:id/cancel`

Cancela una transferencia. Solo se puede cancelar si no está completada.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "transferNumber": "TR-2024-0001",
    "status": "CANCELLED",
    ...
  }
}
```

**Validaciones:**
- No se puede cancelar si está COMPLETED
- No se puede cancelar si ya está CANCELLED

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/transfers/uuid/cancel
```

---

### 8. Obtener Estadísticas
**GET** `/api/v1/transfers/statistics`

Obtiene estadísticas de transferencias.

**Query Parameters:**
- `status` (opcional): Filtrar por estado
- `sourceLocationId` (opcional): Filtrar por ubicación origen
- `destinationLocationId` (opcional): Filtrar por ubicación destino

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransfers": 10,
    "byStatus": {
      "PENDING": 2,
      "IN_TRANSIT": 3,
      "COMPLETED": 4,
      "CANCELLED": 1
    },
    "totalItemsTransferred": 500,
    "averageItemsPerTransfer": 50
  }
}
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/v1/transfers/statistics
```

---

## Flujo Completo de Transferencia

### Flujo Normal (Completo)
```
1. Crear transferencia (PENDING)
   POST /api/v1/transfers
   → Estado: PENDING
   → Stock: Sin cambios

2. Enviar transferencia (IN_TRANSIT)
   POST /api/v1/transfers/:id/ship
   → Estado: IN_TRANSIT
   → Stock origen: -50 unidades
   → Movimiento: TRANSFER_OUT creado

3. Completar transferencia (COMPLETED)
   POST /api/v1/transfers/:id/complete
   → Estado: COMPLETED
   → Stock destino: +50 unidades
   → Movimiento: TRANSFER_IN creado
```

### Flujo con Envío Parcial
```
1. Crear transferencia: 100 unidades solicitadas
2. Enviar: 50 unidades enviadas (parcial)
3. Completar: 50 unidades recibidas
4. Crear nueva transferencia para las 50 restantes
```

### Flujo con Recepción Parcial
```
1. Crear transferencia: 100 unidades solicitadas
2. Enviar: 100 unidades enviadas
3. Completar: 95 unidades recibidas (5 dañadas en tránsito)
4. Crear ajuste manual para las 5 unidades faltantes
```

### Flujo de Cancelación
```
1. Crear transferencia (PENDING)
2. Cancelar transferencia (CANCELLED)
   POST /api/v1/transfers/:id/cancel
   → Estado: CANCELLED
   → Stock: Sin cambios (no se movió inventario)
```

---

## Transacciones Atómicas

Cada operación que mueve inventario se ejecuta en una transacción de base de datos:

### Transacción de Envío
```
BEGIN TRANSACTION
  1. Actualizar transfer_item.quantityShipped
  2. Decrementar stock_level en ubicación origen
  3. Crear stock_movement (TRANSFER_OUT)
  4. Actualizar stock_transfer.status = IN_TRANSIT
  5. Actualizar stock_transfer.shippedDate
COMMIT TRANSACTION
```

### Transacción de Recepción
```
BEGIN TRANSACTION
  1. Actualizar transfer_item.quantityReceived
  2. Incrementar stock_level en ubicación destino (upsert)
  3. Crear stock_movement (TRANSFER_IN)
  4. Actualizar stock_transfer.status = COMPLETED
  5. Actualizar stock_transfer.completedDate
COMMIT TRANSACTION
```

---

## Validaciones de Negocio

### Validaciones de Creación
- ✅ Ubicaciones origen y destino diferentes
- ✅ Ubicaciones existen y están activas
- ✅ Productos existen y están activos
- ✅ Stock suficiente en ubicación origen
- ✅ No productos duplicados
- ✅ Usuario existe y está activo

### Validaciones de Envío
- ✅ Transferencia en estado PENDING
- ✅ Cantidad enviada ≤ cantidad solicitada
- ✅ Stock suficiente en ubicación origen
- ✅ Items pertenecen a la transferencia

### Validaciones de Recepción
- ✅ Transferencia en estado IN_TRANSIT
- ✅ Cantidad recibida ≤ cantidad enviada
- ✅ Items pertenecen a la transferencia

### Validaciones de Cancelación
- ✅ No se puede cancelar si está COMPLETED
- ✅ No se puede cancelar si ya está CANCELLED

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `TRANSFER_NOT_FOUND` | Transferencia no encontrada |
| `SAME_LOCATION` | Ubicaciones origen y destino son iguales |
| `SOURCE_LOCATION_NOT_FOUND` | Ubicación origen no encontrada |
| `SOURCE_LOCATION_INACTIVE` | Ubicación origen inactiva |
| `DESTINATION_LOCATION_NOT_FOUND` | Ubicación destino no encontrada |
| `DESTINATION_LOCATION_INACTIVE` | Ubicación destino inactiva |
| `PRODUCT_NOT_FOUND` | Producto no encontrado |
| `PRODUCT_INACTIVE` | Producto inactivo |
| `DUPLICATE_PRODUCTS` | Productos duplicados en transferencia |
| `INSUFFICIENT_STOCK` | Stock insuficiente en ubicación origen |
| `USER_NOT_FOUND` | Usuario no encontrado |
| `USER_INACTIVE` | Usuario inactivo |
| `INVALID_STATUS_TRANSITION` | Transición de estado inválida |
| `INVALID_STATUS` | Estado inválido para la operación |
| `ITEM_NOT_FOUND` | Item de transferencia no encontrado |
| `QUANTITY_EXCEEDED` | Cantidad excede lo permitido |

---

## Integración con Otros Módulos

### Locations
- Valida que las ubicaciones existan y estén activas
- Obtiene información de almacén para respuestas

### Products
- Valida que los productos existan y estén activos
- Obtiene información de productos para respuestas

### Stock
- Lee niveles de stock para validar disponibilidad
- Actualiza stock_level en origen y destino

### Movements
- Crea movimientos TRANSFER_OUT al enviar
- Crea movimientos TRANSFER_IN al recibir
- Mantiene running balance para auditoría

### Users
- Valida usuarios solicitantes y aprobadores
- Registra quién realizó cada acción

---

## Arquitectura del Módulo

```
transfers/
├── transfer.types.ts       # Tipos e interfaces TypeScript
├── transfer.validator.ts   # Esquemas de validación Zod
├── transfer.repository.ts  # Acceso a datos (Prisma)
├── transfer.service.ts     # Lógica de negocio
├── transfer.controller.ts  # Controladores HTTP
├── transfer.routes.ts      # Definición de rutas
└── README.md              # Documentación
```

**Patrón de diseño:** Repository → Service → Controller → Routes

---

## Próximas Mejoras

- [ ] Notificaciones automáticas al cambiar estado
- [ ] Tracking en tiempo real de transferencias
- [ ] Reportes de transferencias por período
- [ ] Integración con sistema de transporte
- [ ] Estimación de tiempo de llegada
- [ ] Fotos de evidencia de envío/recepción
- [ ] Firma digital del receptor
- [ ] Impresión de guías de transferencia
- [ ] Alertas de transferencias pendientes
- [ ] Dashboard de transferencias en tránsito
