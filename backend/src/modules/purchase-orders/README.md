# Purchase Orders Module

Módulo de gestión de órdenes de compra en DaCodes Inventory.

## Características

✅ CRUD completo de órdenes de compra
✅ Gestión de line items (productos por orden)
✅ Transiciones de estado validadas
✅ Soporte para recepción parcial
✅ Generación automática de número de orden
✅ Cálculo automático de totales
✅ Validaciones de negocio completas

## Estados de Orden

- **DRAFT**: Borrador, puede editarse
- **SUBMITTED**: Enviada al proveedor
- **PARTIALLY_RECEIVED**: Recepción parcial
- **RECEIVED**: Completamente recibida
- **CANCELLED**: Cancelada

## Transiciones Válidas

```
DRAFT → SUBMITTED, CANCELLED
SUBMITTED → PARTIALLY_RECEIVED, RECEIVED, CANCELLED
PARTIALLY_RECEIVED → RECEIVED, CANCELLED
RECEIVED → (terminal)
CANCELLED → (terminal)
```

---

## API Endpoints

### 1. Create Purchase Order

**POST** `/api/v1/purchase-orders`

```json
{
  "supplierId": "uuid",
  "orderDate": "2024-01-15T10:00:00Z",
  "expectedDeliveryDate": "2024-01-30T10:00:00Z",
  "lineItems": [
    {
      "productId": "product-uuid-1",
      "quantity": 100,
      "unitPrice": 25.50
    },
    {
      "productId": "product-uuid-2",
      "quantity": 50,
      "unitPrice": 45.00
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "po-uuid",
    "orderNumber": "PO-2024-0001",
    "supplierId": "supplier-uuid",
    "supplierName": "Acme Corporation",
    "orderDate": "2024-01-15T10:00:00.000Z",
    "expectedDeliveryDate": "2024-01-30T10:00:00.000Z",
    "status": "DRAFT",
    "totalValue": 4800,
    "lineItems": [
      {
        "id": "line-uuid-1",
        "productId": "product-uuid-1",
        "productSku": "PROD-001",
        "productName": "Laptop Dell XPS 15",
        "quantity": 100,
        "unitPrice": 25.50,
        "receivedQuantity": 0,
        "lineTotal": 2550,
        "pendingQuantity": 100,
        "completionPercentage": 0
      }
    ],
    "totalQuantity": 150,
    "totalReceived": 0,
    "completionPercentage": 0
  }
}
```

### 2. Update Purchase Order (DRAFT only)

**PUT** `/api/v1/purchase-orders/:id`

```json
{
  "expectedDeliveryDate": "2024-02-05T10:00:00Z",
  "lineItems": [
    {
      "id": "existing-line-uuid",
      "productId": "product-uuid-1",
      "quantity": 120,
      "unitPrice": 24.00
    },
    {
      "productId": "product-uuid-3",
      "quantity": 30,
      "unitPrice": 15.00
    },
    {
      "id": "line-to-delete-uuid",
      "productId": "product-uuid-2",
      "quantity": 50,
      "unitPrice": 45.00,
      "_delete": true
    }
  ]
}
```

### 3. Update Status

**PATCH** `/api/v1/purchase-orders/:id/status`

```json
{
  "status": "SUBMITTED"
}
```

### 4. Cancel Order

**POST** `/api/v1/purchase-orders/:id/cancel`

### 5. Get All Orders

**GET** `/api/v1/purchase-orders?status=SUBMITTED&supplierId=uuid`

### 6. Get Statistics

**GET** `/api/v1/purchase-orders/statistics`

```json
{
  "success": true,
  "data": {
    "totalOrders": 45,
    "byStatus": {
      "DRAFT": 5,
      "SUBMITTED": 15,
      "PARTIALLY_RECEIVED": 10,
      "RECEIVED": 12,
      "CANCELLED": 3
    },
    "totalValue": 125000,
    "averageOrderValue": 2777.78,
    "totalItems": 450,
    "totalReceived": 320,
    "completionRate": 71.11
  }
}
```

---

## Business Rules

### Creación
- Proveedor debe existir y estar activo
- Todos los productos deben existir y estar activos
- No puede haber productos duplicados en line items
- Fecha de entrega >= fecha de orden
- Al menos un line item requerido

### Actualización
- Solo órdenes DRAFT pueden editarse
- Validaciones iguales a creación
- Line items: actualizar (con id), crear (sin id), eliminar (_delete: true)
- Total se recalcula automáticamente

### Transiciones de Estado
- Validadas según VALID_STATUS_TRANSITIONS
- SUBMITTED requiere proveedor activo
- No se puede cancelar si RECEIVED o CANCELLED

### Recepción Parcial
- receivedQuantity se actualiza por recepciones
- Estado cambia automáticamente:
  - 0% recibido → SUBMITTED
  - 1-99% recibido → PARTIALLY_RECEIVED
  - 100% recibido → RECEIVED

---

## Integration Points

**Recepciones:**
```typescript
// Al recibir mercancía, actualizar receivedQuantity
await prisma.purchaseOrderLineItem.update({
  where: { id: lineItemId },
  data: {
    receivedQuantity: {
      increment: receivedQty
    }
  }
});

// Actualizar estado de orden según % completado
```

**Movimientos de Stock:**
```typescript
// Crear movimiento RECEIPT al recibir
await movementService.createMovement({
  type: 'RECEIPT',
  productId,
  locationId,
  quantity: receivedQty,
  referenceType: 'purchase_order',
  referenceId: purchaseOrderId,
});
```

---

## Testing with cURL

```bash
# Create order
curl -X POST http://localhost:3000/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "uuid",
    "orderDate": "2024-01-15T10:00:00Z",
    "expectedDeliveryDate": "2024-01-30T10:00:00Z",
    "lineItems": [
      {"productId": "uuid", "quantity": 100, "unitPrice": 25.50}
    ]
  }'

# Update status
curl -X PATCH http://localhost:3000/api/v1/purchase-orders/uuid/status \
  -H "Content-Type: application/json" \
  -d '{"status": "SUBMITTED"}'

# Cancel order
curl -X POST http://localhost:3000/api/v1/purchase-orders/uuid/cancel

# Get orders by supplier
curl "http://localhost:3000/api/v1/purchase-orders?supplierId=uuid&status=SUBMITTED"
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `PURCHASE_ORDER_NOT_FOUND` | Order not found |
| `SUPPLIER_NOT_FOUND` | Supplier not found |
| `SUPPLIER_INACTIVE` | Supplier is inactive |
| `PRODUCT_NOT_FOUND` | Product not found |
| `PRODUCT_INACTIVE` | Product is inactive |
| `DUPLICATE_PRODUCTS` | Duplicate products in line items |
| `INVALID_DELIVERY_DATE` | Delivery date before order date |
| `INVALID_STATUS` | Invalid status for operation |
| `INVALID_STATUS_TRANSITION` | Invalid status transition |
| `NO_LINE_ITEMS` | No line items in order |

---

## Dependencies

- `@prisma/client`: Database ORM
- `zod`: Schema validation
- `express`: Web framework
