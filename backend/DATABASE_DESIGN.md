# Database Design - DaCodes Inventory System

## Overview

Este documento describe el diseño completo de la base de datos para DaCodes Inventory, incluyendo todas las entidades, relaciones, índices y consideraciones de escalabilidad.

## Entidades Principales

### 1. Categories (Categorías de Productos)

**Propósito**: Organización jerárquica de productos

**Campos clave**:
- `parentId`: Permite jerarquía de categorías (ej: Electrónica > Computadoras > Laptops)
- `isActive`: Soft delete para mantener historial

**Relaciones**:
- Self-referencing para jerarquía (parent/children)
- One-to-Many con Products

**Índices**:
- `name`: Búsqueda rápida por nombre
- `parentId`: Queries de subcategorías
- `isActive`: Filtrado de categorías activas

**Escalabilidad**:
- Jerarquía ilimitada de niveles
- Soft delete preserva integridad referencial

---

### 2. Products (Productos)

**Propósito**: Catálogo maestro de productos

**Campos clave**:
- `sku`: Identificador único de negocio
- `barcode`: Código de barras para escaneo
- `minStock`/`maxStock`: Niveles de stock recomendados
- `weight`/`dimensions`: Para cálculos de logística
- `categoryId`: Categorización

**Relaciones**:
- Many-to-One con Category
- One-to-Many con StockLevel, StockMovement, Lot, etc.

**Índices**:
- `sku`: Búsqueda principal (UNIQUE)
- `barcode`: Búsqueda por código de barras (UNIQUE)
- `categoryId`: Filtrado por categoría
- `name`: Búsqueda de texto
- `isActive`: Productos activos

**Escalabilidad**:
- SKU único garantiza no duplicados
- Soft delete con `isActive`
- Campos opcionales para flexibilidad

---

### 3. Warehouses (Almacenes)

**Propósito**: Almacenes físicos

**Campos clave**:
- `name`: Nombre del almacén
- `address`: Ubicación física
- `isActive`: Estado del almacén

**Relaciones**:
- One-to-Many con Locations

**Índices**:
- `name`: Búsqueda por nombre

**Escalabilidad**:
- Soporte multi-almacén ilimitado
- Soft delete preserva historial

---

### 4. Locations (Ubicaciones dentro de Almacenes)

**Propósito**: Ubicaciones específicas dentro de almacenes (estantes, bins, pallets)

**Campos clave**:
- `code`: Código alfanumérico (ej: A-01, B-15)
- `name`: Nombre descriptivo opcional
- `type`: Tipo de ubicación (shelf, bin, pallet)
- `capacity`: Capacidad máxima

**Relaciones**:
- Many-to-One con Warehouse
- One-to-Many con StockLevel, StockMovement, LotStock

**Índices**:
- `warehouseId, code`: Unique constraint (código único por almacén)
- `warehouseId`: Queries por almacén
- `code`: Búsqueda rápida

**Escalabilidad**:
- Ubicaciones ilimitadas por almacén
- Flexible para diferentes tipos de almacenamiento

---

### 5. Suppliers (Proveedores)

**Propósito**: Gestión de proveedores

**Campos clave**:
- `name`: Nombre del proveedor
- `contactName`, `email`, `phone`: Información de contacto
- `address`: Dirección física
- `paymentTerms`: Términos de pago (ej: "Net 30")
- `leadTimeDays`: Tiempo de entrega en días

**Relaciones**:
- One-to-Many con PurchaseOrder
- One-to-Many con Lot (tracking de lotes por proveedor)

**Índices**:
- `name`: Búsqueda por nombre
- `isActive`: Proveedores activos

**Escalabilidad**:
- Información completa de contacto
- Tracking de performance (lead time)

---

### 6. StockLevel (Niveles de Stock)

**Propósito**: Stock actual por producto y ubicación con estados

**Campos clave**:
- `quantityAvailable`: Stock disponible para venta
- `quantityReserved`: Stock reservado (órdenes pendientes)
- `quantityDamaged`: Stock dañado
- `quantityTotal`: Total (computed)
- `lastCountDate`: Última fecha de conteo físico

**Estados de Stock**:
- **AVAILABLE**: Disponible para venta/uso
- **RESERVED**: Reservado para órdenes
- **DAMAGED**: Dañado, no utilizable
- **QUARANTINE**: En cuarentena (pendiente inspección)

**Relaciones**:
- Many-to-One con Product
- Many-to-One con Location

**Índices**:
- `productId, locationId`: Unique constraint
- `productId`: Queries por producto
- `locationId`: Queries por ubicación
- `quantityAvailable`: Queries de stock bajo

**Escalabilidad**:
- Separación de estados permite gestión avanzada
- Conteo físico tracking
- Optimizado para queries de disponibilidad

---

### 7. StockMovement (Movimientos de Stock)

**Propósito**: Audit trail completo de todos los movimientos de stock

**Campos clave**:
- `type`: Tipo de movimiento (RECEIPT, SHIPMENT, etc.)
- `quantity`: Cantidad (positiva o negativa)
- `fromStatus`/`toStatus`: Cambios de estado
- `lotId`: Opcional, link a lote específico
- `referenceType`/`referenceId`: Link a documento origen
- `runningBalance`: Balance después del movimiento
- `notes`: Notas adicionales

**Tipos de Movimiento**:
- `RECEIPT`: Recepción de mercancía
- `SHIPMENT`: Salida/envío
- `ADJUSTMENT`: Ajuste manual
- `TRANSFER_OUT`/`TRANSFER_IN`: Transferencias
- `EXPIRATION`: Baja por expiración
- `DAMAGE`: Baja por daño
- `RETURN`: Devolución
- `RESERVATION`/`RELEASE`: Reservas

**Relaciones**:
- Many-to-One con Product, Location, Lot, User

**Índices**:
- `productId`: Historial por producto
- `locationId`: Historial por ubicación
- `lotId`: Historial por lote
- `date`: Queries temporales
- `type`: Filtrado por tipo
- `referenceType, referenceId`: Trazabilidad

**Escalabilidad**:
- Inmutable (no se puede editar/eliminar)
- Running balance para auditoría
- Flexible reference system para cualquier documento

---

### 8. PurchaseOrder & PurchaseOrderLineItem (Órdenes de Compra)

**Propósito**: Gestión de órdenes de compra a proveedores

**PurchaseOrder - Campos clave**:
- `orderNumber`: Número único de orden
- `supplierId`: Proveedor
- `orderDate`/`expectedDeliveryDate`: Fechas
- `status`: Estado (DRAFT, SUBMITTED, etc.)
- `totalValue`: Valor total

**PurchaseOrderLineItem - Campos clave**:
- `productId`: Producto
- `quantity`: Cantidad ordenada
- `unitPrice`: Precio unitario
- `receivedQuantity`: Cantidad recibida

**Estados**:
- `DRAFT`: Borrador, editable
- `SUBMITTED`: Enviada al proveedor
- `PARTIALLY_RECEIVED`: Parcialmente recibida
- `RECEIVED`: Completamente recibida
- `CANCELLED`: Cancelada

**Relaciones**:
- PurchaseOrder: Many-to-One con Supplier
- PurchaseOrderLineItem: Many-to-One con PurchaseOrder y Product

**Índices**:
- `orderNumber`: Búsqueda única
- `supplierId`: Órdenes por proveedor
- `status`: Filtrado por estado
- `purchaseOrderId`: Items por orden

**Escalabilidad**:
- State machine bien definido
- Tracking de cantidades recibidas
- Cálculo automático de totales

---

### 9. Reception & ReceptionItem (Recepciones)

**Propósito**: Registro de recepciones de mercancía

**Reception - Campos clave**:
- `purchaseOrderId`: Orden relacionada
- `receivedDate`: Fecha de recepción
- `receivedBy`: Usuario que recibió

**ReceptionItem - Campos clave**:
- `lineItemId`: Item de la orden
- `receivedQuantity`: Cantidad recibida
- `locationId`: Ubicación de destino
- `batchNumber`/`expirationDate`: Info de lote

**Relaciones**:
- Reception: Many-to-One con PurchaseOrder
- ReceptionItem: Many-to-One con Reception y PurchaseOrderLineItem

**Índices**:
- `purchaseOrderId`: Recepciones por orden
- `receptionId`: Items por recepción

**Escalabilidad**:
- Soporte para recepciones parciales
- Tracking de discrepancias
- Creación automática de lotes

---

### 10. StockTransfer & StockTransferItem (Transferencias)

**Propósito**: Transferencias de stock entre ubicaciones/almacenes

**StockTransfer - Campos clave**:
- `transferNumber`: Número único
- `sourceLocationId`/`destinationLocationId`: Origen/destino
- `status`: Estado del transfer
- `requestedDate`/`shippedDate`/`completedDate`: Fechas
- `requestedBy`/`approvedBy`: Usuarios

**StockTransferItem - Campos clave**:
- `productId`: Producto
- `lotId`: Lote específico (opcional)
- `quantityRequested`/`quantityShipped`/`quantityReceived`: Cantidades

**Estados**:
- `PENDING`: Pendiente
- `IN_TRANSIT`: En tránsito
- `COMPLETED`: Completada
- `CANCELLED`: Cancelada

**Relaciones**:
- StockTransfer: Many-to-One con Location (source/destination), User
- StockTransferItem: Many-to-One con StockTransfer, Product, Lot

**Índices**:
- `transferNumber`: Búsqueda única
- `status`: Filtrado por estado
- `sourceLocationId`/`destinationLocationId`: Transfers por ubicación
- `transferId`: Items por transfer

**Escalabilidad**:
- Soporte multi-item
- Tracking de cantidades en cada etapa
- Aprobación workflow

---

### 11. Lot & LotStock (Lotes)

**Propósito**: Gestión de lotes con fechas de expiración

**Lot - Campos clave**:
- `lotNumber`: Número único de lote
- `productId`: Producto
- `manufacturingDate`/`expirationDate`: Fechas
- `isExpired`: Flag de expiración
- `supplierId`: Proveedor del lote
- `notes`: Notas adicionales

**LotStock - Campos clave**:
- `lotId`: Lote
- `locationId`: Ubicación
- `quantity`: Cantidad en esa ubicación

**Relaciones**:
- Lot: Many-to-One con Product y Supplier
- LotStock: Many-to-One con Lot y Location

**Índices**:
- `lotNumber`: Búsqueda única
- `productId`: Lotes por producto
- `expirationDate`: Queries de expiración
- `isExpired`: Lotes expirados
- `lotId, locationId`: Unique constraint

**Escalabilidad**:
- FEFO (First Expired First Out) support
- Tracking por ubicación
- Alertas de expiración

---

### 12. ReorderRule & ReorderAlert (Reglas de Reorden)

**Propósito**: Automatización de alertas de reorden

**ReorderRule - Campos clave**:
- `productId`: Producto (unique)
- `minimumQuantity`: Cantidad mínima
- `reorderQuantity`: Cantidad a ordenar
- `isEnabled`: Activar/desactivar regla

**ReorderAlert - Campos clave**:
- `reorderRuleId`: Regla que generó la alerta
- `productId`: Producto
- `currentStock`: Stock actual
- `suggestedOrderQuantity`: Cantidad sugerida
- `isResolved`: Estado de la alerta

**Relaciones**:
- ReorderRule: One-to-One con Product
- ReorderAlert: Many-to-One con ReorderRule

**Índices**:
- `productId`: Regla por producto (unique)
- `isEnabled`: Reglas activas
- `isResolved`: Alertas pendientes
- `createdAt`: Ordenamiento temporal

**Escalabilidad**:
- Evaluación automática (cron job)
- Historial de alertas
- Configuración por producto

---

### 13. User (Usuarios)

**Propósito**: Usuarios del sistema con roles

**Campos clave**:
- `email`: Email único
- `passwordHash`: Password hasheado
- `firstName`/`lastName`: Nombre completo
- `role`: Rol (ADMIN, MANAGER, OPERATOR)
- `lastLoginAt`: Último login

**Roles**:
- `ADMIN`: Acceso completo
- `MANAGER`: Gestión de inventario
- `OPERATOR`: Operaciones básicas

**Relaciones**:
- One-to-Many con StockMovement, StockTransfer, AuditLog

**Índices**:
- `email`: Login (unique)
- `role`: Queries por rol

**Escalabilidad**:
- Role-based access control
- Tracking de actividad

---

### 14. AuditLog (Logs de Auditoría)

**Propósito**: Registro completo de todas las acciones en el sistema

**Campos clave**:
- `userId`: Usuario que realizó la acción
- `action`: Tipo de acción (CREATE, UPDATE, DELETE, etc.)
- `entityType`/`entityId`: Entidad afectada
- `oldValues`/`newValues`: Valores antes/después (JSON)
- `ipAddress`/`userAgent`: Información de sesión
- `description`: Descripción legible

**Acciones**:
- `CREATE`, `UPDATE`, `DELETE`: CRUD operations
- `LOGIN`, `LOGOUT`: Autenticación
- `EXPORT`, `IMPORT`: Operaciones masivas

**Relaciones**:
- Many-to-One con User (nullable para acciones del sistema)

**Índices**:
- `userId`: Acciones por usuario
- `entityType, entityId`: Historial de entidad
- `action`: Filtrado por tipo
- `createdAt`: Ordenamiento temporal

**Escalabilidad**:
- Inmutable (append-only)
- JSON para flexibilidad
- Particionamiento por fecha recomendado

---

## Diagrama de Relaciones

```
Categories (self-referencing)
    ↓
Products ← Lots ← LotStock → Locations
    ↓                           ↑
StockLevel ← StockMovement ← Warehouses
    ↓
ReorderRule → ReorderAlert

Suppliers → PurchaseOrder → PurchaseOrderLineItem → Product
                ↓
            Reception → ReceptionItem

Locations → StockTransfer → StockTransferItem → Product
                                                  ↓
                                                 Lot

Users → StockMovement
     → StockTransfer
     → AuditLog
```

## Índices Recomendados

### Índices de Búsqueda Principal:
- `products.sku` (UNIQUE)
- `products.barcode` (UNIQUE)
- `lots.lotNumber` (UNIQUE)
- `purchase_orders.orderNumber` (UNIQUE)
- `stock_transfers.transferNumber` (UNIQUE)
- `users.email` (UNIQUE)

### Índices de Foreign Keys:
Todos los foreign keys tienen índices automáticos en Prisma

### Índices Compuestos:
- `stock_levels(productId, locationId)` - UNIQUE
- `lot_stocks(lotId, locationId)` - UNIQUE
- `locations(warehouseId, code)` - UNIQUE

### Índices de Filtrado:
- `products.categoryId`
- `products.isActive`
- `stock_movements.type`
- `stock_movements.date`
- `purchase_orders.status`
- `stock_transfers.status`
- `lots.expirationDate`
- `lots.isExpired`

### Índices de Búsqueda de Texto:
- `products.name`
- `categories.name`
- `suppliers.name`

### Índices de Trazabilidad:
- `stock_movements(referenceType, referenceId)`
- `audit_logs(entityType, entityId)`

## Consideraciones de Escalabilidad

### 1. Particionamiento de Tablas Grandes

**StockMovement**:
- Tabla de alto volumen (append-only)
- Considerar particionamiento por fecha (mensual/anual)
- Archivar movimientos antiguos después de X años

**AuditLog**:
- Tabla de muy alto volumen
- Particionamiento por fecha recomendado
- Retención configurable (ej: 2 años)

### 2. Optimización de Queries

**Stock Queries**:
```sql
-- Optimizado con índice en quantityAvailable
SELECT * FROM stock_levels 
WHERE productId = ? AND quantityAvailable > 0;
```

**Movement History**:
```sql
-- Optimizado con índice compuesto
SELECT * FROM stock_movements 
WHERE referenceType = 'purchase_order' AND referenceId = ?;
```

### 3. Desnormalización Estratégica

**StockLevel.quantityTotal**:
- Campo calculado para evitar SUM en queries frecuentes
- Actualizado en cada movimiento

**PurchaseOrder.totalValue**:
- Calculado y almacenado para performance
- Recalculado al modificar line items

### 4. Soft Deletes

Todas las entidades principales usan `isActive` para soft delete:
- Preserva integridad referencial
- Mantiene historial completo
- Permite "undelete"

### 5. Timestamps

Todas las tablas tienen:
- `createdAt`: Timestamp de creación
- `updatedAt`: Timestamp de última modificación (auto-actualizado)

### 6. UUIDs vs Auto-increment

**UUIDs** (usado en este diseño):
- ✅ Globalmente únicos
- ✅ Seguros para APIs públicas
- ✅ Merge-friendly en sistemas distribuidos
- ❌ Más espacio (16 bytes vs 4/8 bytes)
- ❌ Índices más grandes

### 7. Connection Pooling

Prisma maneja connection pooling automáticamente:
- Pool size configurable
- Timeout configurable
- Retry logic incluido

### 8. Transacciones

Operaciones críticas deben usar transacciones:
- Recepciones (stock + movements)
- Transferencias (source + destination)
- Ajustes de stock

### 9. Caching Strategy

**Datos frecuentemente leídos**:
- Categorías (raramente cambian)
- Productos activos
- Configuración de reorder rules

**Invalidación**:
- Cache invalidation en updates
- TTL apropiado por tipo de dato

### 10. Monitoring

**Métricas clave**:
- Query performance (slow query log)
- Table sizes (especialmente movements y audit_logs)
- Index usage
- Connection pool utilization

## Migraciones

### Estrategia de Migraciones

1. **Desarrollo**: `prisma migrate dev`
2. **Staging**: `prisma migrate deploy`
3. **Producción**: `prisma migrate deploy` con backup previo

### Rollback Strategy

- Mantener migraciones reversibles cuando sea posible
- Backup antes de migraciones en producción
- Testing exhaustivo en staging

## Backup y Recovery

### Backup Strategy

**Frecuencia**:
- Full backup: Diario
- Incremental: Cada hora
- Transaction log: Continuo

**Retención**:
- Daily backups: 30 días
- Weekly backups: 3 meses
- Monthly backups: 1 año

### Recovery Testing

- Test de restore mensual
- Documentar RTO (Recovery Time Objective)
- Documentar RPO (Recovery Point Objective)

## Conclusión

Este diseño de base de datos proporciona:

✅ **Trazabilidad completa**: Audit trail de todos los movimientos
✅ **Multi-almacén**: Soporte ilimitado de almacenes y ubicaciones
✅ **Gestión de lotes**: Tracking de expiración y FEFO
✅ **Estados de stock**: Disponible, reservado, dañado
✅ **Escalabilidad**: Diseñado para crecimiento
✅ **Integridad**: Foreign keys y constraints apropiados
✅ **Performance**: Índices optimizados
✅ **Flexibilidad**: Soft deletes y campos opcionales

El schema está listo para soportar el MVP y escalar según las necesidades del negocio.
