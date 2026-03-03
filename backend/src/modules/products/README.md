# Products Module

Módulo completo para la gestión de productos en DaCodes Inventory.

## Estructura

```
products/
├── product.types.ts       # Tipos e interfaces TypeScript
├── product.validator.ts   # Schemas de validación con Zod
├── product.repository.ts  # Acceso a datos con Prisma
├── product.service.ts     # Lógica de negocio
├── product.controller.ts  # Controladores HTTP
├── product.routes.ts      # Definición de rutas
└── README.md             # Esta documentación
```

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1/products
```

### 1. Create Product

**POST** `/api/v1/products`

Crea un nuevo producto.

**Request Body:**
```json
{
  "sku": "PROD-001",
  "name": "Laptop Dell XPS 15",
  "description": "High-performance laptop for professionals",
  "categoryId": "uuid-of-category",
  "unitOfMeasure": "UNIT",
  "minStock": 5,
  "maxStock": 50,
  "weight": 2.5,
  "dimensions": "35.7 x 23.5 x 1.8 cm",
  "barcode": "1234567890123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "PROD-001",
    "name": "Laptop Dell XPS 15",
    "description": "High-performance laptop for professionals",
    "categoryId": "uuid-of-category",
    "categoryName": "Electronics",
    "unitOfMeasure": "UNIT",
    "minStock": 5,
    "maxStock": 50,
    "weight": "2.5",
    "dimensions": "35.7 x 23.5 x 1.8 cm",
    "barcode": "1234567890123",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Validation Rules:**
- `sku`: Required, 1-50 chars, uppercase letters/numbers/hyphens only
- `name`: Required, 1-200 chars
- `description`: Optional, max 1000 chars
- `categoryId`: Required, valid UUID
- `unitOfMeasure`: Required, one of: UNIT, KG, LITER, METER, BOX, PALLET
- `minStock`: Optional, non-negative integer
- `maxStock`: Optional, non-negative integer, must be >= minStock
- `weight`: Optional, positive number
- `dimensions`: Optional, max 100 chars
- `barcode`: Optional, max 50 chars

**Error Responses:**
- `400 Bad Request`: Validation error
- `409 Conflict`: SKU or barcode already exists

---

### 2. Get All Products

**GET** `/api/v1/products`

Obtiene lista de productos con filtros y paginación.

**Query Parameters:**
- `page` (optional): Número de página (default: 1)
- `pageSize` (optional): Items por página (default: 20, max: 100)
- `categoryId` (optional): Filtrar por categoría (UUID)
- `isActive` (optional): Filtrar por estado (true/false)
- `search` (optional): Buscar en nombre, SKU o barcode
- `sortBy` (optional): Campo para ordenar (name, sku, createdAt, updatedAt)
- `sortOrder` (optional): Orden (asc, desc)

**Example Request:**
```
GET /api/v1/products?page=1&pageSize=10&categoryId=uuid&isActive=true&search=laptop&sortBy=name&sortOrder=asc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sku": "PROD-001",
      "name": "Laptop Dell XPS 15",
      "categoryName": "Electronics",
      "unitOfMeasure": "UNIT",
      "isActive": true,
      ...
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

### 3. Get Product by ID

**GET** `/api/v1/products/:id`

Obtiene un producto por su ID.

**Example Request:**
```
GET /api/v1/products/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "sku": "PROD-001",
    "name": "Laptop Dell XPS 15",
    ...
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid UUID format
- `404 Not Found`: Product not found

---

### 4. Get Product by SKU

**GET** `/api/v1/products/sku/:sku`

Obtiene un producto por su SKU.

**Example Request:**
```
GET /api/v1/products/sku/PROD-001
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "PROD-001",
    "name": "Laptop Dell XPS 15",
    ...
  }
}
```

**Error Responses:**
- `404 Not Found`: Product not found

---

### 5. Update Product

**PUT** `/api/v1/products/:id`

Actualiza un producto existente.

**Request Body (all fields optional):**
```json
{
  "name": "Laptop Dell XPS 15 (Updated)",
  "description": "Updated description",
  "categoryId": "new-category-uuid",
  "unitOfMeasure": "UNIT",
  "minStock": 10,
  "maxStock": 100,
  "weight": 2.6,
  "dimensions": "36 x 24 x 2 cm",
  "barcode": "9876543210987"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "PROD-001",
    "name": "Laptop Dell XPS 15 (Updated)",
    ...
  }
}
```

**Notes:**
- SKU cannot be updated (immutable)
- All fields are optional
- Validation rules same as create

**Error Responses:**
- `400 Bad Request`: Validation error or invalid category
- `404 Not Found`: Product not found
- `409 Conflict`: Barcode already exists

---

### 6. Deactivate Product

**DELETE** `/api/v1/products/:id`

Desactiva un producto (soft delete).

**Example Request:**
```
DELETE /api/v1/products/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "sku": "PROD-001",
    "name": "Laptop Dell XPS 15",
    "isActive": false,
    ...
  }
}
```

**Business Rules:**
- Cannot deactivate product with existing stock
- Product must be active to deactivate
- Soft delete (sets `isActive` to false)

**Error Responses:**
- `400 Bad Request`: Product already inactive
- `404 Not Found`: Product not found
- `422 Unprocessable Entity`: Product has existing stock

---

## Testing with cURL

### Create Product
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "Test Product",
    "categoryId": "your-category-uuid",
    "unitOfMeasure": "UNIT"
  }'
```

### Get All Products
```bash
curl http://localhost:3000/api/v1/products?page=1&pageSize=10
```

### Get Product by ID
```bash
curl http://localhost:3000/api/v1/products/your-product-uuid
```

### Get Product by SKU
```bash
curl http://localhost:3000/api/v1/products/sku/PROD-001
```

### Update Product
```bash
curl -X PUT http://localhost:3000/api/v1/products/your-product-uuid \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name"
  }'
```

### Deactivate Product
```bash
curl -X DELETE http://localhost:3000/api/v1/products/your-product-uuid
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `DUPLICATE_SKU` | SKU already exists |
| `DUPLICATE_BARCODE` | Barcode already exists |
| `INVALID_CATEGORY` | Category does not exist |
| `PRODUCT_NOT_FOUND` | Product not found |
| `PRODUCT_ALREADY_INACTIVE` | Product is already inactive |
| `PRODUCT_HAS_STOCK` | Cannot deactivate product with stock |
| `INVALID_PAGE` | Invalid page number |
| `INVALID_PAGE_SIZE` | Invalid page size |
| `VALIDATION_ERROR` | Input validation failed |

---

## Business Logic

### SKU Validation
- Must be unique across all products
- Uppercase letters, numbers, and hyphens only
- Cannot be changed after creation

### Barcode Validation
- Must be unique if provided
- Optional field
- Can be updated

### Stock Validation
- `minStock` must be <= `maxStock`
- Both must be non-negative

### Deactivation Rules
1. Product must exist
2. Product must be active
3. Product must have zero stock across all locations
4. Soft delete (preserves data)

### Category Validation
- Category must exist in database
- Foreign key constraint enforced

---

## Architecture

### Repository Pattern
- `ProductRepository`: Database operations with Prisma
- Handles all CRUD operations
- Includes helper methods (skuExists, hasStock, etc.)

### Service Layer
- `ProductService`: Business logic
- Validation of business rules
- Error handling
- Orchestrates repository calls

### Controller Layer
- `ProductController`: HTTP request handling
- Request/response transformation
- Delegates to service layer

### Validation Layer
- Zod schemas for type-safe validation
- Validates request body, query params, and URL params
- Automatic error responses

---

## Future Enhancements

- [ ] Bulk import/export
- [ ] Product images
- [ ] Product variants
- [ ] Price history
- [ ] Supplier associations
- [ ] Stock level alerts
- [ ] Audit log integration
- [ ] Full-text search
- [ ] Product categories hierarchy navigation

---

## Dependencies

- `@prisma/client`: Database ORM
- `zod`: Schema validation
- `express`: Web framework

---

## Notes

- Authentication middleware is commented out for initial testing
- Uncomment auth middleware when auth module is implemented
- All responses follow consistent API format
- Soft delete preserves data integrity
- UUID used for all IDs
