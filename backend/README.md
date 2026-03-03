# DaCodes Inventory System - Backend

API REST completa para gestión de inventario con soporte para múltiples almacenes, tiempo real y auditoría completa.

## 🛠 Stack Tecnológico

- **Runtime**: Node.js 20.x
- **Lenguaje**: TypeScript 5.x
- **Framework**: Express 4.x
- **ORM**: Prisma 5.x
- **Base de Datos**: PostgreSQL 16.x
- **Validación**: Zod 3.x
- **Logging**: Winston 3.x
- **Testing**: Vitest 1.x
- **WebSocket**: Socket.IO 4.x

## 📋 Prerrequisitos

- Node.js 20.x o superior
- PostgreSQL 16.x
- npm o yarn

## 🚀 Instalación

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copiar el archivo de ejemplo y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/inventory_db?schema=public"

# Frontend (para CORS y WebSocket)
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug

# Features
ALLOW_NEGATIVE_STOCK=false
```

### 3. Iniciar Base de Datos

#### Opción A: Docker (Recomendado)

```bash
docker-compose up -d
```

#### Opción B: PostgreSQL Local

Crear base de datos manualmente:

```sql
CREATE DATABASE inventory_db;
```

### 4. Ejecutar Migraciones

```bash
npx prisma migrate dev
```

### 5. Seed de Datos (Opcional)

```bash
npx prisma db seed
```

Esto creará:
- 2 Almacenes con ubicaciones
- 10 Productos de ejemplo
- 5 Proveedores
- 1 Usuario de prueba
- Stock inicial

### 6. Iniciar Servidor

#### Desarrollo

```bash
npm run dev
```

#### Producción

```bash
npm run build
npm start
```

## 📡 Endpoints Principales

### Base URL

```
http://localhost:3000/api/v1
```

### Health Check

```bash
GET /api/health
```

### Módulos Disponibles

| Módulo | Base Path | Descripción |
|--------|-----------|-------------|
| Products | `/products` | Gestión de productos |
| Warehouses | `/warehouses` | Almacenes y ubicaciones |
| Stock | `/stock` | Consulta de inventario |
| Movements | `/movements` | Movimientos de stock |
| Purchase Orders | `/purchase-orders` | Órdenes de compra |
| Receptions | `/receptions` | Recepciones |
| Transfers | `/transfers` | Transferencias |
| Suppliers | `/suppliers` | Proveedores |
| Reorder | `/reorder` | Reglas y alertas |
| Audit | `/audit` | Logs de auditoría |

### Ejemplos de Uso

#### Listar Productos

```bash
curl http://localhost:3000/api/v1/products
```

#### Crear Producto

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "Laptop Dell XPS 15",
    "categoryId": "cat-123",
    "unitOfMeasure": "UNIT",
    "minStock": 10,
    "maxStock": 100
  }'
```

#### Consultar Stock

```bash
curl "http://localhost:3000/api/v1/stock?warehouseId=wh-123"
```

#### Crear Movimiento

```bash
curl -X POST http://localhost:3000/api/v1/movements \
  -H "Content-Type: application/json" \
  -d '{
    "type": "RECEIPT",
    "productId": "prod-123",
    "locationId": "loc-456",
    "quantity": 50,
    "toStatus": "AVAILABLE",
    "userId": "user-789",
    "reason": "Initial stock"
  }'
```

Ver documentación completa de cada módulo en sus respectivos README.

## 🏗 Arquitectura

### Estructura de Carpetas

```
backend/
├── src/
│   ├── config/              # Configuración
│   │   ├── database.ts      # Prisma client
│   │   ├── env.ts           # Variables de entorno
│   │   └── logger.ts        # Winston logger
│   │
│   ├── modules/             # Módulos de negocio
│   │   └── [module]/
│   │       ├── [module].controller.ts    # Controlador
│   │       ├── [module].service.ts       # Lógica de negocio
│   │       ├── [module].repository.ts    # Acceso a datos
│   │       ├── [module].routes.ts        # Rutas
│   │       ├── [module].types.ts         # Tipos
│   │       ├── [module].validator.ts     # Validaciones Zod
│   │       ├── [module].test.ts          # Tests
│   │       └── README.md                 # Documentación
│   │
│   ├── shared/              # Código compartido
│   │   ├── events/          # Sistema de eventos
│   │   ├── middleware/      # Middleware Express
│   │   ├── types/           # Tipos globales
│   │   └── utils/           # Utilidades
│   │
│   ├── routes/              # Rutas principales
│   ├── tests/               # Tests
│   ├── app.ts               # Configuración Express
│   └── server.ts            # Entry point
│
├── prisma/
│   ├── schema.prisma        # Schema de base de datos
│   ├── seed.ts              # Seed de datos
│   └── migrations/          # Migraciones
│
├── logs/                    # Logs de aplicación
├── dist/                    # Build de producción
└── package.json
```

### Patrones de Diseño

#### 1. Repository Pattern

Separación de lógica de acceso a datos:

```typescript
// Repository - Acceso a datos
class ProductRepository {
  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } });
  }
}

// Service - Lógica de negocio
class ProductService {
  constructor(private repository: ProductRepository) {}
  
  async getProduct(id: string): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) throw new AppError('NOT_FOUND', 'Product not found');
    return product;
  }
}

// Controller - Manejo de HTTP
class ProductController {
  constructor(private service: ProductService) {}
  
  async getById(req: Request, res: Response) {
    const product = await this.service.getProduct(req.params.id);
    res.json({ success: true, data: product });
  }
}
```

#### 2. DTO Pattern

Validación con Zod:

```typescript
const createProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  categoryId: z.string().uuid(),
  unitOfMeasure: z.enum(['UNIT', 'KG', 'LITER']),
  minStock: z.number().int().min(0).optional(),
});

type CreateProductDTO = z.infer<typeof createProductSchema>;
```

#### 3. Service Layer

Lógica de negocio centralizada:

```typescript
class MovementService {
  async createMovement(data: CreateMovementDTO) {
    // 1. Validar
    await this.validateMovement(data);
    
    // 2. Crear en transacción
    const movement = await this.repository.createWithStockUpdate(data);
    
    // 3. Emitir eventos
    this.emitEvents(movement);
    
    // 4. Auditoría
    await this.audit(movement);
    
    return movement;
  }
}
```

## 🔌 Sistema de Eventos en Tiempo Real

El backend emite eventos WebSocket cuando ocurren cambios importantes:

```typescript
import { emitStockUpdated } from './shared/events/emit-helper.js';

// Emitir evento
emitStockUpdated({
  productId: stock.productId,
  productSku: product.sku,
  productName: product.name,
  quantityAvailable: stock.quantityAvailable,
  change: quantity,
});
```

**Eventos disponibles:**
- `stock:updated` - Stock actualizado
- `stock:low` - Alerta de stock bajo
- `purchase-order:received` - Orden recibida
- `reception:created` - Recepción registrada
- `movement:created` - Movimiento creado
- `transfer:completed` - Transferencia completada

Ver [EVENTS_README.md](./src/shared/events/EVENTS_README.md) para más detalles.

## 📊 Base de Datos

### Schema Principal

```
Products ──┐
           ├─→ StockLevels ←── Locations ←── Warehouses
           │
           └─→ Movements ←── Users
           
PurchaseOrders ──→ PurchaseOrderLineItems ──→ Products
           │
           └─→ Receptions ──→ ReceptionItems
           
Transfers ──→ TransferItems ──→ Products
```

### Migraciones

```bash
# Crear nueva migración
npx prisma migrate dev --name add_new_field

# Aplicar migraciones
npx prisma migrate deploy

# Reset database (desarrollo)
npx prisma migrate reset
```

### Prisma Studio

Interfaz visual para la base de datos:

```bash
npx prisma studio
```

Abre en: http://localhost:5555

Ver [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) y [PRISMA_GUIDE.md](./PRISMA_GUIDE.md) para más detalles.

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Con coverage
npm run test:coverage

# Modo watch
npm run test:watch

# Test específico
npm test -- movement.service.test.ts
```

### Estructura de Tests

```typescript
describe('MovementService', () => {
  let service: MovementService;
  
  beforeEach(async () => {
    // Setup
    await cleanDatabase();
    service = new MovementService();
  });
  
  it('should create movement and update stock', async () => {
    // Arrange
    const data = { /* ... */ };
    
    // Act
    const movement = await service.createMovement(data);
    
    // Assert
    expect(movement.id).toBeDefined();
    expect(movement.quantity).toBe(50);
  });
});
```

Ver [tests/README.md](./src/tests/README.md) para guía completa.

## 📝 Logging

### Niveles de Log

- `error` - Errores críticos
- `warn` - Advertencias
- `info` - Información general
- `http` - Requests HTTP
- `debug` - Debugging detallado

### Archivos de Log

```
logs/
├── combined.log      # Todos los logs
├── error.log         # Solo errores
├── exceptions.log    # Excepciones no capturadas
└── rejections.log    # Promesas rechazadas
```

### Uso

```typescript
import { logger } from './config/logger.js';

logger.info('User created', { userId: user.id });
logger.error('Failed to create user', { error: err.message });
logger.debug('Processing request', { data });
```

## 🔐 Seguridad

### Validación de Datos

Todos los endpoints validan datos con Zod:

```typescript
router.post(
  '/',
  validate(createProductSchema, 'body'),
  asyncHandler(controller.create)
);
```

### Sanitización

- Inputs sanitizados automáticamente
- SQL injection prevenido por Prisma
- XSS prevenido en responses

### Soft Deletes

Datos críticos usan soft delete:

```typescript
await prisma.product.update({
  where: { id },
  data: { isActive: false }
});
```

### Auditoría

Todas las operaciones se registran:

```typescript
await createAuditLog({
  entityType: 'PRODUCT',
  entityId: product.id,
  action: 'CREATE',
  userId: user.id,
  changes: { before: null, after: product }
});
```

Ver [AUDIT_README.md](./src/shared/utils/AUDIT_README.md) para más detalles.

## 🚀 Deployment

### Build de Producción

```bash
npm run build
```

Genera archivos en `dist/`

### Variables de Entorno Producción

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://..."
LOG_LEVEL=info
ALLOW_NEGATIVE_STOCK=false
```

### Iniciar en Producción

```bash
npm start
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Monitoreo

### Health Check

```bash
curl http://localhost:3000/api/health
```

Respuesta:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-27T10:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "websocket": "active"
}
```

### Métricas

- Requests por segundo
- Tiempo de respuesta promedio
- Errores por minuto
- Conexiones WebSocket activas

## 🐛 Troubleshooting

### Error: Cannot connect to database

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Verificar conexión
npx prisma db pull
```

### Error: Port already in use

```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso
lsof -ti:3000 | xargs kill -9
```

### Error: Migration failed

```bash
# Reset database (desarrollo)
npx prisma migrate reset

# O aplicar manualmente
npx prisma migrate deploy
```

### Logs no se generan

```bash
# Verificar permisos
chmod 755 logs/

# Verificar LOG_LEVEL en .env
LOG_LEVEL=debug
```

## 📚 Documentación Adicional

- [Database Design](./DATABASE_DESIGN.md) - Diseño de base de datos
- [Prisma Guide](./PRISMA_GUIDE.md) - Guía de Prisma
- [Events System](./src/shared/events/EVENTS_README.md) - Sistema de eventos
- [Audit System](./src/shared/utils/AUDIT_README.md) - Sistema de auditoría
- [Testing Guide](./src/tests/README.md) - Guía de testing

### Documentación por Módulo

Cada módulo tiene su README con:
- Descripción
- Endpoints
- Ejemplos cURL
- Validaciones
- Casos de uso

```
src/modules/
├── products/README.md
├── stock/README.md
├── movements/README.md
├── purchase-orders/README.md
├── receptions/README.md
├── transfers/README.md
├── suppliers/README.md
├── warehouses/README.md
├── reorder/README.md
└── audit/README.md
```

## 🤝 Contribuir

1. Seguir estructura de módulos existente
2. Agregar tests para nuevas funcionalidades
3. Documentar endpoints en README del módulo
4. Usar TypeScript strict mode
5. Validar con Zod
6. Agregar logs apropiados
7. Emitir eventos cuando corresponda

## 📞 Soporte

Para preguntas técnicas:
- Revisar documentación de módulos
- Consultar ejemplos en tests
- Revisar logs en `logs/`
- Contactar al equipo de desarrollo

---

**Backend desarrollado con Node.js + TypeScript + Prisma**
