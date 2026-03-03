# Warehouses & Locations Module

Módulo completo para la gestión de almacenes y ubicaciones en DaCodes Inventory.

## Estructura

```
warehouses/
├── warehouse.types.ts       # Tipos e interfaces TypeScript
├── warehouse.validator.ts   # Schemas de validación con Zod
├── warehouse.repository.ts  # Acceso a datos con Prisma
├── warehouse.service.ts     # Lógica de negocio
├── warehouse.controller.ts  # Controladores HTTP
├── warehouse.routes.ts      # Definición de rutas
└── README.md               # Esta documentación
```

## Decisiones de Modelado

### Relación Jerárquica
- **Warehouse** (1) → (N) **Location**
- Relación simple y directa: un almacén tiene muchas ubicaciones
- No hay jerarquía multinivel dentro de locations (mantiene simplicidad)

### Identificación Flexible de Ubicaciones
- Campo `type` permite clasificar ubicaciones: ZONE, RACK, SHELF, BIN, PALLET, FLOOR, OTHER
- Campo `code` es el identificador único dentro del almacén (ej: A-01, B-15, RACK-3-SHELF-2)
- Campo `name` opcional para nombres descriptivos
- Esta flexibilidad permite adaptarse a diferentes tipos de almacenes sin complejidad innecesaria

### Soft Delete
- Ambas entidades usan `isActive` para soft delete
- Preserva integridad referencial e historial
- Previene eliminación accidental de datos con stock

---

## API Endpoints

### Base URLs
```
Warehouses: http://localhost:3000/api/v1/warehouses
Locations:  http://localhost:3000/api/v1/locations
```

---

## WAREHOUSE ENDPOINTS

### 1. Create Warehouse

**POST** `/api/v1/warehouses`

**Request Body:**
```json
{
  "name": "Main Warehouse",
  "address": "123 Industrial Ave, City, State 12345"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Main Warehouse",
    "address": "123 Industrial Ave, City, State 12345",
    "isActive": true,
    "locationCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All Warehouses

**GET** `/api/v1/warehouses`

**Query Parameters:**
- `page` (optional): Número de página (default: 1)
- `pageSize` (optional): Items por página (default: 20, max: 100)
- `isActive` (optional): Filtrar por estado (true/false)
- `search` (optional): Buscar en nombre o dirección
- `sortBy` (optional): Campo para ordenar (name, createdAt, updatedAt)
- `sortOrder` (optional): Orden (asc, desc)

**Example:**
```
GET /api/v1/warehouses?page=1&pageSize=10&isActive=true&search=main
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Main Warehouse",
      "address": "123 Industrial Ave",
      "isActive": true,
      "locationCount": 15,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### 3. Get Warehouse by ID

**GET** `/api/v1/warehouses/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Main Warehouse",
    "address": "123 Industrial Ave",
    "isActive": true,
    "locationCount": 15,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Get Locations by Warehouse

**GET** `/api/v1/warehouses/:warehouseId/locations`

Obtiene todas las ubicaciones de un almacén específico.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "warehouseId": "warehouse-uuid",
      "warehouseName": "Main Warehouse",
      "code": "A-01",
      "name": "Zone A - Shelf 1",
      "type": "SHELF",
      "capacity": 1000,
      "isActive": true,
      "stockCount": 5,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 5. Update Warehouse

**PUT** `/api/v1/warehouses/:id`

**Request Body (all fields optional):**
```json
{
  "name": "Main Warehouse - Updated",
  "address": "456 New Address"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Main Warehouse - Updated",
    "address": "456 New Address",
    "isActive": true,
    "locationCount": 15,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 6. Deactivate Warehouse

**DELETE** `/api/v1/warehouses/:id`

**Business Rules:**
- Cannot deactivate warehouse with active locations
- Must deactivate all locations first
- Soft delete (sets `isActive` to false)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Main Warehouse",
    "isActive": false,
    ...
  }
}
```

**Error (422 Unprocessable Entity):**
```json
{
  "success": false,
  "error": {
    "code": "WAREHOUSE_HAS_ACTIVE_LOCATIONS",
    "message": "Cannot deactivate warehouse with active locations. Please deactivate all locations first."
  }
}
```

---

## LOCATION ENDPOINTS

### 1. Create Location

**POST** `/api/v1/locations`

**Request Body:**
```json
{
  "warehouseId": "warehouse-uuid",
  "code": "A-01",
  "name": "Zone A - Shelf 1",
  "type": "SHELF",
  "capacity": 1000
}
```

**Validation Rules:**
- `warehouseId`: Required, valid UUID
- `code`: Required, 1-50 chars, uppercase/numbers/hyphens only, unique per warehouse
- `name`: Optional, max 200 chars
- `type`: Optional, one of: ZONE, RACK, SHELF, BIN, PALLET, FLOOR, OTHER
- `capacity`: Optional, positive integer

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "warehouseId": "warehouse-uuid",
    "warehouseName": "Main Warehouse",
    "code": "A-01",
    "name": "Zone A - Shelf 1",
    "type": "SHELF",
    "capacity": 1000,
    "isActive": true,
    "stockCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All Locations

**GET** `/api/v1/locations`

**Query Parameters:**
- `page` (optional): Número de página
- `pageSize` (optional): Items por página
- `warehouseId` (optional): Filtrar por almacén
- `type` (optional): Filtrar por tipo (ZONE, RACK, SHELF, etc.)
- `isActive` (optional): Filtrar por estado
- `search` (optional): Buscar en código o nombre
- `sortBy` (optional): Campo para ordenar (code, name, createdAt, updatedAt)
- `sortOrder` (optional): Orden (asc, desc)

**Example:**
```
GET /api/v1/locations?warehouseId=uuid&type=SHELF&isActive=true&page=1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "warehouseId": "warehouse-uuid",
      "warehouseName": "Main Warehouse",
      "code": "A-01",
      "name": "Zone A - Shelf 1",
      "type": "SHELF",
      "capacity": 1000,
      "isActive": true,
      "stockCount": 5,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 3. Get Location by ID

**GET** `/api/v1/locations/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "warehouseId": "warehouse-uuid",
    "warehouseName": "Main Warehouse",
    "code": "A-01",
    "name": "Zone A - Shelf 1",
    "type": "SHELF",
    "capacity": 1000,
    "isActive": true,
    "stockCount": 5,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update Location

**PUT** `/api/v1/locations/:id`

**Request Body (all fields optional):**
```json
{
  "code": "A-02",
  "name": "Zone A - Shelf 2",
  "type": "SHELF",
  "capacity": 1500
}
```

**Notes:**
- `warehouseId` cannot be changed (immutable)
- `code` must be unique within the warehouse
- All other fields are optional

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "A-02",
    "name": "Zone A - Shelf 2",
    "capacity": 1500,
    ...
  }
}
```

---

### 5. Deactivate Location

**DELETE** `/api/v1/locations/:id`

**Business Rules:**
- Cannot deactivate location with existing stock
- Must transfer or adjust stock to zero first
- Soft delete (sets `isActive` to false)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "A-01",
    "isActive": false,
    ...
  }
}
```

**Error (422 Unprocessable Entity):**
```json
{
  "success": false,
  "error": {
    "code": "LOCATION_HAS_STOCK",
    "message": "Cannot deactivate location with existing stock. Please transfer or adjust stock first."
  }
}
```

---

## Testing with cURL

### Warehouses

```bash
# Create warehouse
curl -X POST http://localhost:3000/api/v1/warehouses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Warehouse",
    "address": "123 Industrial Ave"
  }'

# Get all warehouses
curl http://localhost:3000/api/v1/warehouses

# Get warehouse by ID
curl http://localhost:3000/api/v1/warehouses/uuid

# Get locations by warehouse
curl http://localhost:3000/api/v1/warehouses/uuid/locations

# Update warehouse
curl -X PUT http://localhost:3000/api/v1/warehouses/uuid \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Deactivate warehouse
curl -X DELETE http://localhost:3000/api/v1/warehouses/uuid
```

### Locations

```bash
# Create location
curl -X POST http://localhost:3000/api/v1/locations \
  -H "Content-Type: application/json" \
  -d '{
    "warehouseId": "warehouse-uuid",
    "code": "A-01",
    "name": "Zone A - Shelf 1",
    "type": "SHELF",
    "capacity": 1000
  }'

# Get all locations
curl http://localhost:3000/api/v1/locations

# Get locations filtered by warehouse
curl "http://localhost:3000/api/v1/locations?warehouseId=uuid"

# Get location by ID
curl http://localhost:3000/api/v1/locations/uuid

# Update location
curl -X PUT http://localhost:3000/api/v1/locations/uuid \
  -H "Content-Type: application/json" \
  -d '{"capacity": 1500}'

# Deactivate location
curl -X DELETE http://localhost:3000/api/v1/locations/uuid
```

---

## Location Type Examples

### Flexible Identification System

```json
// Zone-based
{
  "code": "ZONE-A",
  "name": "Receiving Zone A",
  "type": "ZONE"
}

// Rack-based
{
  "code": "R-01-S-03",
  "name": "Rack 1 - Shelf 3",
  "type": "SHELF"
}

// Bin-based
{
  "code": "BIN-A-15",
  "name": "Small Parts Bin A15",
  "type": "BIN"
}

// Pallet-based
{
  "code": "PALLET-001",
  "name": "Pallet Position 001",
  "type": "PALLET"
}

// Floor-based
{
  "code": "FLOOR-2-A",
  "name": "Floor 2 - Section A",
  "type": "FLOOR"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `WAREHOUSE_NOT_FOUND` | Warehouse not found |
| `WAREHOUSE_ALREADY_INACTIVE` | Warehouse is already inactive |
| `WAREHOUSE_HAS_ACTIVE_LOCATIONS` | Cannot deactivate warehouse with active locations |
| `WAREHOUSE_INACTIVE` | Cannot create location in inactive warehouse |
| `LOCATION_NOT_FOUND` | Location not found |
| `LOCATION_ALREADY_INACTIVE` | Location is already inactive |
| `LOCATION_HAS_STOCK` | Cannot deactivate location with stock |
| `DUPLICATE_LOCATION_CODE` | Location code already exists in warehouse |
| `INVALID_PAGE` | Invalid page number |
| `INVALID_PAGE_SIZE` | Invalid page size |
| `VALIDATION_ERROR` | Input validation failed |

---

## Business Logic

### Warehouse Deactivation Rules
1. Warehouse must exist
2. Warehouse must be active
3. Warehouse must have no active locations
4. Soft delete preserves data

### Location Creation Rules
1. Warehouse must exist and be active
2. Code must be unique within warehouse
3. Code format: uppercase letters, numbers, hyphens only

### Location Deactivation Rules
1. Location must exist
2. Location must be active
3. Location must have zero stock
4. Soft delete preserves data

### Code Uniqueness
- Location codes are unique per warehouse (not globally)
- Different warehouses can have the same location codes
- Enforced by unique constraint: `(warehouseId, code)`

---

## Architecture Notes

### Why Simple Hierarchy?
- **Simplicity**: One level (Warehouse → Location) is easier to understand and maintain
- **Flexibility**: The `type` field allows logical grouping without database complexity
- **Performance**: Fewer joins, faster queries
- **Scalability**: Easy to extend with additional metadata if needed

### Location Code Strategy
- Flexible format allows different naming conventions
- Examples: "A-01", "RACK-3-SHELF-2", "ZONE-A", "BIN-15"
- Business decides the convention, system enforces uniqueness

### Future Enhancements
- [ ] Location hierarchy (parent-child relationships)
- [ ] Location capacity tracking (current vs max)
- [ ] Location temperature zones
- [ ] Location access restrictions
- [ ] Bulk location creation
- [ ] Location maps/layouts
- [ ] Barcode generation for locations

---

## Dependencies

- `@prisma/client`: Database ORM
- `zod`: Schema validation
- `express`: Web framework

---

## Notes

- Authentication middleware is commented out for initial testing
- Both warehouses and locations use soft delete
- Location codes are case-sensitive (stored as uppercase)
- Capacity is optional and informational (not enforced)
