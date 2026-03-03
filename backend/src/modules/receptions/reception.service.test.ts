import { describe, it, expect, beforeEach } from 'vitest';
import { ReceptionService } from './reception.service.js';
import {
  createTestCategory,
  createTestProduct,
  createTestWarehouse,
  createTestLocation,
  createTestSupplier,
  createTestPurchaseOrder,
  createTestUser,
  getStockLevel,
} from '../../tests/helpers.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { prisma } from '../../config/database.js';

describe('ReceptionService', () => {
  let service: ReceptionService;
  let productId: string;
  let locationId: string;
  let supplierId: string;
  let userId: string;

  beforeEach(async () => {
    service = new ReceptionService();

    const category = await createTestCategory();
    const product = await createTestProduct(category.id, 'PROD-001');
    const warehouse = await createTestWarehouse();
    const location = await createTestLocation(warehouse.id);
    const supplier = await createTestSupplier();
    const user = await createTestUser();

    productId = product.id;
    locationId = location.id;
    supplierId = supplier.id;
    userId = user.id;
  });

  describe('createReception', () => {
    it('should create reception and update stock', async () => {
      const po = await createTestPurchaseOrder(supplierId, productId);
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'SUBMITTED' },
      });

      const lineItem = po.lineItems[0];

      const receptionData = {
        purchaseOrderId: po.id,
        receivedDate: new Date(),
        receivedBy: 'Test User',
        items: [
          {
            lineItemId: lineItem.id,
            receivedQuantity: 10,
            locationId,
          },
        ],
      };

      const reception = await service.createReception(receptionData, userId);

      expect(reception).toBeDefined();
      expect(reception.purchaseOrderId).toBe(po.id);

      // Verify stock was created
      const stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityTotal).toBe(10);
      expect(stockLevel?.quantityAvailable).toBe(10);

      // Verify line item was updated
      const updatedLineItem = await prisma.purchaseOrderLineItem.findUnique({
        where: { id: lineItem.id },
      });
      expect(updatedLineItem?.receivedQuantity).toBe(10);

      // Verify PO status was updated
      const updatedPO = await prisma.purchaseOrder.findUnique({
        where: { id: po.id },
      });
      expect(updatedPO?.status).toBe('RECEIVED');
    });

    it('should handle partial reception', async () => {
      const po = await createTestPurchaseOrder(supplierId, productId);
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'SUBMITTED' },
      });

      const lineItem = po.lineItems[0];

      // Receive only 5 out of 10
      const receptionData = {
        purchaseOrderId: po.id,
        receivedDate: new Date(),
        receivedBy: 'Test User',
        items: [
          {
            lineItemId: lineItem.id,
            receivedQuantity: 5,
            locationId,
          },
        ],
      };

      await service.createReception(receptionData, userId);

      // Verify PO status is PARTIALLY_RECEIVED
      const updatedPO = await prisma.purchaseOrder.findUnique({
        where: { id: po.id },
      });
      expect(updatedPO?.status).toBe('PARTIALLY_RECEIVED');

      // Verify stock
      const stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityTotal).toBe(5);
    });

    it('should handle multiple partial receptions', async () => {
      const po = await createTestPurchaseOrder(supplierId, productId);
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'SUBMITTED' },
      });

      const lineItem = po.lineItems[0];

      // First reception: 3 units
      await service.createReception(
        {
          purchaseOrderId: po.id,
          receivedDate: new Date(),
          receivedBy: 'Test User',
          items: [
            {
              lineItemId: lineItem.id,
              receivedQuantity: 3,
              locationId,
            },
          ],
        },
        userId
      );

      let stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityTotal).toBe(3);

      // Second reception: 4 units
      await service.createReception(
        {
          purchaseOrderId: po.id,
          receivedDate: new Date(),
          receivedBy: 'Test User',
          items: [
            {
              lineItemId: lineItem.id,
              receivedQuantity: 4,
              locationId,
            },
          ],
        },
        userId
      );

      stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityTotal).toBe(7);

      // Third reception: 3 units (complete)
      await service.createReception(
        {
          purchaseOrderId: po.id,
          receivedDate: new Date(),
          receivedBy: 'Test User',
          items: [
            {
              lineItemId: lineItem.id,
              receivedQuantity: 3,
              locationId,
            },
          ],
        },
        userId
      );

      stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityTotal).toBe(10);

      // Verify PO is now RECEIVED
      const updatedPO = await prisma.purchaseOrder.findUnique({
        where: { id: po.id },
      });
      expect(updatedPO?.status).toBe('RECEIVED');
    });

    it('should create stock movement for reception', async () => {
      const po = await createTestPurchaseOrder(supplierId, productId);
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'SUBMITTED' },
      });

      const lineItem = po.lineItems[0];

      await service.createReception(
        {
          purchaseOrderId: po.id,
          receivedDate: new Date(),
          receivedBy: 'Test User',
          items: [
            {
              lineItemId: lineItem.id,
              receivedQuantity: 10,
              locationId,
            },
          ],
        },
        userId
      );

      // Verify stock movement was created
      const movements = await prisma.stockMovement.findMany({
        where: {
          productId,
          locationId,
          type: 'RECEIPT',
        },
      });

      expect(movements).toHaveLength(1);
      expect(movements[0].quantity).toBe(10);
      expect(movements[0].referenceType).toBe('purchase_order');
      expect(movements[0].referenceId).toBe(po.id);
    });

    it('should throw error for non-existent purchase order', async () => {
      const receptionData = {
        purchaseOrderId: 'non-existent-id',
        receivedDate: new Date(),
        receivedBy: 'Test User',
        items: [],
      };

      await expect(service.createReception(receptionData, userId)).rejects.toThrow(AppError);
    });

    it('should throw error for DRAFT purchase order', async () => {
      const po = await createTestPurchaseOrder(supplierId, productId);
      // PO is in DRAFT status by default

      const lineItem = po.lineItems[0];

      const receptionData = {
        purchaseOrderId: po.id,
        receivedDate: new Date(),
        receivedBy: 'Test User',
        items: [
          {
            lineItemId: lineItem.id,
            receivedQuantity: 10,
            locationId,
          },
        ],
      };

      await expect(service.createReception(receptionData, userId)).rejects.toThrow(AppError);
      await expect(service.createReception(receptionData, userId)).rejects.toThrow(
        'Cannot receive'
      );
    });

    it('should throw error for CANCELLED purchase order', async () => {
      const po = await createTestPurchaseOrder(supplierId, productId);
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'CANCELLED' },
      });

      const lineItem = po.lineItems[0];

      const receptionData = {
        purchaseOrderId: po.id,
        receivedDate: new Date(),
        receivedBy: 'Test User',
        items: [
          {
            lineItemId: lineItem.id,
            receivedQuantity: 10,
            locationId,
          },
        ],
      };

      await expect(service.createReception(receptionData, userId)).rejects.toThrow(AppError);
    });

    it('should handle batch numbers', async () => {
      const po = await createTestPurchaseOrder(supplierId, productId);
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'SUBMITTED' },
      });

      const lineItem = po.lineItems[0];

      const receptionData = {
        purchaseOrderId: po.id,
        receivedDate: new Date(),
        receivedBy: 'Test User',
        items: [
          {
            lineItemId: lineItem.id,
            receivedQuantity: 10,
            locationId,
            batchNumber: 'BATCH-001',
            expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        ],
      };

      const reception = await service.createReception(receptionData, userId);

      // Verify reception item has batch info
      const receptionItems = await prisma.receptionItem.findMany({
        where: { receptionId: reception.id },
      });

      expect(receptionItems[0].batchNumber).toBe('BATCH-001');
      expect(receptionItems[0].expirationDate).toBeDefined();
    });
  });

  describe('getReceptionsByPurchaseOrder', () => {
    it('should get all receptions for a purchase order', async () => {
      const po = await createTestPurchaseOrder(supplierId, productId);
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'SUBMITTED' },
      });

      const lineItem = po.lineItems[0];

      // Create two receptions
      await service.createReception(
        {
          purchaseOrderId: po.id,
          receivedDate: new Date(),
          receivedBy: 'User 1',
          items: [
            {
              lineItemId: lineItem.id,
              receivedQuantity: 5,
              locationId,
            },
          ],
        },
        userId
      );

      await service.createReception(
        {
          purchaseOrderId: po.id,
          receivedDate: new Date(),
          receivedBy: 'User 2',
          items: [
            {
              lineItemId: lineItem.id,
              receivedQuantity: 5,
              locationId,
            },
          ],
        },
        userId
      );

      const receptions = await service.getReceptionsByPurchaseOrder(po.id);

      expect(receptions).toHaveLength(2);
      expect(receptions[0].receivedBy).toBe('User 2'); // Most recent first
      expect(receptions[1].receivedBy).toBe('User 1');
    });
  });
});
