# Sistema de Auditoría

Sistema básico y extensible para registrar acciones críticas en el backend del sistema de inventario DaCodes.

## Descripción

El sistema de auditoría registra automáticamente las acciones críticas realizadas en el sistema, incluyendo:
- Creación/edición de productos
- Movimientos de stock
- Recepciones de órdenes de compra
- Transferencias entre ubicaciones

Los logs de auditoría se almacenan en la tabla `audit_logs` y son **fire-and-forget**, lo que significa que los errores de auditoría no bloquean las operaciones principales.

## Estructura de AuditLog

```typescript
interface AuditLog {
  id: string;
  userId?: string;           // Usuario que realizó la acción (opcional para acciones del sistema)
  action: AuditAction;       // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, IMPORT
  entityType: string;        // Tipo de entidad (ej: "product", "stock_movement")
  entityId?: string;         // ID de la entidad afectada
  oldValues?: string;        // JSON con valores anteriores (para UPDATE/DELETE)
  newValues?: string;        // JSON con valores nuevos (para CREATE/UPDATE)
  ipAddress?: string;        // Dirección IP del usuario
  userAgent?: string;        // User agent del navegador
  description?: string;      // Descripción legible
  createdAt: Date;          // Fecha y hora del evento
}
```

## Funciones Principales

### createAuditLog(data: AuditLogData)
Función base para crear un log de auditoría. Es fire-and-forget y no lanza errores.

```typescript
await createAuditLog({
  userId: 'user-uuid',
  action: 'CREATE',
  entityType: 'product',
  entityId: 'product-uuid',
  newValues: { sku: 'PROD-001', name: 'Product 1' },
  description: 'Created product PROD-001',
});
```

### auditCreate(entityType, entityId, newValues, userId?, description?)
Helper para auditar creaciones.

```typescript
await auditCreate(
  'product',
  product.id,
  { sku: product.sku, name: product.name },
  userId,
  `Created product ${product.sku}`
);
```

### auditUpdate(entityType, entityId, oldValues, newValues, userId?, description?)
Helper para auditar actualizaciones.

```typescript
await auditUpdate(
  'product',
  product.id,
  { name: 'Old Name' },
  { name: 'New Name' },
  userId,
  `Updated product ${product.sku}`
);
```

### auditDelete(entityType, entityId, oldValues, userId?, description?)
Helper para auditar eliminaciones.

```typescript
await auditDelete(
  'product',
  product.id,
  { sku: product.sku, name: product.name },
  userId,
  `Deleted product ${product.sku}`
);
```

## Funciones Auxiliares

### sanitizeForAudit(data: any)
Elimina campos sensibles antes de guardar en el log.

```typescript
const sanitized = sanitizeForAudit({
  email: 'user@example.com',
  password: 'secret123',
  token: 'abc123',
});
// Resultado: { email: 'user@example.com', password: '[REDACTED]', token: '[REDACTED]' }
```

### extractChangedFields(oldValues, newValues)
Extrae solo los campos que cambiaron entre dos objetos.

```typescript
const { old, new: updated } = extractChangedFields(
  { name: 'Old Name', price: 10, stock: 5 },
  { name: 'New Name', price: 10, stock: 8 }
);
// old: { name: 'Old Name', stock: 5 }
// new: { name: 'New Name', stock: 8 }
```

### createAuditSummary(data, fields)
Crea un resumen con solo los campos especificados.

```typescript
const summary = createAuditSummary(
  { id: '123', sku: 'PROD-001', name: 'Product 1', description: 'Long description...' },
  ['id', 'sku', 'name']
);
// Resultado: { id: '123', sku: 'PROD-001', name: 'Product 1' }
```

## Integración en Módulos

### Productos (Products)

**Creación:**
```typescript
const product = await this.repository.create(data);

await auditCreate(
  'product',
  product.id,
  createAuditSummary(product, ['id', 'sku', 'name', 'categoryId', 'isActive']),
  userId,
  `Created product ${product.sku}`
);
```

**Actualización:**
```typescript
const existingProduct = await this.repository.findById(id);
const updatedProduct = await this.repository.update(id, data);

await auditUpdate(
  'product',
  id,
  createAuditSummary(existingProduct, ['name', 'description', 'categoryId', 'isActive']),
  createAuditSummary(updatedProduct, ['name', 'description', 'categoryId', 'isActive']),
  userId,
  `Updated product ${existingProduct.sku}`
);
```

### Movimientos de Stock (Stock Movements)

```typescript
const movement = await tx.stockMovement.create({ data: movementData });

auditCreate(
  'stock_movement',
  movement.id,
  createAuditSummary(movement, ['type', 'productId', 'locationId', 'quantity', 'runningBalance']),
  movementData.userId,
  `Stock movement ${movement.type}: ${movement.quantity} units`
).catch(() => {
  // Ignore audit errors to not break the transaction
});
```

### Recepciones (Receptions)

```typescript
const reception = await tx.reception.create({ data: receptionData });

auditCreate(
  'reception',
  reception.id,
  createAuditSummary(
    { id: reception.id, purchaseOrderId, itemCount: items.length, receivedDate },
    ['id', 'purchaseOrderId', 'itemCount', 'receivedDate']
  ),
  userId,
  `Reception created for PO ${purchaseOrderId} with ${items.length} items`
).catch(() => {
  // Ignore audit errors
});
```

### Transferencias (Transfers)

**Creación:**
```typescript
const transfer = await prisma.stockTransfer.create({ data: transferData });

auditCreate(
  'transfer',
  transfer.id,
  createAuditSummary(
    { ...transfer, itemCount: items.length },
    ['id', 'transferNumber', 'sourceLocationId', 'destinationLocationId', 'status', 'itemCount']
  ),
  requestedBy,
  `Transfer ${transferNumber} created with ${items.length} items`
).catch(() => {
  // Ignore audit errors
});
```

**Envío:**
```typescript
auditUpdate(
  'transfer',
  transferId,
  { status: 'PENDING' },
  { status: 'IN_TRANSIT', shippedDate },
  userId,
  `Transfer ${transfer.transferNumber} shipped`
).catch(() => {
  // Ignore audit errors
});
```

**Completado:**
```typescript
auditUpdate(
  'transfer',
  transferId,
  { status: 'IN_TRANSIT' },
  { status: 'COMPLETED', completedDate },
  userId,
  `Transfer ${transfer.transferNumber} completed`
).catch(() => {
  // Ignore audit errors
});
```

## Mejores Prácticas

### 1. Fire-and-Forget
Los logs de auditoría no deben bloquear las operaciones principales:

```typescript
// ✅ CORRECTO: Usar .catch() para ignorar errores
auditCreate('product', id, data, userId).catch(() => {});

// ❌ INCORRECTO: Usar await sin manejo de errores
await auditCreate('product', id, data, userId);
```

### 2. Dentro de Transacciones
Cuando se usa dentro de transacciones, siempre usar .catch():

```typescript
return prisma.$transaction(async (tx) => {
  const entity = await tx.entity.create({ data });
  
  // Fire-and-forget para no romper la transacción
  auditCreate('entity', entity.id, data, userId).catch(() => {});
  
  return entity;
});
```

### 3. Resúmenes en Lugar de Objetos Completos
Usar `createAuditSummary()` para reducir el tamaño de los logs:

```typescript
// ✅ CORRECTO: Solo campos importantes
auditCreate(
  'product',
  product.id,
  createAuditSummary(product, ['id', 'sku', 'name', 'isActive']),
  userId
);

// ❌ INCORRECTO: Objeto completo con muchos campos
auditCreate('product', product.id, product, userId);
```

### 4. Descripciones Legibles
Incluir descripciones que sean útiles para humanos:

```typescript
// ✅ CORRECTO: Descripción clara
auditCreate(
  'product',
  product.id,
  data,
  userId,
  `Created product ${product.sku} - ${product.name}`
);

// ❌ INCORRECTO: Descripción genérica
auditCreate('product', product.id, data, userId, 'Created');
```

### 5. Sanitizar Datos Sensibles
Siempre sanitizar antes de guardar:

```typescript
const sanitizedData = sanitizeForAudit(userData);
await auditCreate('user', user.id, sanitizedData, userId);
```

## Tipos de Entidades Auditadas

| Entity Type | Acciones | Descripción |
|-------------|----------|-------------|
| `product` | CREATE, UPDATE | Productos del catálogo |
| `stock_movement` | CREATE | Movimientos de inventario |
| `reception` | CREATE | Recepciones de órdenes de compra |
| `transfer` | CREATE, UPDATE | Transferencias entre ubicaciones |
| `purchase_order` | CREATE, UPDATE | Órdenes de compra |
| `supplier` | CREATE, UPDATE | Proveedores |
| `warehouse` | CREATE, UPDATE | Almacenes |
| `location` | CREATE, UPDATE | Ubicaciones dentro de almacenes |
| `user` | CREATE, UPDATE, LOGIN, LOGOUT | Usuarios (futuro) |

## Consultas de Auditoría

### Obtener logs por entidad
```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    entityType: 'product',
    entityId: 'product-uuid',
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

### Obtener logs por usuario
```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    userId: 'user-uuid',
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 50,
});
```

### Obtener logs por acción
```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    action: 'CREATE',
    entityType: 'product',
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

### Obtener logs por rango de fechas
```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    createdAt: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-01-31'),
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

## Extensibilidad

El sistema está diseñado para ser fácilmente extensible:

### Agregar Nuevos Tipos de Entidades
Simplemente usar el helper con el nuevo tipo:

```typescript
await auditCreate('new_entity_type', entityId, data, userId);
```

### Agregar Nuevas Acciones
Si se necesitan nuevas acciones, agregar al enum en Prisma:

```prisma
enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  EXPORT
  IMPORT
  APPROVE  // Nueva acción
  REJECT   // Nueva acción
}
```

### Agregar Campos Adicionales
El sistema soporta campos adicionales como `ipAddress` y `userAgent`:

```typescript
await createAuditLog({
  userId,
  action: 'CREATE',
  entityType: 'product',
  entityId: product.id,
  newValues: data,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  description: 'Created product',
});
```

## Próximas Mejoras

- [x] Endpoint REST para consultar logs de auditoría
- [ ] Dashboard de auditoría en el frontend
- [ ] Exportación de logs a CSV/Excel
- [ ] Retención automática de logs (eliminar logs antiguos)
- [ ] Alertas basadas en patrones de auditoría
- [ ] Integración con sistemas externos de SIEM
- [ ] Firma digital de logs para no repudio
- [ ] Compresión de logs antiguos
- [ ] Búsqueda full-text en logs
- [ ] Visualización de timeline de cambios por entidad

## Endpoints REST

El sistema incluye un módulo completo de endpoints REST para consultar logs de auditoría. Ver documentación completa en `backend/src/modules/audit/README.md`.

### Endpoints Disponibles

1. **GET /api/v1/audit/logs** - Listar logs con filtros y paginación
2. **GET /api/v1/audit/logs/:id** - Obtener log por ID
3. **GET /api/v1/audit/logs/entity/:entityType/:entityId** - Historial de cambios de una entidad
4. **GET /api/v1/audit/logs/user/:userId** - Logs de un usuario específico
5. **GET /api/v1/audit/statistics** - Estadísticas de auditoría

### Ejemplo de Uso

```bash
# Obtener historial de cambios de un producto
curl -X GET "http://localhost:3000/api/v1/audit/logs/entity/product/product-uuid"

# Obtener estadísticas de auditoría
curl -X GET "http://localhost:3000/api/v1/audit/statistics"

# Buscar logs por tipo de entidad
curl -X GET "http://localhost:3000/api/v1/audit/logs?entityType=product&action=CREATE"
```

Ver documentación completa en `backend/src/modules/audit/README.md`.
