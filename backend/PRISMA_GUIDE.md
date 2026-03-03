# Guía de Prisma ORM - DaCodes Inventory

## ¿Por qué Prisma?

Prisma fue seleccionado como ORM para este proyecto por las siguientes razones:

### Ventajas sobre TypeORM y Sequelize:

1. **Type Safety Superior** ⭐⭐⭐⭐⭐
   - Genera tipos TypeScript automáticamente desde el schema
   - Autocompletado inteligente en el IDE
   - Errores de tipo en tiempo de compilación

2. **Developer Experience** ⭐⭐⭐⭐⭐
   - Prisma Studio para exploración visual de datos
   - Migraciones declarativas fáciles de entender
   - Schema legible y mantenible

3. **Performance** ⭐⭐⭐⭐⭐
   - Query engine optimizado en Rust
   - Connection pooling inteligente
   - Queries optimizadas automáticamente

4. **Migraciones Robustas**
   - Sistema de migraciones con preview
   - Rollback seguro
   - Detección de cambios automática

## Estructura del Schema

### Convenciones de Nombres

**En el Schema (Prisma):**
- Modelos: PascalCase (ej: `PurchaseOrder`)
- Campos: camelCase (ej: `orderDate`)
- Enums: PascalCase (ej: `UserRole`)

**En la Base de Datos (PostgreSQL):**
- Tablas: snake_case plural (ej: `purchase_orders`)
- Columnas: snake_case (ej: `order_date`)
- Mapeo automático con `@map()` y `@@map()`

### Ejemplo de Modelo

```prisma
model PurchaseOrder {
  id                   String              @id @default(uuid())
  orderNumber          String              @unique @map("order_number")
  supplierId           String              @map("supplier_id")
  orderDate            DateTime            @map("order_date")
  status               PurchaseOrderStatus @default(DRAFT)
  createdAt            DateTime            @default(now()) @map("created_at")
  
  // Relations
  supplier   Supplier                @relation(fields: [supplierId], references: [id])
  lineItems  PurchaseOrderLineItem[]
  
  @@index([orderNumber])
  @@map("purchase_orders")
}
```

## Uso del Prisma Client

### Importar el Cliente

```typescript
import { prisma } from '../config/database.js';
```

### Operaciones CRUD Básicas

#### Create
```typescript
const product = await prisma.product.create({
  data: {
    sku: 'PROD-001',
    name: 'Sample Product',
    category: 'Electronics',
    unitOfMeasure: 'UNIT',
    isActive: true,
  },
});
```

#### Read (Find One)
```typescript
const product = await prisma.product.findUnique({
  where: { sku: 'PROD-001' },
});
```

#### Read (Find Many)
```typescript
const products = await prisma.product.findMany({
  where: {
    category: 'Electronics',
    isActive: true,
  },
  orderBy: { name: 'asc' },
  take: 10,
  skip: 0,
});
```

#### Update
```typescript
const product = await prisma.product.update({
  where: { id: productId },
  data: { name: 'Updated Name' },
});
```

#### Delete (Soft Delete recomendado)
```typescript
const product = await prisma.product.update({
  where: { id: productId },
  data: { isActive: false },
});
```

### Relaciones

#### Include (Eager Loading)
```typescript
const order = await prisma.purchaseOrder.findUnique({
  where: { id: orderId },
  include: {
    supplier: true,
    lineItems: {
      include: {
        product: true,
      },
    },
  },
});
```

#### Select (Field Selection)
```typescript
const products = await prisma.product.findMany({
  select: {
    id: true,
    sku: true,
    name: true,
  },
});
```

### Transacciones

#### Transaction Simple
```typescript
const result = await prisma.$transaction([
  prisma.stockLevel.update({
    where: { id: stockId },
    data: { quantity: { increment: 10 } },
  }),
  prisma.movement.create({
    data: {
      type: 'RECEIPT',
      productId,
      locationId,
      quantity: 10,
      userId,
      runningBalance: newBalance,
    },
  }),
]);
```

#### Transaction Interactiva
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Verificar stock
  const stock = await tx.stockLevel.findUnique({
    where: { id: stockId },
  });

  if (stock.quantity < requestedQty) {
    throw new Error('Insufficient stock');
  }

  // Decrementar stock
  await tx.stockLevel.update({
    where: { id: stockId },
    data: { quantity: { decrement: requestedQty } },
  });

  // Crear movimiento
  await tx.movement.create({
    data: {
      type: 'SHIPMENT',
      productId,
      locationId,
      quantity: -requestedQty,
      userId,
      runningBalance: stock.quantity - requestedQty,
    },
  });

  return { success: true };
});
```

### Agregaciones

```typescript
// Count
const totalProducts = await prisma.product.count({
  where: { isActive: true },
});

// Aggregate
const stockStats = await prisma.stockLevel.aggregate({
  _sum: { quantity: true },
  _avg: { quantity: true },
  _max: { quantity: true },
  where: { productId },
});

// Group By
const stockByLocation = await prisma.stockLevel.groupBy({
  by: ['locationId'],
  _sum: { quantity: true },
  where: { productId },
});
```

### Queries Raw

```typescript
// Raw query
const result = await prisma.$queryRaw`
  SELECT * FROM products WHERE sku LIKE ${searchTerm}
`;

// Execute raw (para INSERT, UPDATE, DELETE)
await prisma.$executeRaw`
  UPDATE stock_levels SET quantity = quantity + 1 WHERE id = ${id}
`;
```

## Patrones de Uso Recomendados

### Repository Pattern

```typescript
// product.repository.ts
export class ProductRepository {
  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { sku },
    });
  }

  async findAll(filters: ProductFilters): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        category: filters.category,
        isActive: filters.isActive,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreateProductDTO): Promise<Product> {
    return prisma.product.create({
      data,
    });
  }

  async update(id: string, data: UpdateProductDTO): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data,
    });
  }
}
```

### Service Layer con Transacciones

```typescript
// reception.service.ts
export class ReceptionService {
  async receiveOrder(
    orderId: string,
    items: ReceptionItemDTO[]
  ): Promise<Reception> {
    return prisma.$transaction(async (tx) => {
      // Crear recepción
      const reception = await tx.reception.create({
        data: {
          purchaseOrderId: orderId,
          receivedDate: new Date(),
          receivedBy: userId,
        },
      });

      // Procesar cada item
      for (const item of items) {
        // Crear reception item
        await tx.receptionItem.create({
          data: {
            receptionId: reception.id,
            lineItemId: item.lineItemId,
            receivedQuantity: item.quantity,
            locationId: item.locationId,
          },
        });

        // Actualizar stock
        await tx.stockLevel.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: item.locationId,
            },
          },
          update: {
            quantity: { increment: item.quantity },
          },
          create: {
            productId: item.productId,
            locationId: item.locationId,
            quantity: item.quantity,
          },
        });

        // Crear movimiento
        await tx.movement.create({
          data: {
            type: 'RECEIPT',
            productId: item.productId,
            locationId: item.locationId,
            quantity: item.quantity,
            userId,
            referenceNumber: reception.id,
            runningBalance: newBalance,
          },
        });
      }

      return reception;
    });
  }
}
```

## Migraciones

### Crear una Nueva Migración

```bash
# Después de modificar schema.prisma
npm run prisma:migrate
```

### Aplicar Migraciones en Producción

```bash
npm run prisma:migrate:prod
```

### Resetear Base de Datos (Desarrollo)

```bash
npm run db:reset
```

## Prisma Studio

Interfaz visual para explorar y editar datos:

```bash
npm run prisma:studio
```

Abre en: http://localhost:5555

## Best Practices

### 1. Usar Transacciones para Operaciones Múltiples
```typescript
// ✅ Correcto
await prisma.$transaction([...]);

// ❌ Incorrecto (sin transacción)
await prisma.model1.create(...);
await prisma.model2.create(...);
```

### 2. Validar Antes de Operaciones de DB
```typescript
// ✅ Correcto
const validated = productSchema.parse(data);
await prisma.product.create({ data: validated });

// ❌ Incorrecto (sin validación)
await prisma.product.create({ data });
```

### 3. Usar Select para Optimizar Queries
```typescript
// ✅ Correcto (solo campos necesarios)
const products = await prisma.product.findMany({
  select: { id: true, name: true, sku: true },
});

// ❌ Incorrecto (trae todos los campos)
const products = await prisma.product.findMany();
```

### 4. Manejar Errores de Prisma
```typescript
import { Prisma } from '@prisma/client';

try {
  await prisma.product.create({ data });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new AppError('DUPLICATE_SKU', 'SKU already exists');
    }
  }
  throw error;
}
```

### Códigos de Error Comunes de Prisma:
- `P2002`: Unique constraint violation
- `P2003`: Foreign key constraint violation
- `P2025`: Record not found
- `P2034`: Transaction failed

## Recursos

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
