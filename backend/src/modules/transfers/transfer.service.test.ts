import { describe, it, expect, beforeEach } from 'vitest';
import { TransferService } from './transfer.service.js';
import {
  createTestCategory,
  createTestProduct,
  createTestWarehouse,
  createTestLocation,
  createTestUser,
  createTestStockLevel,
  getStockLevel,
} from '../../tests/helpers.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { prisma } from '../../config/database.js';

describe('TransferService', () => {
  let service: TransferService;
  let productId: string;
  let sourceLocationId: string;
  let destinationLocationId: string;
  let userId: string;

  beforeEach(async () => {
    service = new TransferService();

    const category = await createTestCategory();
    const product = await createTestProduct(category.id, 'PROD-001');
    const warehouse1 = await createTestWarehouse('Warehouse A');
    const warehouse2 = await createTestWarehouse('Warehouse B');
    const sourceLocation = await createTestLocation(warehouse1.id, 'A-01');
    const destinationLocation = await createTestLocation(warehouse2.id, 'B-01');
    const user = await createTestUser();

    productId = product.id;
    sourceLocationId = sourceLocation.id;
    destinationLocationId = destinationLocation.id;
    userId = user.id;
  });

  describe('createTransfer', () => {
    it('should create transfer successfully', async () => {
      const transferData = {
        sourceLocationId,
        destinationLocationId,
        requestedDate: new Date(),
        requestedBy: userId,
        items: [
          {
            productId,
            quantityRequested: 50,
          },
        ],
      };

      const transfer = await service.createTransfer(transferData);

      expect(transfer).toBeDefined();
      expect(transfer.status).toBe('PENDING');
      expect(transfer.sourceLocationId).toBe(sourceLocationId);
      expect(transfer.destinationLocationId).toBe(destinationLocationId);
      expect(transfer.transferNumber).toMatch(/^TR-\d{4}-\d{4}$/);
    });

    it('should throw error for same source and destination', async () => {
      const transferData = {
        sourceLocationId,
        destinationLocationId: sourceLocationId, // Same as source
        requestedDate: new Date(),
        requestedBy: userId,
        items: [
          {
            productId,
            quantityRequested: 50,
          },
        ],
      };

      await expect(service.createTransfer(transferData)).rejects.toThrow(AppError);
      await expect(service.createTransfer(transferData)).rejects.toThrow('same location');
    });

    it('should throw error for inactive locations', async () => {
      // Deactivate source location
      await prisma.location.update({
        where: { id: sourceLocationId },
        data: { isActive: false },
      });

      const transferData = {
        sourceLocationId,
        destinationLocationId,
        requestedDate: new Date(),
        requestedBy: userId,
        items: [
          {
            productId,
            quantityRequested: 50,
          },
        ],
      };

      await expect(service.createTransfer(transferData)).rejects.toThrow(AppError);
      await expect(service.createTransfer(transferData)).rejects.toThrow('inactive');
    });
  });

  describe('shipTransfer', () => {
    it('should ship transfer and decrease source stock', async () => {
      // Create initial stock at source
      await createTestStockLevel(productId, sourceLocationId, 100);

      // Create transfer
      const transfer = await service.createTransfer({
        sourceLocationId,
        destinationLocationId,
        requestedDate: new Date(),
        requestedBy: userId,
        items: [
          {
            productId,
            quantityRequested: 50,
          },
        ],
      });

      const transferItem = await prisma.stockTransferItem.findFirst({
        where: { transferId: transfer.id },
      });

      // Ship transfer
      const shipped = await service.shipTransfer(
        transfer.id,
        new Date(),
        [
          {
            itemId: transferItem!.id,
            quantityShipped: 50,
          },
        ],
        userId
      );

      expect(shipped.status).toBe('IN_TRANSIT');
      expect(shipped.shippedDate).toBeDefined();

      // Verify source stock decreased
      const sourceStock = await getStockLevel(productId, sourceLocationId);
      expect(sourceStock?.quantityTotal).toBe(50);
      expect(sourceStock?.quantityAvailable).toBe(50);

      // Verify TRANSFER_OUT movement was created
      const movements = await prisma.stockMovement.findMany({
        where: {
          productId,
          locationId: sourceLocationId,
          type: 'TRANSFER_OUT',
        },
      });

      expect(movements).toHaveLength(1);
      expect(movements[0].quantity).toBe(-50);
    });

    it('should throw error for insufficient stock', async () => {
      // Create insufficient stock
      await createTestStockLevel(productId, sourceLocationId, 20);

      const transfer = await service.createTransfer({
        sourceLocationId,
        destinationLocationId,
        requestedDate: new Date(),
        requestedBy: userId,
        items: [
          {
            productId,
            quantityRequested: 50,
          },
        ],
      });

      const transferItem = await prisma.stockTransferItem.findFirst({
        where: { transferId: transfer.id },
      });

      await expect(
        service.shipTransfer(
          transfer.id,
          new Date(),
          [
            {
              itemId: transferItem!.id,
              quantityShipped: 50,
            },
          ],
          userId
        )
      ).rejects.toThrow();
    });

    it('should throw error for invalid status', async () => {
      await createTestStockLevel(productId, sourceLocationId, 100);

      const transfer = await service.createTransfer({
        sourceLocationId,
        destinationLocationId,
        requestedDate: new Date(),
        requestedBy: userId,
        items: [
          {
            productId,
            quantityRequested: 50,
          },
        ],
      });

      // Cancel the transfer
      await prisma.stockTransfer.update({
        where: { id: transfer.id },
        data: { status: 'CANCELLED' },
      });

      const transferItem = await prisma.stockTransferItem.findFirst({
        where: { transferId: transfer.id },
      });

      await expect(
        service.shipTransfer(
          transfer.id,
          new Date(),
          [
            {
              itemId: transferItem!.id,
              quantityShipped: 50,
            },
          ],
          userId
        )
      ).rejects.toThrow(AppError);
    });
  });

  describe('completeTransfer', () => {
    it('should complete transfer and increase destination stock', async () => {
      // Setup and ship transfer
      await createTestStockLevel(productId, sourceLocationId, 100);

      const transfer = await service.createTransfer({
        sourceLocationId,
        destinationLocationId,
        requestedDate: new Date(),
        requestedBy: userId,
        items: [
          {
            productId,
            quantityRequested: 50,
          },
        ],
      });

      const transferItem = await prisma.stockTransferItem.findFirst({
        where: { transferId: transfer.id },
      });

      await service.shipTransfer(
        transfer.id,
        new Date(),
        [
          {
            itemId: transferItem!.id,
            quantityShipped: 50,
          },
        ],
        userId
      );

      // Complete transfer
      const completed = await service.completeTransfer(
        transfer.id,
        new Date(),
        [
          {
            itemId: transferItem!.id,
            quantityReceived: 50,
          },
        ],
        userId
      );

      expect(completed.status).toBe('COMPLETED');
      expect(completed.completedDate).toBeDefined();

      // Verify destination stock increased
      const destStock = await getStockLevel(productId, destinationLocationId);
      expect(destStock?.quantityTotal).toBe(50);
      expect(destStock?.quantityAvailable).toBe(50);

      // Verify TRANSFER_IN movement was created
      const movements = await prisma.stockMovement.findMany({
        where: {
          productId,
          locationId: destinationLocationId,
          type: 'TRANSFER_IN',
        },
      });

      expect(movements).toHaveLength(1);
      expect(movements[0].quantity).toBe(50);
    });

    it('should handle partial receipt', async () => {
      await createTestStockLevel(productId, sourceLocationId, 100);

      const transfer = await service.createTransfer({
        sourceLocationId,
        destinationLocationId,
        requestedDate: new Date(),
        requestedBy: userId,
        items: [
          {
            productId,
            quantityRequested: 50,
          },
        ],
      });

      const transferItem = await prisma.stockTransferItem.findFirst({
        where: { transferId: transfer.id },
      });

      await service.shipTransfer(
        transfer.id,
        new Date(),
        [
          {
            itemId: transferItem!.id,
            quantityShipped: 50,
          },
        ],
        userId
      );

      // Receive only 45 (5 damaged/lost)
      await service.completeTransfer(
        transfer.id,
        new Date(),
        [
          {
            itemId: transferItem!.id,
            quantityReceived: 45,
          },
        ],
        userId
      );

      const destStock = await getStockLevel(productId, destinationLocationId);
      expect(destStock?.quantityTotal).toBe(45);
    });

    it('should throw error for invalid status', async () => {
      await createTestStockLevel(productId, sourceLocationId, 100);

      const transfer = await service.createTransfer({
        sourceLocationId,
        destinationLocationId,
        requestedDate: new Date(),
        requestedBy: userId,
        items: [
          {
            productId,
            quantityRequested: 50,
          },
        ],
      });

      const transferItem = await prisma.stockTransferItem.findFirst({
        where: { transferId: transfer.id },
      });

      // Try to complete without shipping
      await expect(
        service.completeTransfer(
          transfer.id,
          new Date(),
          [
            {
              itemId: transferItem!.id,
              quantityReceived: 50,
            },
          ],
          userId
        )
      ).rejects.toThrow(AppError);
    });
  });

  describe('cancelTransfer', () => {
    it('should cancel PENDING transfer', async () => {
      const transfer = await service.createTransfer({
        sourceLocationId,
        destinationLocationId,
        requestedDate: new Date(),
        requestedBy: userId,
        items: [
          {
            productId,
            quantityRequested: 50,
          },
        ],
      });

      const cancelled = await service.cancelTransfer(transfer.id);

      expect(cancelled.status).toBe('CANCELLED');
    });

    it('should throw error for IN_TRANSIT transfer', async () => {
      await createTestStockLevel(productId, sourceLocationId, 100);

      const transfer = await service.createTransfer({
        sourceLocationId,
        destinationLocationId,
        requestedDate: new Date(),
        requestedBy: userId,
        items: [
          {
            productId,
            quantityRequested: 50,
          },
        ],
      });

      const transferItem = await prisma.stockTransferItem.findFirst({
        where: { transferId: transfer.id },
      });

      await service.shipTransfer(
        transfer.id,
        new Date(),
        [
          {
            itemId: transferItem!.id,
            quantityShipped: 50,
          },
        ],
        userId
      );

      await expect(service.cancelTransfer(transfer.id)).rejects.toThrow(AppError);
    });
  });

  describe('Stock Consistency', () => {
    it('should maintain stock consistency through complete transfer flow', async () => {
      // Initial state
      await createTestStockLevel(productId, sourceLocationId, 100);

      const initialSourceStock = await getStockLevel(productId, sourceLocationId);
      expect(initialSourceStock?.quantityTotal).toBe(100);

      // Create and ship transfer
      const transfer = await service.createTransfer({
        sourceLocationId,
        destinationLocationId,
        requestedDate: new Date(),
        requestedBy: userId,
        items: [
          {
            productId,
            quantityRequested: 30,
          },
        ],
      });

      const transferItem = await prisma.stockTransferItem.findFirst({
        where: { transferId: transfer.id },
      });

      await service.shipTransfer(
        transfer.id,
        new Date(),
        [
          {
            itemId: transferItem!.id,
            quantityShipped: 30,
          },
        ],
        userId
      );

      // After shipping
      const afterShipSource = await getStockLevel(productId, sourceLocationId);
      expect(afterShipSource?.quantityTotal).toBe(70);

      // Complete transfer
      await service.completeTransfer(
        transfer.id,
        new Date(),
        [
          {
            itemId: transferItem!.id,
            quantityReceived: 30,
          },
        ],
        userId
      );

      // Final state
      const finalSourceStock = await getStockLevel(productId, sourceLocationId);
      const finalDestStock = await getStockLevel(productId, destinationLocationId);

      expect(finalSourceStock?.quantityTotal).toBe(70);
      expect(finalDestStock?.quantityTotal).toBe(30);

      // Total inventory should be conserved
      const totalInventory =
        (finalSourceStock?.quantityTotal || 0) + (finalDestStock?.quantityTotal || 0);
      expect(totalInventory).toBe(100);
    });
  });
});
