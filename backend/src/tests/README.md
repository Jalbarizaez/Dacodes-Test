# Tests del Backend - DaCodes Inventory

Sistema completo de pruebas para el backend del sistema de inventario.

## Estructura de Tests

```
src/tests/
├── setup.ts                          # Configuración global de tests
├── helpers.ts                        # Funciones auxiliares para crear datos de prueba
├── README.md                         # Esta documentación
└── integration/
    └── inventory-flow.test.ts        # Tests de integración del flujo completo

src/modules/
├── products/
│   └── product.service.test.ts       # Tests unitarios de productos
├── movements/
│   └── movement.service.test.ts      # Tests unitarios de movimientos
├── receptions/
│   └── reception.service.test.ts     # Tests unitarios de recepciones
├── transfers/
│   └── transfer.service.test.ts      # Tests unitarios de transferencias
└── reorder/
    └── reorder.service.test.ts       # Tests unitarios de reglas de reorden
```

## Módulos Cubiertos

### 1. Products (Productos)
- ✅ Creación de productos
- ✅ Validación de SKU único
- ✅ Validación de código de barras único
- ✅ Actualización de productos
- ✅ Desactivación de productos
- ✅ Validación de stock antes de desactivar
- ✅ Filtros y paginación

### 2. Stock Movements (Movimientos de Stock)
- ✅ Creación de movimientos (RECEIPT, SHIPMENT, ADJUSTMENT)
- ✅ Actualización automática de stock
- ✅ Cambios de estado (AVAILABLE, RESERVED, DAMAGED)
- ✅ Validación de stock insuficiente
- ✅ Historial de movimientos
- ✅ Resumen de movimientos
- ✅ Running balance (saldo corriente)

### 3. Receptions (Recepciones de Órdenes de Compra)
- ✅ Recepción completa de órdenes
- ✅ Recepción parcial
- ✅ Múltiples recepciones parciales
- ✅ Actualización automática de estado de PO
- ✅ Creación automática de stock
- ✅ Creación de movimientos de stock
- ✅ Manejo de lotes y fechas de expiración
- ✅ Validaciones de estado de PO

### 4. Transfers (Transferencias entre Ubicaciones)
- ✅ Creación de transferencias
- ✅ Envío de transferencias (ship)
- ✅ Completado de transferencias (complete)
- ✅ Cancelación de transferencias
- ✅ Validación de stock suficiente
- ✅ Actualización automática de stock en origen y destino
- ✅ Creación de movimientos TRANSFER_OUT y TRANSFER_IN
- ✅ Consistencia de inventario total
- ✅ Recepción parcial

### 5. Reorder Rules (Reglas de Reorden)
- ✅ Creación de reglas
- ✅ Actualización de reglas
- ✅ Evaluación de reglas
- ✅ Generación de sugerencias
- ✅ Cálculo de urgencia (CRITICAL, HIGH, MEDIUM, LOW)
- ✅ Creación de alertas
- ✅ Resolución de alertas
- ✅ Filtros por producto, ubicación y urgencia

### 6. Integration Tests (Tests de Integración)
- ✅ Flujo completo de inventario
- ✅ Recepción → Reserva → Envío → Transferencia
- ✅ Recepciones parciales múltiples
- ✅ Cambios de estado de stock
- ✅ Consistencia de inventario total
- ✅ Historial de movimientos

## Comandos

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests con cobertura
```bash
npm run test:coverage
```

### Ejecutar tests en modo watch
```bash
npm test -- --watch
```

### Ejecutar tests de un módulo específico
```bash
npm test -- products
npm test -- movements
npm test -- receptions
npm test -- transfers
npm test -- reorder
```

### Ejecutar solo tests de integración
```bash
npm test -- integration
```

### Ejecutar tests con UI
```bash
npm test -- --ui
```

## Configuración

### vitest.config.ts
```typescript
{
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  }
}
```

### Setup (setup.ts)
- Conexión a base de datos antes de todos los tests
- Limpieza de base de datos antes de cada test
- Desconexión después de todos los tests

## Helpers (helpers.ts)

Funciones auxiliares para crear datos de prueba:

```typescript
// Crear usuario de prueba
const user = await createTestUser();

// Crear categoría
const category = await createTestCategory('Electronics');

// Crear producto
const product = await createTestProduct(categoryId, 'PROD-001');

// Crear almacén
const warehouse = await createTestWarehouse('Main Warehouse');

// Crear ubicación
const location = await createTestLocation(warehouseId, 'A-01');

// Crear proveedor
const supplier = await createTestSupplier('Acme Corp');

// Crear orden de compra
const po = await createTestPurchaseOrder(supplierId, productId);

// Crear nivel de stock
const stock = await createTestStockLevel(productId, locationId, 100);

// Crear regla de reorden
const rule = await createTestReorderRule(productId, locationId);

// Obtener nivel de stock
const stock = await getStockLevel(productId, locationId);
```

## Casos de Prueba

### Casos Felices (Happy Path)
- ✅ Creación exitosa de entidades
- ✅ Actualización exitosa
- ✅ Flujos completos de negocio
- ✅ Operaciones transaccionales

### Casos de Error
- ✅ Validación de datos duplicados
- ✅ Validación de datos inválidos
- ✅ Validación de stock insuficiente
- ✅ Validación de estados inválidos
- ✅ Validación de entidades no existentes
- ✅ Validación de reglas de negocio

### Casos de Consistencia
- ✅ Consistencia de inventario total
- ✅ Consistencia de estados de stock
- ✅ Consistencia de movimientos
- ✅ Consistencia transaccional

## Cobertura de Código

Objetivo: >80% de cobertura en módulos críticos

```bash
npm run test:coverage
```

Genera reporte en:
- `coverage/index.html` - Reporte HTML interactivo
- `coverage/coverage-final.json` - Datos de cobertura en JSON

## Mejores Prácticas

### 1. Aislamiento de Tests
Cada test es independiente y no depende de otros tests.

```typescript
beforeEach(async () => {
  // Limpieza automática de base de datos
  // Creación de datos de prueba frescos
});
```

### 2. Nombres Descriptivos
```typescript
it('should create reception and update stock', async () => {
  // Test implementation
});
```

### 3. Arrange-Act-Assert
```typescript
it('should handle partial reception', async () => {
  // Arrange: Setup test data
  const po = await createTestPurchaseOrder(...);
  
  // Act: Execute the operation
  const reception = await service.createReception(...);
  
  // Assert: Verify results
  expect(reception).toBeDefined();
  expect(stockLevel?.quantityTotal).toBe(50);
});
```

### 4. Tests de Errores
```typescript
it('should throw error for insufficient stock', async () => {
  await expect(
    service.createMovement(...)
  ).rejects.toThrow('Insufficient stock');
});
```

### 5. Verificación de Efectos Secundarios
```typescript
it('should create stock movement for reception', async () => {
  await service.createReception(...);
  
  // Verify side effects
  const movements = await prisma.stockMovement.findMany(...);
  expect(movements).toHaveLength(1);
});
```

## Debugging

### Ver output de tests
```bash
npm test -- --reporter=verbose
```

### Ejecutar un solo test
```typescript
it.only('should create product successfully', async () => {
  // This test will run alone
});
```

### Saltar un test
```typescript
it.skip('should handle complex scenario', async () => {
  // This test will be skipped
});
```

### Ver logs durante tests
```typescript
it('should do something', async () => {
  console.log('Debug info:', someVariable);
  // Test implementation
});
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run prisma:generate
      - run: npm run prisma:migrate
      - run: npm test
      - run: npm run test:coverage
```

## Troubleshooting

### Tests fallan por timeout
Aumentar timeout en `vitest.config.ts`:
```typescript
{
  test: {
    testTimeout: 60000, // 60 segundos
  }
}
```

### Base de datos no se limpia
Verificar que `setup.ts` esté configurado correctamente y que las tablas se eliminen en orden correcto (respetando foreign keys).

### Tests pasan localmente pero fallan en CI
- Verificar variables de entorno
- Verificar versión de Node.js
- Verificar versión de PostgreSQL
- Verificar que las migraciones se ejecuten antes de los tests

## Próximas Mejoras

- [ ] Tests E2E con Supertest
- [ ] Tests de performance
- [ ] Tests de carga
- [ ] Mocks para servicios externos
- [ ] Tests de seguridad
- [ ] Tests de concurrencia
- [ ] Property-based testing
- [ ] Mutation testing

## Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
