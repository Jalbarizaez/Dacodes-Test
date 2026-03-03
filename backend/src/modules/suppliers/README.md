# Suppliers Module

Módulo de gestión de proveedores en DaCodes Inventory.

## Estructura

```
suppliers/
├── supplier.types.ts       # Tipos e interfaces TypeScript
├── supplier.validator.ts   # Schemas de validación con Zod
├── supplier.repository.ts  # Acceso a datos con Prisma
├── supplier.service.ts     # Lógica de negocio
├── supplier.controller.ts  # Controladores HTTP
├── supplier.routes.ts      # Definición de rutas
└── README.md              # Esta documentación
```

## Características Principales

### Gestión de Proveedores
- ✅ CRUD completo de proveedores
- ✅ Soft delete (desactivación)
- ✅ Búsqueda por nombre, contacto o email
- ✅ Validación de unicidad de nombre
- ✅ Validación de email
- ✅ Prevención de eliminación con órdenes activas

### Campos del Proveedor
- **name**: Nombre del proveedor (requerido, único)
- **contactName**: Nombre del contacto
- **email**: Email de contacto
- **phone**: Teléfono
- **address**: Dirección
- **paymentTerms**: Términos de pago (ej: "Net 30", "Net 60")
- **leadTimeDays**: Tiempo de entrega en días
- **isActive**: Estado activo/inactivo

### Extensibilidad para Supplier Scoring
El módulo está preparado para futuras funcionalidades de evaluación de proveedores:
- Estadísticas de órdenes de compra
- Métricas de desempeño
- Tasa de entregas a tiempo
- Puntuación de calidad
- Puntuación general

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1/suppliers
```

---

### 1. Create Supplier

**POST** `/api/v1/suppliers`

Crea un nuevo proveedor.

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "contactName": "John Doe",
  "email": "john@acme.com",
  "phone": "+1-555-0123",
  "address": "123 Main St, New York, NY 10001",
  "paymentTerms": "Net 30",
  "leadTimeDays": 15
}
```

**Campos:**
- `name` (required): Nombre del proveedor (único)
- `contactName` (optional): Nombre del contacto
- `email` (optional): Email (validado)
- `phone` (optional): Teléfono
- `address` (optional): Dirección completa
- `paymentTerms` (optional): Términos de pago
- `leadTimeDays` (optional): Días de entrega (default: 0)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "supplier-uuid",
    "name": "Acme Corporation",
    "contactName": "John Doe",
    "email": "john@acme.com",
    "phone": "+1-555-0123",
    "address": "123 Main St, New York, NY 10001",
    "paymentTerms": "Net 30",
    "leadTimeDays": 15,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "purchaseOrderCount": 0,
    "lotCount": 0
  }
}
```

**Business Logic:**
- Valida que el nombre sea único (case-insensitive)
- Valida formato de email si se proporciona
- leadTimeDays debe ser no negativo
- Crea proveedor activo por defecto

---

### 2. Get All Suppliers

**GET** `/api/v1/suppliers`

Obtiene todos los proveedores con filtros y paginación.

**Query Parameters:**
- `page` (optional): Número de página (default: 1)
- `pageSize` (optional): Items por página (default: 20, max: 100)
- `isActive` (optional): Filtrar por estado (true/false)
- `search` (optional): Buscar por nombre, contacto o email
- `sortBy` (optional): Campo para ordenar (name, leadTimeDays, createdAt, updatedAt)
- `sortOrder` (optional): Orden (asc, desc)
- `includeRelations` (optional): Incluir contadores de relaciones (true/false)

**Example Request:**
```
GET /api/v1/suppliers?isActive=true&search=acme&sortBy=name&sortOrder=asc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "supplier-uuid",
      "name": "Acme Corporation",
      "contactName": "John Doe",
      "email": "john@acme.com",
      "phone": "+1-555-0123",
      "address": "123 Main St, New York, NY 10001",
      "paymentTerms": "Net 30",
      "leadTimeDays": 15,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "purchaseOrderCount": 5,
      "lotCount": 12
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

---

### 3. Get Active Suppliers

**GET** `/api/v1/suppliers/active`

Obtiene todos los proveedores activos (útil para dropdowns).

**Example Request:**
```
GET /api/v1/suppliers/active
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "supplier-uuid-1",
      "name": "Acme Corporation",
      "leadTimeDays": 15,
      ...
    },
    {
      "id": "supplier-uuid-2",
      "name": "Global Supplies Inc",
      "leadTimeDays": 20,
      ...
    }
  ]
}
```

**Use Case**: Llenar dropdowns en formularios de órdenes de compra.

---

### 4. Get Supplier by ID

**GET** `/api/v1/suppliers/:id`

Obtiene un proveedor específico por ID.

**Query Parameters:**
- `includeRelations` (optional): Incluir contadores (default: true)

**Example Request:**
```
GET /api/v1/suppliers/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "supplier-uuid",
    "name": "Acme Corporation",
    "contactName": "John Doe",
    "email": "john@acme.com",
    "phone": "+1-555-0123",
    "address": "123 Main St, New York, NY 10001",
    "paymentTerms": "Net 30",
    "leadTimeDays": 15,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "purchaseOrderCount": 5,
    "lotCount": 12
  }
}
```

---

### 5. Update Supplier

**PUT** `/api/v1/suppliers/:id`

Actualiza un proveedor existente.

**Request Body:**
```json
{
  "contactName": "Jane Smith",
  "email": "jane@acme.com",
  "phone": "+1-555-0456",
  "leadTimeDays": 10
}
```

**Campos:**
- Todos los campos son opcionales
- Solo se actualizan los campos proporcionados
- `name` debe ser único si se cambia
- `email` se valida si se proporciona

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "supplier-uuid",
    "name": "Acme Corporation",
    "contactName": "Jane Smith",
    "email": "jane@acme.com",
    "phone": "+1-555-0456",
    "leadTimeDays": 10,
    ...
  }
}
```

---

### 6. Deactivate Supplier

**DELETE** `/api/v1/suppliers/:id`

Desactiva un proveedor (soft delete).

**Example Request:**
```
DELETE /api/v1/suppliers/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "supplier-uuid",
    "name": "Acme Corporation",
    "isActive": false,
    ...
  }
}
```

**Business Logic:**
- No permite desactivar si tiene órdenes de compra activas
- Órdenes activas: DRAFT, SUBMITTED, PARTIALLY_RECEIVED
- Soft delete: solo cambia `isActive` a false
- Los datos históricos se mantienen

---

### 7. Activate Supplier

**POST** `/api/v1/suppliers/:id/activate`

Reactiva un proveedor desactivado.

**Example Request:**
```
POST /api/v1/suppliers/550e8400-e29b-41d4-a716-446655440000/activate
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "supplier-uuid",
    "name": "Acme Corporation",
    "isActive": true,
    ...
  }
}
```

---

### 8. Get Supplier Statistics

**GET** `/api/v1/suppliers/:id/statistics`

Obtiene estadísticas del proveedor (preparado para supplier scoring).

**Example Request:**
```
GET /api/v1/suppliers/550e8400-e29b-41d4-a716-446655440000/statistics
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "supplierId": "supplier-uuid",
    "supplierName": "Acme Corporation",
    "totalPurchaseOrders": 25,
    "totalLots": 48,
    "averageLeadTime": null,
    "onTimeDeliveryRate": null,
    "qualityScore": null,
    "overallScore": null
  }
}
```

**Note**: Los campos `averageLeadTime`, `onTimeDeliveryRate`, `qualityScore` y `overallScore` son placeholders para futuras implementaciones de supplier scoring.

---

## Testing with cURL

### Create supplier
```bash
curl -X POST http://localhost:3000/api/v1/suppliers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "contactName": "John Doe",
    "email": "john@acme.com",
    "phone": "+1-555-0123",
    "address": "123 Main St, New York, NY 10001",
    "paymentTerms": "Net 30",
    "leadTimeDays": 15
  }'
```

### Get all suppliers
```bash
# All suppliers
curl http://localhost:3000/api/v1/suppliers

# Active suppliers only
curl "http://localhost:3000/api/v1/suppliers?isActive=true"

# Search suppliers
curl "http://localhost:3000/api/v1/suppliers?search=acme"

# With relations
curl "http://localhost:3000/api/v1/suppliers?includeRelations=true"
```

### Get active suppliers (dropdown)
```bash
curl http://localhost:3000/api/v1/suppliers/active
```

### Get supplier by ID
```bash
curl http://localhost:3000/api/v1/suppliers/supplier-uuid
```

### Update supplier
```bash
curl -X PUT http://localhost:3000/api/v1/suppliers/supplier-uuid \
  -H "Content-Type: application/json" \
  -d '{
    "contactName": "Jane Smith",
    "leadTimeDays": 10
  }'
```

### Deactivate supplier
```bash
curl -X DELETE http://localhost:3000/api/v1/suppliers/supplier-uuid
```

### Activate supplier
```bash
curl -X POST http://localhost:3000/api/v1/suppliers/supplier-uuid/activate
```

### Get supplier statistics
```bash
curl http://localhost:3000/api/v1/suppliers/supplier-uuid/statistics
```

---

## Business Rules

### Nombre Único
- El nombre del proveedor debe ser único (case-insensitive)
- Se valida al crear y actualizar
- Lanza error `SUPPLIER_NAME_EXISTS` si ya existe

### Email Válido
- Si se proporciona email, debe tener formato válido
- Validación con regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Lanza error `INVALID_EMAIL` si es inválido

### Lead Time
- Debe ser un número entero no negativo
- Default: 0 días
- Representa el tiempo de entrega del proveedor

### Desactivación
- No se puede desactivar si tiene órdenes de compra activas
- Órdenes activas: DRAFT, SUBMITTED, PARTIALLY_RECEIVED
- Lanza error `SUPPLIER_HAS_ACTIVE_ORDERS`
- Soft delete: mantiene datos históricos

### Activación
- Solo se puede activar un proveedor inactivo
- Lanza error `SUPPLIER_ALREADY_ACTIVE` si ya está activo

---

## Error Codes

| Code | Description |
|------|-------------|
| `SUPPLIER_NOT_FOUND` | Supplier not found |
| `SUPPLIER_NAME_EXISTS` | Supplier with this name already exists |
| `INVALID_EMAIL` | Invalid email format |
| `SUPPLIER_ALREADY_INACTIVE` | Supplier is already inactive |
| `SUPPLIER_ALREADY_ACTIVE` | Supplier is already active |
| `SUPPLIER_HAS_ACTIVE_ORDERS` | Cannot deactivate supplier with active orders |
| `INVALID_PAGE` | Invalid page number |
| `INVALID_PAGE_SIZE` | Invalid page size |

---

## Future Enhancements: Supplier Scoring

El módulo está preparado para implementar un sistema de evaluación de proveedores:

### Métricas Planeadas

**Delivery Performance:**
- On-time delivery rate
- Average lead time vs promised
- Delivery consistency

**Quality Metrics:**
- Defect rate
- Return rate
- Quality inspection scores

**Price Competitiveness:**
- Price comparison vs market
- Price stability
- Discount availability

**Reliability:**
- Order fulfillment rate
- Communication responsiveness
- Issue resolution time

**Overall Score:**
- Weighted average of all metrics
- Configurable weights per metric
- Historical trend analysis

### Estructura Extensible

```typescript
// Ya preparado en supplier.types.ts
interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  metrics: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    averageLeadTime: number;
    onTimeDeliveries: number;
    lateDeliveries: number;
    onTimeRate: number;
  };
  scoring?: {
    deliveryScore?: number;
    qualityScore?: number;
    priceScore?: number;
    overallScore?: number;
  };
}
```

### Endpoints Futuros

- `GET /suppliers/:id/performance` - Métricas de desempeño
- `GET /suppliers/:id/score` - Puntuación general
- `GET /suppliers/ranking` - Ranking de proveedores
- `POST /suppliers/:id/evaluate` - Evaluar proveedor manualmente

---

## Integration Points

### Órdenes de Compra
```typescript
// Al crear orden de compra
const supplier = await supplierService.getSupplierById(supplierId);
if (!supplier.isActive) {
  throw new Error('Cannot create order for inactive supplier');
}

// Usar leadTimeDays para calcular fecha esperada
const expectedDate = addDays(new Date(), supplier.leadTimeDays);
```

### Lotes
```typescript
// Al crear lote, vincular con proveedor
await lotService.createLot({
  lotNumber: 'LOT-2024-001',
  productId,
  supplierId, // Opcional pero recomendado
  manufacturingDate,
  expirationDate,
});
```

### Reportes
```typescript
// Obtener proveedores con más órdenes
const suppliers = await supplierService.getAllSuppliers(
  { isActive: true },
  1,
  10,
  'name',
  'asc',
  true // includeRelations
);

// Ordenar por número de órdenes
suppliers.sort((a, b) => 
  (b.purchaseOrderCount || 0) - (a.purchaseOrderCount || 0)
);
```

---

## Performance Considerations

### Índices Optimizados
- `name` - Búsquedas y unicidad
- `isActive` - Filtros por estado
- Búsqueda case-insensitive con `mode: 'insensitive'`

### Queries Eficientes
- Includes selectivos (solo contadores cuando se necesitan)
- Paginación en todas las listas
- Búsqueda con OR en múltiples campos

### Caching Recommendations
- Lista de proveedores activos (TTL: 30 min)
- Detalles de proveedor (TTL: 15 min)
- Estadísticas de proveedor (TTL: 1 hora)

---

## Dependencies

- `@prisma/client`: Database ORM
- `zod`: Schema validation
- `express`: Web framework

---

## Notes

- Soft delete mantiene integridad referencial
- Nombre único case-insensitive
- Email validado con regex
- Lead time en días (entero no negativo)
- Preparado para supplier scoring futuro
- Estadísticas básicas ya implementadas
- Extensible para métricas avanzadas

