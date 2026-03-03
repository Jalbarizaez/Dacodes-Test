import { Router } from 'express';
import { env } from '../config/env.js';
import healthRoutes from '../modules/health/health.routes.js';
import productRoutes from '../modules/products/product.routes.js';
import warehouseRoutes from '../modules/warehouses/warehouse.routes.js';
import stockRoutes from '../modules/stock/stock.routes.js';
import movementRoutes from '../modules/movements/movement.routes.js';
import supplierRoutes from '../modules/suppliers/supplier.routes.js';
import purchaseOrderRoutes from '../modules/purchase-orders/purchase-order.routes.js';
import receptionRoutes from '../modules/receptions/reception.routes.js';
import transferRoutes from '../modules/transfers/transfer.routes.js';
import reorderRoutes from '../modules/reorder/reorder.routes.js';
import auditRoutes from '../modules/audit/audit.routes.js';
import categoryRoutes from '../modules/categories/category.routes.js';

const router = Router();

/**
 * API Routes
 * All routes are prefixed with /api/{version}
 */

// Health check routes (no version prefix)
router.use('/health', healthRoutes);

// Versioned API routes
const apiRouter = Router();

// Product routes
apiRouter.use('/products', productRoutes);

// Warehouse and Location routes
apiRouter.use(warehouseRoutes);

// Stock routes
apiRouter.use('/stock', stockRoutes);

// Movement routes
apiRouter.use('/movements', movementRoutes);

// Supplier routes
apiRouter.use('/suppliers', supplierRoutes);

// Purchase Order routes
apiRouter.use('/purchase-orders', purchaseOrderRoutes);

// Reception routes
apiRouter.use('/receptions', receptionRoutes);

// Transfer routes
apiRouter.use('/transfers', transferRoutes);

// Reorder routes
apiRouter.use('/reorder', reorderRoutes);

// Audit routes
apiRouter.use('/audit', auditRoutes);

// Category routes
apiRouter.use('/categories', categoryRoutes);

// TODO: Add other module routes here as they are implemented
// apiRouter.use('/auth', authRoutes);

// Mount versioned routes
router.use(`/${env.API_VERSION}`, apiRouter);

export default router;
