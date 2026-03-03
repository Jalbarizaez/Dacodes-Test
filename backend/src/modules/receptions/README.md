# Receptions Module

Módulo para gestionar la recepción de órdenes de compra en el sistema de inventario DaCodes.

## Descripción

Este módulo permite registrar la recepción de productos de órdenes de compra, actualizando automáticamente:
- Cantidades recibidas en las líneas de la orden de compra
- Niveles de stock en las ubicaciones especificadas
- Movimientos de stock (tipo RECEIPT)
- Estado de la orden de compra (SUBMITTED → PARTIALLY_RECEIVED → RECEIVED)

Soporta recepciones parciales, múltiples recepciones por orden, y tracking de lotes y fechas de expiración.

## Características

- ✅ Recepción completa o parcial de órdenes de compra
- ✅ Múltiples recepciones por orden de compra
- ✅ Tracking de lotes (batch numbers)
- ✅ Tracking de fechas de expiración
- ✅ Actualización automática de stock
- ✅ Creación automática de movimientos de stock
- ✅ Actualización automática del estado de la orden de compra
- ✅ Validación de sobre-recepción
- ✅ Validación de ubicaciones activas
- ✅ Transacciones atómicas (todo o nada)
- ✅ Trazabilidad completa

## Endpoints

### 1. Crear Recepción
**POST** `/api/v1/receptions`

Registra la recepción de productos de una orden de compra.

**Request Body:**
```json
{
  "purchaseOrderId": "uuid",
  "receivedDate": "2024-01-15T10:30:00Z",
  "receivedBy": "Juan Pérez",
  "items": [
    {
      "lineItemId": "uuid",
      "receivedQuantity": 50,
      "locationId": "uuid",
      "batchNumber": "BATCH-2024-001",
      "expirationDate": "2025-12-31T00:00:00Z"
    }
  ],
  "notes": "Recepción completa sin daños"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reception created successfully",
  "data": {
    "receptionId": "uuid",
    "purchaseOrderId": "uuid",
    "orderNumber": "PO-2024-0001",
    "totalItemsReceived": 50,
    "stockMovementsCreated": 1,
    "purchaseOrderStatus": "RECEIVED",
    "completionPercentage": 100
  },
  "metadata": {
    "receptionId": "uuid",
    "purchaseOrderStatus": "RECEIVED",
    "completionPercentage": 100
  }
}
```

**Validaciones:**
- La orden de compra debe existir
- La orden debe estar en estado SUBMITTED o PARTIALLY_RECEIVED
- Todos los line items deben pertenecer a la orden
- No se puede recibir más de lo ordenado
- Las ubicaciones deben existir y estar activas
- Las fechas de expiración deben ser futuras
- No se permiten line items duplicados

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/receptions \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "123e4567-e89b-12d3-a456-426614174000",
    "receivedDate": "2024-01-15T10:30:00Z",
    "receivedBy": "Juan Pérez",
    "items": [
      {
        "lineItemId": "123e4567-e89b-12d3-a456-426614174001",
        "receivedQuantity": 50,
        "locationId": "123e4567-e89b-12d3-a456-426614174002",
        "batchNumber": "BATCH-2024-001",
        "expirationDate": "2025-12-31T00:00:00Z"
      }
    ]
  }'
```

---

### 2. Listar Recepciones
**GET** `/api/v1/receptions`

Obtiene todas las recepciones con filtros y paginación.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `pageSize` (opcional): Tamaño de página (default: 20, max: 100)
- `purchaseOrderId` (opcional): Filtrar por orden de compra
- `receivedDateFrom` (opcional): Fecha de recepción desde (ISO 8601)
- `receivedDateTo` (opcional): Fecha de recepción hasta (ISO 8601)
- `receivedBy` (opcional): Filtrar por quien recibió (búsqueda parcial)
- `sortBy` (opcional): Campo de ordenamiento (receivedDate, createdAt)
- `sortOrder` (opcional): Orden (asc, desc)

**Response:**
```json
{
  "success": true,
  "message": "Receptions retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "purchaseOrderId": "uuid",
      "orderNumber": "PO-2024-0001",
      "supplierName": "Proveedor ABC",
      "receivedDate": "2024-01-15T10:30:00Z",
      "receivedBy": "Juan Pérez",
      "createdAt": "2024-01-15T10:35:00Z",
      "items": [
        {
          "id": "uuid",
          "lineItemId": "uuid",
          "productId": "uuid",
          "productSku": "PROD-001",
          "productName": "Producto A",
          "receivedQuantity": 50,
          "locationId": "uuid",
          "batchNumber": "BATCH-2024-001",
          "expirationDate": "2025-12-31T00:00:00Z",
          "orderedQuantity": 100,
          "previouslyReceived": 0,
          "totalReceived": 50,
          "pendingQuantity": 50
        }
      ],
      "totalItemsReceived": 50
    }
  ],
  "metadata": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Ejemplo cURL:**
```bash
# Listar todas las recepciones
curl http://localhost:3000/api/v1/receptions

# Filtrar por orden de compra
curl "http://localhost:3000/api/v1/receptions?purchaseOrderId=123e4567-e89b-12d3-a456-426614174000"

# Filtrar por rango de fechas
curl "http://localhost:3000/api/v1/receptions?receivedDateFrom=2024-01-01T00:00:00Z&receivedDateTo=2024-01-31T23:59:59Z"

# Con paginación
curl "http://localhost:3000/api/v1/receptions?page=1&pageSize=10"
```

---

### 3. Obtener Recepción por ID
**GET** `/api/v1/receptions/:id`

Obtiene los detalles de una recepción específica.

**Response:**
```json
{
  "success": true,
  "message": "Reception retrieved successfully",
  "data": {
    "id": "uuid",
    "purchaseOrderId": "uuid",
    "orderNumber": "PO-2024-0001",
    "supplierName": "Proveedor ABC",
    "receivedDate": "2024-01-15T10:30:00Z",
    "receivedBy": "Juan Pérez",
    "createdAt": "2024-01-15T10:35:00Z",
    "items": [
      {
        "id": "uuid",
        "lineItemId": "uuid",
        "productId": "uuid",
        "productSku": "PROD-001",
        "productName": "Producto A",
        "receivedQuantity": 50,
        "locationId": "uuid",
        "batchNumber": "BATCH-2024-001",
        "expirationDate": "2025-12-31T00:00:00Z",
        "orderedQuantity": 100,
        "previouslyReceived": 0,
        "totalReceived": 50,
        "pendingQuantity": 50
      }
    ],
    "totalItemsReceived": 50
  }
}
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/v1/receptions/123e4567-e89b-12d3-a456-426614174000
```

---

### 4. Obtener Recepciones por Orden de Compra
**GET** `/api/v1/receptions/purchase-order/:purchaseOrderId`

Obtiene todas las recepciones de una orden de compra específica.

**Response:**
```json
{
  "success": true,
  "message": "Receptions retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "purchaseOrderId": "uuid",
      "orderNumber": "PO-2024-0001",
      "supplierName": "Proveedor ABC",
      "receivedDate": "2024-01-15T10:30:00Z",
      "receivedBy": "Juan Pérez",
      "createdAt": "2024-01-15T10:35:00Z",
      "items": [...],
      "totalItemsReceived": 50
    }
  ],
  "metadata": {
    "count": 1
  }
}
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/v1/receptions/purchase-order/123e4567-e89b-12d3-a456-426614174000
```

---

## Flujo de Recepción

### 1. Recepción Completa
```
1. Usuario crea recepción con todas las cantidades ordenadas
2. Sistema valida orden de compra y line items
3. Sistema crea recepción y items
4. Sistema actualiza receivedQuantity en line items
5. Sistema actualiza stock en ubicaciones
6. Sistema crea movimientos de stock (tipo RECEIPT)
7. Sistema actualiza estado de PO a RECEIVED
8. Sistema retorna resumen con 100% completado
```

### 2. Recepción Parcial
```
1. Usuario crea recepción con parte de las cantidades ordenadas
2. Sistema valida que no se exceda lo ordenado
3. Sistema procesa recepción (pasos 3-6 del flujo completo)
4. Sistema actualiza estado de PO a PARTIALLY_RECEIVED
5. Sistema retorna resumen con % de completado
6. Usuario puede crear recepciones adicionales hasta completar
```

### 3. Múltiples Recepciones
```
Recepción 1: 50 unidades → PO status: PARTIALLY_RECEIVED (50%)
Recepción 2: 30 unidades → PO status: PARTIALLY_RECEIVED (80%)
Recepción 3: 20 unidades → PO status: RECEIVED (100%)
```

---

## Transacciones Atómicas

Cada recepción se procesa en una transacción de base de datos que garantiza:

1. **Atomicidad**: Todo o nada - si falla cualquier paso, se revierte todo
2. **Consistencia**: Stock, movimientos y estado de PO siempre sincronizados
3. **Integridad**: No se pueden crear recepciones parciales o inconsistentes

**Pasos en la transacción:**
```
BEGIN TRANSACTION
  1. Crear registro de recepción
  2. Para cada item:
     a. Crear reception_item
     b. Actualizar line_item.receivedQuantity
     c. Upsert stock_level (incrementar available y total)
     d. Crear stock_movement (tipo RECEIPT)
  3. Calcular % completado
  4. Actualizar estado de purchase_order
COMMIT TRANSACTION
```

---

## Validaciones de Negocio

### Validaciones de Orden de Compra
- ✅ La orden debe existir
- ✅ La orden debe estar en estado SUBMITTED o PARTIALLY_RECEIVED
- ✅ No se puede recibir órdenes DRAFT, RECEIVED o CANCELLED

### Validaciones de Line Items
- ✅ Todos los line items deben pertenecer a la orden
- ✅ No se permiten line items duplicados en una recepción
- ✅ No se puede recibir más de lo ordenado (validación de sobre-recepción)
- ✅ Las cantidades recibidas deben ser positivas

### Validaciones de Ubicaciones
- ✅ Todas las ubicaciones deben existir
- ✅ Todas las ubicaciones deben estar activas

### Validaciones de Lotes y Expiración
- ✅ Las fechas de expiración deben ser futuras
- ✅ Los batch numbers son opcionales pero se recomienda su uso

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `RECEPTION_NOT_FOUND` | Recepción no encontrada |
| `PURCHASE_ORDER_NOT_FOUND` | Orden de compra no encontrada |
| `INVALID_PO_STATUS` | Estado de orden no permite recepción |
| `INVALID_LINE_ITEMS` | Line items inválidos o no pertenecen a la orden |
| `DUPLICATE_LINE_ITEMS` | Line items duplicados en la recepción |
| `OVER_RECEPTION` | Cantidad recibida excede lo ordenado |
| `INVALID_QUANTITY` | Cantidad recibida debe ser positiva |
| `LOCATION_NOT_FOUND` | Ubicación no encontrada |
| `LOCATION_INACTIVE` | Ubicación inactiva |
| `INVALID_EXPIRATION_DATE` | Fecha de expiración debe ser futura |
| `RECEPTION_CREATION_FAILED` | Error al crear recepción |

---

## Integración con Otros Módulos

### Purchase Orders
- Lee órdenes de compra y line items
- Actualiza receivedQuantity en line items
- Actualiza estado de la orden (SUBMITTED → PARTIALLY_RECEIVED → RECEIVED)

### Stock
- Actualiza stock_level (quantityAvailable y quantityTotal)
- Crea registros si no existen (upsert)

### Movements
- Crea movimientos de tipo RECEIPT
- Incluye referencia a la orden de compra
- Registra running balance para auditoría

### Locations
- Valida que las ubicaciones existan y estén activas
- Asocia stock recibido a ubicaciones específicas

---

## Ejemplos de Uso

### Ejemplo 1: Recepción Completa Simple
```bash
curl -X POST http://localhost:3000/api/v1/receptions \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "po-uuid",
    "receivedDate": "2024-01-15T10:00:00Z",
    "receivedBy": "Juan Pérez",
    "items": [
      {
        "lineItemId": "line-item-uuid",
        "receivedQuantity": 100,
        "locationId": "location-uuid"
      }
    ]
  }'
```

### Ejemplo 2: Recepción Parcial con Lote
```bash
curl -X POST http://localhost:3000/api/v1/receptions \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "po-uuid",
    "receivedDate": "2024-01-15T10:00:00Z",
    "receivedBy": "María García",
    "items": [
      {
        "lineItemId": "line-item-uuid",
        "receivedQuantity": 50,
        "locationId": "location-uuid",
        "batchNumber": "BATCH-2024-001"
      }
    ],
    "notes": "Primera recepción parcial"
  }'
```

### Ejemplo 3: Recepción con Fecha de Expiración
```bash
curl -X POST http://localhost:3000/api/v1/receptions \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "po-uuid",
    "receivedDate": "2024-01-15T10:00:00Z",
    "receivedBy": "Carlos López",
    "items": [
      {
        "lineItemId": "line-item-uuid",
        "receivedQuantity": 200,
        "locationId": "location-uuid",
        "batchNumber": "BATCH-2024-002",
        "expirationDate": "2025-12-31T00:00:00Z"
      }
    ]
  }'
```

### Ejemplo 4: Múltiples Items en una Recepción
```bash
curl -X POST http://localhost:3000/api/v1/receptions \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "po-uuid",
    "receivedDate": "2024-01-15T10:00:00Z",
    "receivedBy": "Ana Martínez",
    "items": [
      {
        "lineItemId": "line-item-uuid-1",
        "receivedQuantity": 100,
        "locationId": "location-uuid-1",
        "batchNumber": "BATCH-A-001"
      },
      {
        "lineItemId": "line-item-uuid-2",
        "receivedQuantity": 50,
        "locationId": "location-uuid-2",
        "batchNumber": "BATCH-B-001"
      }
    ]
  }'
```

---

## Arquitectura del Módulo

```
receptions/
├── reception.types.ts       # Tipos e interfaces TypeScript
├── reception.validator.ts   # Esquemas de validación Zod
├── reception.repository.ts  # Acceso a datos (Prisma)
├── reception.service.ts     # Lógica de negocio
├── reception.controller.ts  # Controladores HTTP
├── reception.routes.ts      # Definición de rutas
└── README.md               # Documentación
```

**Patrón de diseño:** Repository → Service → Controller → Routes

---

## Próximas Mejoras

- [ ] Endpoint para cancelar/revertir recepciones
- [ ] Soporte para recepciones con daños o defectos
- [ ] Reportes de recepciones por período
- [ ] Notificaciones automáticas al completar orden
- [ ] Integración con sistema de calidad (QC)
- [ ] Fotos de recepción
- [ ] Firma digital del receptor
- [ ] Impresión de etiquetas de lote
