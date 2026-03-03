import { describe, it, expect, beforeEach } from 'vitest';
import { MovementService } from './movement.service.js';
import {
  createTestCategory,
  createTestProduct,
  createTestWarehouse,
  createTestLocation,
  createTestUser,
  createTestStockLevel,
  getStockLevel,
} from '../../tests/helpers.js';

describe('MovementService', () => {
  let service: MovementService;
  let productId: string;
  let locationId: string;
  let userId: string;

  beforeEach(async () => {
    service = new MovementService();
    
    const category = await createTestCategory();
    const product = await createTestProduct(category.id, 'PROD-001');
    const warehouse = await createTestWarehouse();
    const location = await createTestLocation(warehouse.id);
    const user = await createTestUser();

    productId = product.id;
    locationId = location.id;
    userId = user.id;
  });

  describe('createMovement', () => {
    it('should create RECEIPT movement and increase stock', async () => {
      const movementData = {
        type: 'RECEIPT' as const,
        productId,
        locationId,
        quantity: 50,
        toStatus: 'AVAILABLE' as const,
        userId,
        reason: 'Initial stock',
      };

      const movement = await service.createMovement(movementData);

      expect(movement).toBeDefined();
      expect(movement.type).toBe('RECEIPT');
      expect(movement.quantity).toBe(50);
      expect(movement.runningBalance).toBe(50);

      // Verify stock level
      const stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityTotal).toBe(50);
      expect(stockLevel?.quantityAvailable).toBe(50);
    });

    it('should create SHIPMENT movement and decrease stock', async () => {
      // Create initial stock
      await createTestStockLevel(productId, locationId, 100);

      const movementData = {
        type: 'SHIPMENT' as const,
        productId,
        locationId,
        quantity: -30,
        toStatus: 'AVAILABLE' as const,
        userId,
        reason: 'Customer order',
      };

      const movement = await service.createMovement(movementData);

      expect(movement.quantity).toBe(-30);
      expect(movement.runningBalance).toBe(70);

      // Verify stock level
      const stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityTotal).toBe(70);
      expect(stockLevel?.quantityAvailable).toBe(70);
    });

    it('should create ADJUSTMENT movement', async () => {
      await createTestStockLevel(productId, locationId, 100);

      const movementData = {
        type: 'ADJUSTMENT' as const,
        productId,
        locationId,
        quantity: 10,
        toStatus: 'AVAILABLE' as const,
        userId,
        reason: 'Inventory count adjustment',
      };

      const movement = await service.createMovement(movementData);

      expect(movement.type).toBe('ADJUSTMENT');
      expect(movement.quantity).toBe(10);
      expect(movement.runningBalance).toBe(110);
    });

    it('should throw error for insufficient stock', async () => {
      await createTestStockLevel(productId, locationId, 10);

      const movementData = {
        type: 'SHIPMENT' as const,
        productId,
        locationId,
        quantity: -50,
        toStatus: 'AVAILABLE' as const,
        userId,
        reason: 'Customer order',
      };

      await expect(service.createMovement(movementData)).rejects.toThrow('Insufficient stock');
    });

    it('should handle status changes correctly', async () => {
      await createTestStockLevel(productId, locationId, 100);

      // Change 20 units from AVAILABLE to RESERVED
      const movementData = {
        type: 'RESERVATION' as const,
        productId,
        locationId,
        quantity: 20,
        fromStatus: 'AVAILABLE' as const,
        toStatus: 'RESERVED' as const,
        userId,
        reason: 'Reserved for order',
      };

      const movement = await service.createMovement(movementData);

      expect(movement.fromStatus).toBe('AVAILABLE');
      expect(movement.toStatus).toBe('RESERVED');

      // Verify stock level
      const stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityAvailable).toBe(80);
      expect(stockLevel?.quantityReserved).toBe(20);
      expect(stockLevel?.quantityTotal).toBe(100);
    });

    it('should handle DAMAGE status correctly', async () => {
      await createTestStockLevel(productId, locationId, 100);

      const movementData = {
        type: 'DAMAGE' as const,
        productId,
        locationId,
        quantity: 5,
        fromStatus: 'AVAILABLE' as const,
        toStatus: 'DAMAGED' as const,
        userId,
        reason: 'Product damaged during handling',
      };

      await service.createMovement(movementData);

      const stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityAvailable).toBe(95);
      expect(stockLevel?.quantityDamaged).toBe(5);
      expect(stockLevel?.quantityTotal).toBe(100);
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock with positive quantity', async () => {
      await createTestStockLevel(productId, locationId, 100);

      const movement = await service.adjustStock(
        productId,
        locationId,
        15,
        userId,
        'Inventory count adjustment'
      );

      expect(movement.type).toBe('ADJUSTMENT');
      expect(movement.quantity).toBe(15);

      const stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityTotal).toBe(115);
    });

    it('should adjust stock with negative quantity', async () => {
      await createTestStockLevel(productId, locationId, 100);

      const movement = await service.adjustStock(
        productId,
        locationId,
        -10,
        userId,
        'Inventory shrinkage'
      );

      expect(movement.quantity).toBe(-10);

      const stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityTotal).toBe(90);
    });
  });

  describe('changeStockStatus', () => {
    it('should change stock from AVAILABLE to RESERVED', async () => {
      await createTestStockLevel(productId, locationId, 100);

      const movement = await service.changeStockStatus(
        productId,
        locationId,
        25,
        'AVAILABLE',
        'RESERVED',
        userId,
        'Reserved for customer order'
      );

      expect(movement.fromStatus).toBe('AVAILABLE');
      expect(movement.toStatus).toBe('RESERVED');

      const stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityAvailable).toBe(75);
      expect(stockLevel?.quantityReserved).toBe(25);
    });

    it('should change stock from RESERVED back to AVAILABLE', async () => {
      // Create stock with reserved quantity
      await createTestStockLevel(productId, locationId, 100);
      await service.changeStockStatus(
        productId,
        locationId,
        30,
        'AVAILABLE',
        'RESERVED',
        userId,
        'Reserve'
      );

      // Release reservation
      const movement = await service.changeStockStatus(
        productId,
        locationId,
        30,
        'RESERVED',
        'AVAILABLE',
        userId,
        'Order cancelled'
      );

      expect(movement.fromStatus).toBe('RESERVED');
      expect(movement.toStatus).toBe('AVAILABLE');

      const stockLevel = await getStockLevel(productId, locationId);
      expect(stockLevel?.quantityAvailable).toBe(100);
      expect(stockLevel?.quantityReserved).toBe(0);
    });
  });

  describe('getMovementHistory', () => {
    it('should get movement history for product at location', async () => {
      // Create multiple movements
      await service.createMovement({
        type: 'RECEIPT',
        productId,
        locationId,
        quantity: 50,
        toStatus: 'AVAILABLE',
        userId,
        reason: 'Initial stock',
      });

      await service.createMovement({
        type: 'SHIPMENT',
        productId,
        locationId,
        quantity: -10,
        toStatus: 'AVAILABLE',
        userId,
        reason: 'Customer order',
      });

      await service.createMovement({
        type: 'ADJUSTMENT',
        productId,
        locationId,
        quantity: 5,
        toStatus: 'AVAILABLE',
        userId,
        reason: 'Inventory count',
      });

      const history = await service.getMovementHistory(productId, locationId, 10);

      expect(history).toHaveLength(3);
      expect(history[0].type).toBe('ADJUSTMENT'); // Most recent first
      expect(history[1].type).toBe('SHIPMENT');
      expect(history[2].type).toBe('RECEIPT');
    });
  });

  describe('getMovementSummary', () => {
    it('should get movement summary', async () => {
      await service.createMovement({
        type: 'RECEIPT',
        productId,
        locationId,
        quantity: 100,
        toStatus: 'AVAILABLE',
        userId,
        reason: 'Initial stock',
      });

      await service.createMovement({
        type: 'SHIPMENT',
        productId,
        locationId,
        quantity: -30,
        toStatus: 'AVAILABLE',
        userId,
        reason: 'Customer order',
      });

      await service.createMovement({
        type: 'ADJUSTMENT',
        productId,
        locationId,
        quantity: 5,
        toStatus: 'AVAILABLE',
        userId,
        reason: 'Count adjustment',
      });

      const summary = await service.getMovementSummary({ productId, locationId });

      expect(summary.totalMovements).toBe(3);
      expect(summary.totalInbound).toBe(1); // RECEIPT
      expect(summary.totalOutbound).toBe(1); // SHIPMENT
      expect(summary.totalAdjustments).toBe(1); // ADJUSTMENT
    });
  });
});
