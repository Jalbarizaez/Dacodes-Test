# Setup Guide - DaCodes Inventory Backend

Esta guía te ayudará a configurar el backend con PostgreSQL y Prisma ORM.

## Requisitos Previos

- Node.js 20+ instalado
- Docker y Docker Compose instalados (para PostgreSQL)
- npm o yarn

## Paso 1: Instalar Dependencias

```bash
cd backend
npm install
```

## Paso 2: Iniciar PostgreSQL con Docker

Inicia la base de datos PostgreSQL usando Docker Compose:

```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en el puerto `5432`
- pgAdmin en el puerto `5050` (opcional, para gestión visual)

### Credenciales de PostgreSQL:
- **Host**: localhost
- **Port**: 5432
- **Database**: dacodes_inventory
- **User**: dacodes
- **Password**: dacodes123

### Acceso a pgAdmin (opcional):
- **URL**: http://localhost:5050
- **Email**: admin@dacodes.com
- **Password**: admin123

## Paso 3: Configurar Variables de Entorno

El archivo `.env` ya está creado con las credenciales correctas. Si necesitas modificarlo:

```bash
# Ya existe, pero puedes editarlo si es necesario
nano .env
```

## Paso 4: Generar Prisma Client

Genera el cliente de Prisma basado en el schema:

```bash
npm run prisma:generate
```

## Paso 5: Ejecutar Migraciones

Crea las tablas en la base de datos:

```bash
npm run prisma:migrate
```

Cuando te pregunte por el nombre de la migración, puedes usar: `init`

## Paso 6: Seed de Datos Iniciales (Opcional)

Pobla la base de datos con datos de prueba:

```bash
npm run prisma:seed
```

Esto creará:
- 3 usuarios (admin, manager, operator)
- 1 almacén con 3 ubicaciones
- 1 proveedor
- 2 productos de ejemplo

### Credenciales de prueba:
- **Admin**: admin@dacodes.com / admin123
- **Manager**: manager@dacodes.com / manager123
- **Operator**: operator@dacodes.com / operator123

## Paso 7: Iniciar el Servidor

```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

## Verificar la Instalación

### Health Check:
```bash
curl http://localhost:3000/api/health
```

### Readiness Check (incluye DB):
```bash
curl http://localhost:3000/api/health/ready
```

Deberías ver `"database": "connected"` en la respuesta.

## Comandos Útiles de Prisma

### Ver la base de datos con Prisma Studio:
```bash
npm run prisma:studio
```
Abre una interfaz visual en: http://localhost:5555

### Crear una nueva migración:
```bash
npm run prisma:migrate
```

### Aplicar migraciones en producción:
```bash
npm run prisma:migrate:prod
```

### Sincronizar schema sin crear migración (desarrollo):
```bash
npm run db:push
```

### Resetear la base de datos (⚠️ elimina todos los datos):
```bash
npm run db:reset
```

### Regenerar Prisma Client después de cambios en schema:
```bash
npm run prisma:generate
```

## Estructura de la Base de Datos

El schema incluye las siguientes entidades:

### Core:
- **User** - Usuarios del sistema (Admin, Manager, Operator)
- **Product** - Catálogo de productos
- **Warehouse** - Almacenes
- **Location** - Ubicaciones dentro de almacenes
- **StockLevel** - Niveles de stock por producto/ubicación

### Procurement:
- **Supplier** - Proveedores
- **PurchaseOrder** - Órdenes de compra
- **PurchaseOrderLineItem** - Líneas de orden
- **Reception** - Recepciones de mercancía
- **ReceptionItem** - Items recibidos

### Operations:
- **Movement** - Movimientos de stock (audit trail)
- **Transfer** - Transferencias entre almacenes
- **Batch** - Lotes de productos
- **BatchStock** - Stock por lote

### Automation:
- **ReorderRule** - Reglas de reorden automático
- **ReorderAlert** - Alertas de reorden

## Troubleshooting

### Error: "Can't reach database server"
- Verifica que Docker esté corriendo: `docker ps`
- Verifica que PostgreSQL esté activo: `docker-compose ps`
- Reinicia los contenedores: `docker-compose restart`

### Error: "Environment variable not found: DATABASE_URL"
- Verifica que el archivo `.env` existe
- Verifica que `DATABASE_URL` está definido correctamente

### Error en migraciones:
- Resetea la base de datos: `npm run db:reset`
- Vuelve a ejecutar las migraciones: `npm run prisma:migrate`

### Puerto 5432 ya en uso:
- Detén otros servicios PostgreSQL
- O cambia el puerto en `docker-compose.yml` y `.env`

## Detener los Servicios

### Detener PostgreSQL:
```bash
docker-compose down
```

### Detener y eliminar volúmenes (⚠️ elimina datos):
```bash
docker-compose down -v
```

## Próximos Pasos

Ahora que la base de datos está configurada, puedes:

1. Implementar los módulos de dominio (productos, stock, etc.)
2. Crear los repositories, services y controllers
3. Implementar autenticación con JWT
4. Agregar WebSockets para tiempo real
5. Escribir tests

Ver `README.md` para más información sobre la arquitectura del proyecto.
