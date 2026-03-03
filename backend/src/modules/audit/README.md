# Módulo de Auditoría

Módulo para consultar y analizar los logs de auditoría del sistema de inventario DaCodes.

## Descripción

Este módulo proporciona endpoints REST para consultar los logs de auditoría generados automáticamente por el sistema. Los logs registran todas las acciones críticas realizadas en el sistema, incluyendo creaciones, actualizaciones y eliminaciones de entidades.

## Endpoints

### 1. Listar Logs de Auditoría

```
GET /api/v1/audit/logs
```

Obtiene todos los logs de auditoría con filtros y paginación.

**Query Parameters:**
- `userId` (opcional): Filtrar por ID de usuario
- `action` (opcional): Filtrar por acción (CREATE, UPDATE, DELETE, etc.)
- `entityType` (opcional): Filtrar por tipo de entidad (product, stock_movement, etc.)
- `entityId` (opcional): Filtrar por ID de entidad específica
- `dateFrom` (opcional): Fecha desde (ISO 8601)
- `dateTo` (opcional): Fecha hasta (ISO 8601)
- `search` (opcional): Búsqueda en entityType, entityId y description
- `page` (opcional): Número de página (default: 1)
- `pageSize` (opcional): Tamaño de página (default: 20, max: 100)
- `sortBy` (opcional): Campo para ordenar (createdAt, action, entityType)
- `sortOrder` (opcional): Orden (asc, desc)

**Ejemplo:**
```bash
curl -X GET "http://localhost:3000/api/v1/audit/logs?entityType=product&action=CREATE&page=1&pageSize=20"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "userId": "user-uuid",
        "action": "CREATE",
        "entityType": "product",
        "entityId": "product-uuid",
        "oldValues": null,
        "newValues": "{\"id\":\"...\",\"sku\":\"PROD-001\",\"name\":\"Product 1\"}",
        "ipAddress": null,
        "userAgent": null,
        "description": "Created product PROD-001",
        "createdAt": "2024-01-15T10:30:00Z",
        "user": {
          "id": "user-uuid",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 150,
      "totalPages": 8
    }
  },
  "message": "Audit logs retrieved successfully"
}
```

### 2. Obtener Log por ID

```
GET /api/v1/audit/logs/:id
```

Obtiene un log de auditoría específico por su ID.

**Ejemplo:**
```bash
curl -X GET "http://localhost:3000/api/v1/audit/logs/uuid"
```

### 3. Obtener Logs por Entidad

```
GET /api/v1/audit/logs/entity/:entityType/:entityId
```

Obtiene todos los logs de auditoría para una entidad específica (historial de cambios).

**Query Parameters:**
- `limit` (opcional): Número máximo de logs (default: 50, max: 100)

**Ejemplo:**
```bash
curl -X GET "http://localhost:3000/api/v1/audit/logs/entity/product/product-uuid?limit=50"
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "action": "CREATE",
      "entityType": "product",
      "entityId": "product-uuid",
      "newValues": "{\"sku\":\"PROD-001\",\"name\":\"Product 1\"}",
      "description": "Created product PROD-001",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid-2",
      "action": "UPDATE",
      "entityType": "product",
      "entityId": "product-uuid",
      "oldValues": "{\"name\":\"Product 1\"}",
      "newValues": "{\"name\":\"Updated Product 1\"}",
      "description": "Updated product PROD-001",
      "createdAt": "2024-01-16T14:20:00Z"
    }
  ],
  "message": "Audit logs retrieved successfully"
}
```

### 4. Obtener Logs por Usuario

```
GET /api/v1/audit/logs/user/:userId
```

Obtiene todos los logs de auditoría de un usuario específico.

**Query Parameters:**
- `limit` (opcional): Número máximo de logs (default: 50, max: 100)

**Ejemplo:**
```bash
curl -X GET "http://localhost:3000/api/v1/audit/logs/user/user-uuid?limit=50"
```

### 5. Obtener Estadísticas de Auditoría

```
GET /api/v1/audit/statistics
```

Obtiene estadísticas agregadas de los logs de auditoría.

**Query Parameters:**
- `userId` (opcional): Filtrar por usuario
- `action` (opcional): Filtrar por acción
- `entityType` (opcional): Filtrar por tipo de entidad
- `entityId` (opcional): Filtrar por entidad específica

**Ejemplo:**
```bash
curl -X GET "http://localhost:3000/api/v1/audit/statistics"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 1250,
    "byAction": {
      "CREATE": 450,
      "UPDATE": 650,
      "DELETE": 150
    },
    "byEntityType": {
      "product": 320,
      "stock_movement": 580,
      "transfer": 180,
      "reception": 120,
      "purchase_order": 50
    },
    "recentActivity": {
      "last24Hours": 45,
      "last7Days": 280,
      "last30Days": 890
    }
  },
  "message": "Audit statistics retrieved successfully"
}
```

## Tipos de Entidades Auditadas

| Entity Type | Descripción |
|-------------|-------------|
| `product` | Productos del catálogo |
| `stock_movement` | Movimientos de inventario |
| `reception` | Recepciones de órdenes de compra |
| `transfer` | Transferencias entre ubicaciones |
| `purchase_order` | Órdenes de compra |
| `supplier` | Proveedores |
| `warehouse` | Almacenes |
| `location` | Ubicaciones dentro de almacenes |

## Acciones de Auditoría

| Action | Descripción |
|--------|-------------|
| `CREATE` | Creación de entidad |
| `UPDATE` | Actualización de entidad |
| `DELETE` | Eliminación de entidad |
| `LOGIN` | Inicio de sesión (futuro) |
| `LOGOUT` | Cierre de sesión (futuro) |
| `EXPORT` | Exportación de datos (futuro) |
| `IMPORT` | Importación de datos (futuro) |

## Casos de Uso

### 1. Ver Historial de Cambios de un Producto

```bash
# Obtener todos los cambios de un producto específico
curl -X GET "http://localhost:3000/api/v1/audit/logs/entity/product/product-uuid"
```

### 2. Auditar Acciones de un Usuario

```bash
# Ver todas las acciones realizadas por un usuario
curl -X GET "http://localhost:3000/api/v1/audit/logs/user/user-uuid"
```

### 3. Monitorear Creaciones Recientes

```bash
# Ver todas las creaciones en las últimas 24 horas
curl -X GET "http://localhost:3000/api/v1/audit/logs?action=CREATE&dateFrom=2024-01-15T00:00:00Z"
```

### 4. Buscar Cambios en Movimientos de Stock

```bash
# Buscar todos los movimientos de stock
curl -X GET "http://localhost:3000/api/v1/audit/logs?entityType=stock_movement&page=1&pageSize=50"
```

### 5. Dashboard de Actividad

```bash
# Obtener estadísticas para dashboard
curl -X GET "http://localhost:3000/api/v1/audit/statistics"
```

## Estructura de Datos

### AuditLog

```typescript
interface AuditLog {
  id: string;
  userId: string | null;           // Usuario que realizó la acción
  action: AuditAction;              // CREATE, UPDATE, DELETE, etc.
  entityType: string;               // Tipo de entidad
  entityId: string | null;          // ID de la entidad
  oldValues: string | null;         // JSON con valores anteriores
  newValues: string | null;         // JSON con valores nuevos
  ipAddress: string | null;         // IP del usuario
  userAgent: string | null;         // User agent del navegador
  description: string | null;       // Descripción legible
  createdAt: Date;                  // Fecha y hora del evento
  user?: {                          // Información del usuario
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}
```

## Notas Importantes

### 1. Logs de Solo Lectura

Los logs de auditoría son de solo lectura. No hay endpoints para crear, actualizar o eliminar logs manualmente. Los logs se crean automáticamente por el sistema.

### 2. Retención de Datos

Actualmente no hay política de retención automática. Los logs se mantienen indefinidamente. En el futuro se puede implementar:
- Archivado automático de logs antiguos
- Eliminación de logs después de X días
- Compresión de logs históricos

### 3. Rendimiento

Para consultas de gran volumen:
- Usar paginación apropiada
- Aplicar filtros específicos
- Considerar índices en la base de datos

### 4. Privacidad

Los logs pueden contener información sensible. Asegúrate de:
- Implementar autenticación y autorización
- Sanitizar datos sensibles antes de guardar
- Cumplir con regulaciones de privacidad (GDPR, etc.)

## Mejoras Futuras

- [ ] Exportación de logs a CSV/Excel
- [ ] Alertas basadas en patrones de auditoría
- [ ] Integración con sistemas SIEM externos
- [ ] Firma digital de logs para no repudio
- [ ] Búsqueda full-text en logs
- [ ] Visualización de timeline de cambios
- [ ] Comparación visual de oldValues vs newValues
- [ ] Filtros avanzados con operadores lógicos
- [ ] Webhooks para eventos de auditoría
- [ ] Retención automática de logs

## Seguridad

### Autenticación (Futuro)

Todos los endpoints de auditoría deberían requerir autenticación:

```typescript
// Ejemplo de protección con middleware
router.get('/logs', authenticate, authorize(['admin', 'auditor']), controller.getAllAuditLogs);
```

### Permisos Recomendados

- **Admin**: Acceso completo a todos los logs
- **Auditor**: Solo lectura de logs
- **Manager**: Solo logs de su departamento
- **User**: Solo sus propios logs

## Integración con Frontend

### Ejemplo de Componente React

```typescript
// Componente para mostrar historial de cambios
const AuditHistory = ({ entityType, entityId }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch(`/api/v1/audit/logs/entity/${entityType}/${entityId}`)
      .then(res => res.json())
      .then(data => setLogs(data.data));
  }, [entityType, entityId]);

  return (
    <div>
      <h3>Historial de Cambios</h3>
      {logs.map(log => (
        <div key={log.id}>
          <span>{log.action}</span>
          <span>{log.description}</span>
          <span>{new Date(log.createdAt).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};
```

## Troubleshooting

### Problema: Logs no se están creando

**Solución:**
1. Verificar que el módulo de auditoría esté importado correctamente
2. Verificar que las llamadas a `auditCreate()`, `auditUpdate()`, etc. estén usando `.catch()`
3. Revisar logs de error en Winston para ver si hay problemas de conexión a BD

### Problema: Consultas lentas

**Solución:**
1. Agregar índices en la tabla `audit_logs`:
   ```sql
   CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
   CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
   CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
   ```
2. Usar filtros más específicos
3. Reducir el tamaño de página

### Problema: Demasiados logs

**Solución:**
1. Implementar política de retención
2. Archivar logs antiguos
3. Usar `createAuditSummary()` para reducir tamaño de logs
