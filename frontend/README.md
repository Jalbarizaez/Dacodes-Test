# DaCodes Inventory System - Frontend

Aplicación web moderna para gestión de inventario con actualizaciones en tiempo real y UX optimizada.

## 🛠 Stack Tecnológico

- **Framework**: React 18.x
- **Lenguaje**: TypeScript 5.x
- **Build Tool**: Vite 7.x
- **Routing**: React Router 6.x
- **HTTP Client**: Axios 1.x
- **WebSocket**: Socket.IO Client 4.x
- **Styling**: CSS Modules + Custom CSS

## 📋 Prerrequisitos

- Node.js 20.x o superior
- npm o yarn
- Backend corriendo en http://localhost:3000

## 🚀 Instalación

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copiar el archivo de ejemplo:

```bash
cp .env.example .env
```

Editar `.env`:

```env
# API Backend
VITE_API_URL=http://localhost:3000/api/v1

# WebSocket (opcional, se deriva de VITE_API_URL)
# VITE_WS_URL=http://localhost:3000
```

### 3. Iniciar Aplicación

#### Desarrollo

```bash
npm run dev
```

Abre en: http://localhost:5173

#### Build de Producción

```bash
npm run build
```

Genera archivos en `dist/`

#### Preview de Producción

```bash
npm run preview
```

## 📱 Pantallas Principales

### 1. Dashboard

**Ruta**: `/`

Pantalla principal con KPIs y métricas en tiempo real:
- Stock total, disponible, reservado, dañado
- Alertas de stock bajo
- Órdenes de compra pendientes
- Movimientos recientes
- Resumen por almacén

**Características:**
- Actualización automática en tiempo real
- Cards interactivos con navegación
- Gráficos y estadísticas
- Estado de carga y error

Ver [Dashboard.README.md](./src/pages/Dashboard.README.md)

### 2. Products (Productos)

**Ruta**: `/products`

Gestión completa de productos:
- Lista con búsqueda
- Crear/editar/eliminar productos
- Ver detalle de producto
- Filtros y ordenamiento

**Características:**
- Formulario con validación
- Modal para crear/editar
- Búsqueda en tiempo real
- Categorías dinámicas

Ver [Products.README.md](./src/pages/Products.README.md)

### 3. Inventory (Inventario)

**Ruta**: `/inventory`

Consulta administrativa de inventario:
- Stock por producto y ubicación
- Filtros avanzados (almacén, producto, con stock)
- Ver movimientos recientes
- Detalle de stock por ubicación

**Características:**
- Actualización en tiempo real
- Cards de resumen
- Tabla con colores por estado
- Modal de detalle con historial

Ver [Inventory.README.md](./src/pages/Inventory.README.md)

### 4. Purchase Orders (Órdenes de Compra)

**Ruta**: `/purchase-orders`

Gestión completa de órdenes de compra:
- Lista de órdenes con filtros
- Crear orden con múltiples productos
- Ver detalle con progreso
- Registrar recepción

**Características:**
- Formulario dinámico de line items
- Cálculo automático de totales
- Barras de progreso por producto
- Flujo completo de recepción

Ver [PurchaseOrders.README.md](./src/pages/PurchaseOrders.README.md)

### 5. Warehouses (Almacenes)

**Ruta**: `/warehouses`

Gestión de almacenes y ubicaciones (próximamente)

### 6. Suppliers (Proveedores)

**Ruta**: `/suppliers`

Gestión de proveedores (próximamente)

### 7. Transfers (Transferencias)

**Ruta**: `/transfers`

Transferencias entre almacenes (próximamente)

### 8. Reorder Alerts (Alertas)

**Ruta**: `/reorder-alerts`

Alertas de reorden y stock bajo (próximamente)

## 🏗 Arquitectura

### Estructura de Carpetas

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Loading.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── EmptyState.tsx
│   │   ├── StatCard.tsx
│   │   ├── StockCard.tsx
│   │   ├── ProductForm.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── InventoryDetail.tsx
│   │   ├── PurchaseOrderForm.tsx
│   │   ├── PurchaseOrderDetail.tsx
│   │   └── ReceptionForm.tsx
│   │
│   ├── pages/               # Páginas principales
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── Inventory.tsx
│   │   ├── PurchaseOrders.tsx
│   │   ├── Warehouses.tsx
│   │   ├── Suppliers.tsx
│   │   ├── Transfers.tsx
│   │   └── ReorderAlerts.tsx
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── useDashboard.ts
│   │   ├── useProducts.ts
│   │   ├── useStock.ts
│   │   ├── usePurchaseOrders.ts
│   │   ├── useWarehouses.ts
│   │   ├── useSuppliers.ts
│   │   ├── useLocations.ts
│   │   ├── useCategories.ts
│   │   └── useRealTimeEvents.ts
│   │
│   ├── services/            # Servicios
│   │   ├── api.ts           # Cliente HTTP
│   │   └── websocket.ts     # Cliente WebSocket
│   │
│   ├── layouts/             # Layouts
│   │   └── AdminLayout.tsx  # Layout principal
│   │
│   ├── types/               # TypeScript types
│   │   ├── index.ts
│   │   └── category.ts
│   │
│   ├── App.tsx              # Componente principal
│   ├── App.css              # Estilos globales
│   ├── main.tsx             # Entry point
│   └── index.css            # Reset CSS
│
├── public/                  # Assets estáticos
├── dist/                    # Build de producción
└── package.json
```

### Patrones de Diseño

#### 1. Custom Hooks

Lógica reutilizable encapsulada:

```typescript
// hooks/useProducts.ts
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, refetch: fetchProducts };
};
```

#### 2. Componentes Reutilizables

Componentes genéricos y configurables:

```typescript
// components/Table.tsx
interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
}

export const Table = <T,>({ columns, data, onRowClick }: TableProps<T>) => {
  // Implementación genérica
};
```

#### 3. Service Layer

Centralización de llamadas API:

```typescript
// services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

## 🔌 Tiempo Real

### WebSocket Connection

Conexión automática al cargar la aplicación:

```typescript
// services/websocket.ts
const websocketManager = new WebSocketManager();
websocketManager.connect();
```

### Hooks de Eventos

Suscripción a eventos en componentes:

```typescript
import { useStockUpdated, useStockLow } from '../hooks/useRealTimeEvents';

export const Dashboard = () => {
  const { refetch } = useDashboard();

  // Actualizar cuando cambie el stock
  useStockUpdated((event) => {
    console.log('Stock updated:', event.data);
    refetch();
  });

  // Mostrar alerta de stock bajo
  useStockLow((event) => {
    console.log('Low stock alert:', event.data);
    showNotification(event.data);
    refetch();
  });

  return <div>...</div>;
};
```

**Eventos disponibles:**
- `useStockUpdated()` - Stock actualizado
- `useStockLow()` - Alerta de stock bajo
- `usePurchaseOrderReceived()` - Orden recibida
- `useReceptionCreated()` - Recepción registrada
- `useMovementCreated()` - Movimiento creado
- `useTransferCompleted()` - Transferencia completada

Ver [WebSocket Service](./src/services/websocket.ts) para más detalles.

## 🎨 Estilos

### CSS Global

Estilos en `App.css`:
- Layout (sidebar, topbar, content)
- Componentes base (buttons, inputs, cards)
- Utilidades (badges, loading, errors)
- Responsive design

### Convenciones

```css
/* Componentes */
.component-name { }
.component-name-element { }
.component-name-modifier { }

/* Estados */
.is-active { }
.is-loading { }
.is-disabled { }

/* Variantes */
.btn-primary { }
.btn-secondary { }
.btn-danger { }
```

### Responsive

Breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🧪 Testing

### Lint

```bash
npm run lint
```

### Type Check

```bash
npm run type-check
```

### Build Test

```bash
npm run build
```

## 📦 Build y Deploy

### Build de Producción

```bash
npm run build
```

Genera:
- `dist/index.html` - HTML principal
- `dist/assets/` - JS y CSS optimizados

### Optimizaciones

- Code splitting automático
- Tree shaking
- Minificación
- Compresión gzip
- Cache busting

### Deploy

#### Opción 1: Servidor Estático

```bash
# Copiar dist/ a servidor
scp -r dist/* user@server:/var/www/inventory
```

#### Opción 2: Nginx

```nginx
server {
    listen 80;
    server_name inventory.example.com;
    root /var/www/inventory;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

#### Opción 3: Docker

```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔧 Configuración

### Vite Config

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

### TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  }
}
```

## 🐛 Troubleshooting

### Error: Cannot connect to API

```bash
# Verificar que backend esté corriendo
curl http://localhost:3000/api/health

# Verificar VITE_API_URL en .env
echo $VITE_API_URL
```

### Error: WebSocket connection failed

```bash
# Verificar CORS en backend
# Verificar que Socket.IO esté inicializado
# Revisar consola del navegador
```

### Error: Build fails

```bash
# Limpiar cache
rm -rf node_modules dist
npm install
npm run build
```

### Estilos no se aplican

```bash
# Verificar que App.css esté importado en App.tsx
# Limpiar cache del navegador
# Verificar orden de imports CSS
```

## 📚 Documentación Adicional

### Por Pantalla

- [Dashboard](./src/pages/Dashboard.README.md)
- [Products](./src/pages/Products.README.md)
- [Inventory](./src/pages/Inventory.README.md)
- [Purchase Orders](./src/pages/PurchaseOrders.README.md)

### Sistemas

- [WebSocket Service](./src/services/websocket.ts)
- [API Client](./src/services/api.ts)
- [Real-Time Hooks](./src/hooks/useRealTimeEvents.ts)

## 🎯 Mejores Prácticas

### 1. Componentes

- Un componente por archivo
- Props tipadas con TypeScript
- Usar hooks personalizados para lógica
- Componentes pequeños y reutilizables

### 2. Estado

- useState para estado local
- Custom hooks para estado compartido
- Evitar prop drilling
- Memoización cuando sea necesario

### 3. Performance

- Lazy loading de rutas
- Memoización de cálculos pesados
- Debounce en búsquedas
- Virtualización de listas largas

### 4. Accesibilidad

- Labels en inputs
- Alt text en imágenes
- Navegación por teclado
- Contraste de colores adecuado

## 🤝 Contribuir

1. Seguir estructura de componentes existente
2. Usar TypeScript strict mode
3. Documentar componentes complejos
4. Mantener estilos consistentes
5. Probar en diferentes navegadores
6. Optimizar para mobile

## 📞 Soporte

Para preguntas:
- Revisar documentación de pantallas
- Consultar ejemplos en componentes
- Revisar consola del navegador
- Contactar al equipo de desarrollo

---

**Frontend desarrollado con React + TypeScript + Vite**
