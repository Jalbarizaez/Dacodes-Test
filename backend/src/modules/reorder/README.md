# Reorder Module

Módulo para gestionar reglas de reorden automático y alertas de bajo stock en el sistema de inventario DaCodes.

## Descripción

Este módulo implementa un sistema básico de reorden que:
- Define reglas de reorden por producto (nivel mínimo, cantidad de reorden)
- Evalúa el stock actual contra las reglas configuradas
- Genera sugerencias de reorden cuando el stock está bajo
- Crea alertas automáticas de bajo stock
- Proporciona estadísticas de reorden

**Diseño preparado para IA**: La estructura está diseñada para ser fácilmente reemplazada con un sistema basado en IA en el futuro. Los campos adicionales (maxQuantity, safetyStock, leadTimeDays) ya están preparados para algoritmos más sofisticados.

## Características

- ✅ Reglas de reorden por producto
- ✅ Evaluación automática de stock vs reglas
- ✅ Sugerencias de reorden con niveles de urgencia
- ✅ Alertas de bajo stock
- ✅ Estadísticas de reorden
- ✅ Cálculo de cantidad sugerida de pedido
- ✅ Niveles de urgencia (LOW, MEDIUM, HIGH, CRITICAL)
- ✅ Habilitación/deshabilitación de reglas
- ✅ Resolución de alertas
- ✅ Preparado para expansión con IA

## Conceptos Clave

### Regla de Reorden (ReorderRule)
Define los parámetros de reorden para un producto:
- **minimumQuantity**: Nivel mínimo de stock (punto de reorden)
- **reorderQuantity**: Cantidad estándar a pedir
- **isEnabled**: Si la regla está activa

### Alerta de Reorden (ReorderAlert)
Se crea automáticamente cuando el stock cae por debajo del mínimo:
- **currentStock**: Stock actual cuando se creó la alerta
- **minimumQuantity**: Nivel mínimo configurado
- **suggestedOrderQuantity**: Cantidad sugerida a pedir
- **isResolved**: Si la alerta fue resuelta

### Sugerencia de Reorden (ReorderSuggestion)
Recomendación generada al evaluar las reglas:
- **stockDeficit**: Déficit de stock (mínimo - actual)
- **urgencyLevel**: Nivel de urgencia (LOW, MEDIUM, HIGH, CRITICAL)
- **reason**: Razón legible del reorden

### Niveles de Urgencia

| Nivel | Condición | Descripción |
|-------|-----------|-------------|
| **CRITICAL** | Stock = 0 | Sin stock disponible |
| **HIGH** | Déficit ≥ 75% | 75% o más por debajo del mínimo |
| **MEDIUM** | Déficit ≥ 50% | 50-75% por debajo del mínimo |
| **LOW** | Déficit < 50% | Menos del 50% por debajo del mínimo |

## Endpoints

### 1. Crear Regla de Reorden
**POST** `/api/v1/reorder/rules`

Crea una nueva regla de reorden para un producto.

**Request Body:**
```json
{
  "productId": "uuid",
  "minimumQuantity": 10,
  "reorderQuantity": 50,
  "isEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "productSku": "PROD-001",
    "productName": "Sample Product 1",
    "minimumQuantity": 10,
    "reorderQuantity": 50,
    "isEnabled": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "maxQuantity": null,
    "safetyStock": null,
    "leadTimeDays": null
  }
}
```

**Validaciones:**
- Producto debe existir y estar activo
- No puede haber regla duplicada para el mismo producto
- minimumQuantity debe ser no negativo
- reorderQuantity debe ser positivo

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/reorder/rules \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid",
    "minimumQuantity": 10,
    "reorderQuantity": 50,
    "isEnabled": true
  }'
```

---

### 2. Listar Reglas de Reorden
**GET** `/api/v1/reorder/rules`

Obtiene todas las reglas de reorden con filtros y paginación.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `pageSize` (opcional): Tamaño de página (default: 20, max: 100)
- `productId` (opcional): Filtrar por producto
- `isEnabled` (opcional): Filtrar por estado (true/false)
- `sortBy` (opcional): Campo de ordenamiento (minimumQuantity, reorderQuantity, createdAt)
- `sortOrder` (opcional): Orden (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "productSku": "PROD-001",
      "productName": "Sample Product 1",
      "minimumQuantity": 10,
      "reorderQuantity": 50,
      "isEnabled": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
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
# Listar todas las reglas
curl http://localhost:3000/api/v1/reorder/rules

# Filtrar por producto
curl "http://localhost:3000/api/v1/reorder/rules?productId=uuid"

# Solo reglas habilitadas
curl "http://localhost:3000/api/v1/reorder/rules?isEnabled=true"
```

---

### 3. Obtener Regla por ID
**GET** `/api/v1/reorder/rules/:id`

Obtiene los detalles de una regla de reorden específica.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "productSku": "PROD-001",
    "productName": "Sample Product 1",
    "minimumQuantity": 10,
    "reorderQuantity": 50,
    "isEnabled": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/v1/reorder/rules/uuid
```

---

### 4. Obtener Regla por Producto
**GET** `/api/v1/reorder/rules/product/:productId`

Obtiene la regla de reorden de un producto específico.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "productSku": "PROD-001",
    "productName": "Sample Product 1",
    "minimumQuantity": 10,
    "reorderQuantity": 50,
    "isEnabled": true
  }
}
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/v1/reorder/rules/product/product-uuid
```

---

### 5. Actualizar Regla de Reorden
**PUT** `/api/v1/reorder/rules/:id`

Actualiza una regla de reorden existente.

**Request Body:**
```json
{
  "minimumQuantity": 15,
  "reorderQuantity": 60,
  "isEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "productSku": "PROD-001",
    "productName": "Sample Product 1",
    "minimumQuantity": 15,
    "reorderQuantity": 60,
    "isEnabled": true,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

**Ejemplo cURL:**
```bash
curl -X PUT http://localhost:3000/api/v1/reorder/rules/uuid \
  -H "Content-Type: application/json" \
  -d '{
    "minimumQuantity": 15,
    "reorderQuantity": 60
  }'
```

---

### 6. Eliminar Regla de Reorden
**DELETE** `/api/v1/reorder/rules/:id`

Elimina una regla de reorden.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Reorder rule deleted successfully"
  }
}
```

**Ejemplo cURL:**
```bash
curl -X DELETE http://localhost:3000/api/v1/reorder/rules/uuid
```

---

### 7. Obtener Sugerencias de Reorden
**GET** `/api/v1/reorder/suggestions`

Evalúa todas las reglas habilitadas y retorna sugerencias de reorden (sin crear alertas).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "uuid",
      "productSku": "PROD-001",
      "productName": "Sample Product 1",
      "currentStock": 5,
      "minimumQuantity": 10,
      "reorderQuantity": 50,
      "suggestedOrderQuantity": 55,
      "stockDeficit": 5,
      "urgencyLevel": "MEDIUM",
      "reason": "MEDIUM: Stock is 5 units below minimum (50% deficit)"
    }
  ]
}
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/v1/reorder/suggestions
```

---

### 8. Evaluar Reglas y Crear Alertas
**POST** `/api/v1/reorder/evaluate`

Evalúa todas las reglas habilitadas, genera sugerencias Y crea alertas en la base de datos.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Reorder rules evaluated successfully",
    "suggestions": [
      {
        "productId": "uuid",
        "productSku": "PROD-001",
        "productName": "Sample Product 1",
        "currentStock": 5,
        "minimumQuantity": 10,
        "reorderQuantity": 50,
        "suggestedOrderQuantity": 55,
        "stockDeficit": 5,
        "urgencyLevel": "MEDIUM",
        "reason": "MEDIUM: Stock is 5 units below minimum (50% deficit)"
      }
    ],
    "count": 1
  }
}
```

**Uso recomendado:**
- Ejecutar periódicamente (ej: cada hora) mediante un cron job
- Ejecutar después de movimientos de stock significativos
- Ejecutar manualmente cuando se necesite revisar el inventario

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/reorder/evaluate
```

---

### 9. Listar Alertas de Reorden
**GET** `/api/v1/reorder/alerts`

Obtiene todas las alertas de reorden con filtros y paginación.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `pageSize` (opcional): Tamaño de página (default: 20, max: 100)
- `productId` (opcional): Filtrar por producto
- `isResolved` (opcional): Filtrar por estado (true/false)
- `createdDateFrom` (opcional): Fecha de creación desde (ISO 8601)
- `createdDateTo` (opcional): Fecha de creación hasta (ISO 8601)
- `sortBy` (opcional): Campo de ordenamiento (createdAt, currentStock)
- `sortOrder` (opcional): Orden (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reorderRuleId": "uuid",
      "productId": "uuid",
      "productSku": "PROD-001",
      "productName": "Sample Product 1",
      "currentStock": 5,
      "minimumQuantity": 10,
      "suggestedOrderQuantity": 55,
      "createdAt": "2024-01-15T10:00:00Z",
      "isResolved": false,
      "stockDeficit": 5,
      "urgencyLevel": "MEDIUM"
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
# Listar todas las alertas
curl http://localhost:3000/api/v1/reorder/alerts

# Solo alertas no resueltas
curl "http://localhost:3000/api/v1/reorder/alerts?isResolved=false"

# Filtrar por producto
curl "http://localhost:3000/api/v1/reorder/alerts?productId=uuid"
```

---

### 10. Resolver Alerta
**POST** `/api/v1/reorder/alerts/:id/resolve`

Marca una alerta como resuelta (ej: después de crear una orden de compra).

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Reorder alert resolved successfully"
  }
}
```

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/reorder/alerts/uuid/resolve
```

---

### 11. Obtener Estadísticas
**GET** `/api/v1/reorder/statistics`

Obtiene estadísticas generales del sistema de reorden.

**Query Parameters:**
- `productId` (opcional): Filtrar por producto
- `isEnabled` (opcional): Filtrar por estado (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRules": 10,
    "enabledRules": 8,
    "disabledRules": 2,
    "totalAlerts": 25,
    "unresolvedAlerts": 5,
    "resolvedAlerts": 20,
    "productsNeedingReorder": 5
  }
}
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/v1/reorder/statistics
```

---

## Algoritmo de Reorden Básico

### Cálculo de Cantidad Sugerida

```typescript
suggestedOrderQuantity = reorderQuantity + stockDeficit

donde:
  stockDeficit = max(0, minimumQuantity - currentStock)
```

**Ejemplo:**
- Stock actual: 5 unidades
- Nivel mínimo: 10 unidades
- Cantidad de reorden: 50 unidades
- Déficit: 10 - 5 = 5 unidades
- Cantidad sugerida: 50 + 5 = 55 unidades

### Cálculo de Nivel de Urgencia

```typescript
deficit = minimumQuantity - currentStock
deficitPercentage = (deficit / minimumQuantity) * 100

if (currentStock <= 0) → CRITICAL
else if (deficitPercentage >= 75) → HIGH
else if (deficitPercentage >= 50) → MEDIUM
else → LOW
```

---

## Flujo de Trabajo Recomendado

### 1. Configuración Inicial
```bash
# Crear reglas de reorden para productos críticos
curl -X POST http://localhost:3000/api/v1/reorder/rules \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid",
    "minimumQuantity": 10,
    "reorderQuantity": 50
  }'
```

### 2. Evaluación Periódica (Cron Job)
```bash
# Ejecutar cada hora
0 * * * * curl -X POST http://localhost:3000/api/v1/reorder/evaluate
```

### 3. Consultar Sugerencias
```bash
# Ver qué productos necesitan reorden
curl http://localhost:3000/api/v1/reorder/suggestions
```

### 4. Crear Orden de Compra
```bash
# Basado en las sugerencias, crear orden de compra
curl -X POST http://localhost:3000/api/v1/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "supplier-uuid",
    "orderDate": "2024-01-15T10:00:00Z",
    "expectedDeliveryDate": "2024-01-22T10:00:00Z",
    "lineItems": [
      {
        "productId": "product-uuid",
        "quantity": 55,
        "unitPrice": 10.00
      }
    ]
  }'
```

### 5. Resolver Alerta
```bash
# Después de crear la orden, resolver la alerta
curl -X POST http://localhost:3000/api/v1/reorder/alerts/alert-uuid/resolve
```

---

## Preparación para IA

El módulo está diseñado para ser fácilmente reemplazado con un sistema basado en IA:

### Campos Preparados (Futuros)
```typescript
interface ReorderRuleDTO {
  // Campos actuales (básicos)
  minimumQuantity: number;
  reorderQuantity: number;
  
  // Campos preparados para IA
  maxQuantity?: number;        // Nivel máximo de stock
  safetyStock?: number;        // Stock de seguridad
  leadTimeDays?: number;       // Tiempo de entrega del proveedor
}
```

### Campos Adicionales para IA
```typescript
interface ReorderSuggestion {
  // Campos actuales
  suggestedOrderQuantity: number;
  urgencyLevel: string;
  
  // Campos preparados para IA
  predictedDemand?: number;      // Demanda predicha
  recommendedSupplier?: string;  // Proveedor recomendado
  estimatedCost?: number;        // Costo estimado
}
```

### Puntos de Extensión

1. **calculateSuggestedOrderQuantity()**: Reemplazar con modelo de ML
2. **calculateUrgencyLevel()**: Reemplazar con clasificador de ML
3. **evaluateReorderRules()**: Agregar predicción de demanda
4. **getReorderSuggestions()**: Agregar optimización de costos

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `REORDER_RULE_NOT_FOUND` | Regla de reorden no encontrada |
| `REORDER_RULE_EXISTS` | Ya existe regla para este producto |
| `PRODUCT_NOT_FOUND` | Producto no encontrado |
| `PRODUCT_INACTIVE` | Producto inactivo |
| `INVALID_MINIMUM_QUANTITY` | Cantidad mínima inválida |
| `INVALID_REORDER_QUANTITY` | Cantidad de reorden inválida |
| `ALERT_NOT_FOUND` | Alerta no encontrada |
| `ALERT_ALREADY_RESOLVED` | Alerta ya resuelta |

---

## Integración con Otros Módulos

### Products
- Valida que los productos existan y estén activos
- Obtiene información de productos para respuestas

### Stock
- Lee niveles de stock para evaluar reglas
- Calcula stock total across all locations

### Purchase Orders
- Las sugerencias se usan para crear órdenes de compra
- Las alertas se resuelven después de crear órdenes

---

## Arquitectura del Módulo

```
reorder/
├── reorder.types.ts       # Tipos e interfaces TypeScript
├── reorder.validator.ts   # Esquemas de validación Zod
├── reorder.repository.ts  # Acceso a datos (Prisma)
├── reorder.service.ts     # Lógica de negocio
├── reorder.controller.ts  # Controladores HTTP
├── reorder.routes.ts      # Definición de rutas
└── README.md             # Documentación
```

**Patrón de diseño:** Repository → Service → Controller → Routes

---

## Próximas Mejoras (IA)

- [ ] Predicción de demanda con ML
- [ ] Optimización de cantidad de pedido
- [ ] Recomendación de proveedor óptimo
- [ ] Estimación de costos
- [ ] Detección de patrones estacionales
- [ ] Optimización de safety stock
- [ ] Predicción de lead time
- [ ] Alertas proactivas antes de llegar al mínimo
- [ ] Dashboard de reorden con visualizaciones
- [ ] Integración con sistema de forecasting
