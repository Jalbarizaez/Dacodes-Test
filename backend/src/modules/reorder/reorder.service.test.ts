import { describe, it, expect, beforeEach } from 'vitest';
import { ReorderService } from './reorder.service.js';
import {
  createTestCategory,
  createTestProduct,
  createTestWarehouse,
  createTestLocation,
  createTestStockLevel,
  createTestReorderRule,
} from '../../tests/helpers.js';
import { AppError } from '../../shared/middleware/error.middleware.js';
import { prisma } from '../../config/database.js';

describe('ReorderService', () => {
  let service: ReorderService;
  let productId: string;
  let locationId: string;

  beforeEach(async () => {
    service = new ReorderService();

    const category = await createTestCategory();
    const product = await createTestProduct(category.id, 'PROD-001');
    const warehouse = await createTestWarehouse();
    const location = await createTestLocation(warehouse.id);

    productId = product.id;
    locationId = location.id;
  });

  describe('createReorderRule', () => {
    it('should create reorder rule successfully', async () => {
      const ruleData = {
        productId,
        locationId,
        minimumQuantity: 10,
        reorderQuantity: 50,
        isEnabled: true,
      };

      const rule = await service.createReorderRule(ruleData);

      expect(rule).toBeDefined();
      expect(rule.productId).toBe(productId);
      expect(rule.locationId).toBe(locationId);
      expect(rule.minimumQuantity).toBe(10);
      expect(rule.reorderQuantity).toBe(50);
      expect(rule.isEnabled).toBe(true);
    });

    it('should throw error for duplicate rule', async () => {
      const ruleData = {
        productId,
        locationId,
        minimumQuantity: 10,
        reorderQuantity: 50,
      };

      await service.createReorderRule(ruleData);

      await expect(service.createReorderRule(ruleData)).rejects.toThrow(AppError);
      await expect(service.createReorderRule(ruleData)).rejects.toThrow('already exists');
    });

    it('should throw error for invalid product', async () => {
      const ruleData = {
        productId: 'invalid-product-id',
        locationId,
        minimumQuantity: 10,
        reorderQuantity: 50,
      };

      await expect(service.createReorderRule(ruleData)).rejects.toThrow();
    });

    it('should throw error for invalid location', async () => {
      const ruleData = {
        productId,
        locationId: 'invalid-location-id',
        minimumQuantity: 10,
        reorderQuantity: 50,
      };

      await expect(service.createReorderRule(ruleData)).rejects.toThrow();
    });
  });

  describe('updateReorderRule', () => {
    it('should update reorder rule successfully', async () => {
      const rule = await createTestReorderRule(productId, locationId);

      const updated = await service.updateReorderRule(rule.id, {
        minimumQuantity: 20,
        reorderQuantity: 100,
      });

      expect(updated.minimumQuantity).toBe(20);
      expect(updated.reorderQuantity).toBe(100);
    });

    it('should enable/disable rule', async () => {
      const rule = await createTestReorderRule(productId, locationId);

      const disabled = await service.updateReorderRule(rule.id, {
        isEnabled: false,
      });

      expect(disabled.isEnabled).toBe(false);
    });

    it('should throw error for non-existent rule', async () => {
      await expect(
        service.updateReorderRule('non-existent-id', { minimumQuantity: 20 })
      ).rejects.toThrow(AppError);
    });
  });

  describe('evaluateReorderRules', () => {
    it('should generate suggestion when stock is below minimum', async () => {
      // Create rule: min=10, reorder=50
      await createTestReorderRule(productId, locationId);

      // Create stock below minimum
      await createTestStockLevel(productId, locationId, 5);

      const suggestions = await service.evaluateReorderRules();

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].productId).toBe(productId);
      expect(suggestions[0].currentStock).toBe(5);
      expect(suggestions[0].minimumQuantity).toBe(10);
      expect(suggestions[0].suggestedOrderQuantity).toBe(55); // 50 + (10 - 5)
      expect(suggestions[0].urgency).toBe('HIGH'); // deficit >= 50%
    });

    it('should not generate suggestion when stock is above minimum', async () => {
      await createTestReorderRule(productId, locationId);
      await createTestStockLevel(productId, locationId, 50);

      const suggestions = await service.evaluateReorderRules();

      expect(suggestions).toHaveLength(0);
    });

    it('should calculate urgency correctly', async () => {
      // Test CRITICAL urgency (stock = 0)
      await createTestReorderRule(productId, locationId);
      await createTestStockLevel(productId, locationId, 0);

      let suggestions = await service.evaluateReorderRules();
      expect(suggestions[0].urgency).toBe('CRITICAL');

      // Test HIGH urgency (deficit >= 75%)
      await prisma.stockLevel.update({
        where: {
          productId_locationId: {
            productId,
            locationId,
          },
        },
        data: { quantityTotal: 2, quantityAvailable: 2 },
      });

      suggestions = await service.evaluateReorderRules();
      expect(suggestions[0].urgency).toBe('HIGH'); // deficit = 8/10 = 80%

      // Test MEDIUM urgency (deficit >= 50%)
      await prisma.stockLevel.update({
        where: {
          productId_locationId: {
            productId,
            locationId,
          },
        },
        data: { quantityTotal: 5, quantityAvailable: 5 },
      });

      suggestions = await service.evaluateReorderRules();
      expect(suggestions[0].urgency).toBe('HIGH'); // deficit = 5/10 = 50%

      // Test LOW urgency (deficit < 50%)
      await prisma.stockLevel.update({
        where: {
          productId_locationId: {
            productId,
            locationId,
          },
        },
        data: { quantityTotal: 7, quantityAvailable: 7 },
      });

      suggestions = await service.evaluateReorderRules();
      expect(suggestions[0].urgency).toBe('LOW'); // deficit = 3/10 = 30%
    });

    it('should not evaluate disabled rules', async () => {
      const rule = await createTestReorderRule(productId, locationId);
      await service.updateReorderRule(rule.id, { isEnabled: false });
      await createTestStockLevel(productId, locationId, 5);

      const suggestions = await service.evaluateReorderRules();

      expect(suggestions).toHaveLength(0);
    });

    it('should handle multiple products', async () => {
      const category = await createTestCategory();
      const product2 = await createTestProduct(category.id, 'PROD-002');
      const warehouse = await createTestWarehouse();
      const location2 = await createTestLocation(warehouse.id, 'A-02');

      // Create rules for both products
      await createTestReorderRule(productId, locationId);
      await createTestReorderRule(product2.id, location2.id);

      // Both below minimum
      await createTestStockLevel(productId, locationId, 5);
      await createTestStockLevel(product2.id, location2.id, 3);

      const suggestions = await service.evaluateReorderRules();

      expect(suggestions).toHaveLength(2);
    });
  });

  describe('getReorderSuggestions', () => {
    it('should get suggestions for specific product', async () => {
      await createTestReorderRule(productId, locationId);
      await createTestStockLevel(productId, locationId, 5);

      const suggestions = await service.getReorderSuggestions({ productId });

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].productId).toBe(productId);
    });

    it('should get suggestions for specific location', async () => {
      await createTestReorderRule(productId, locationId);
      await createTestStockLevel(productId, locationId, 5);

      const suggestions = await service.getReorderSuggestions({ locationId });

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].locationId).toBe(locationId);
    });

    it('should filter by urgency', async () => {
      await createTestReorderRule(productId, locationId);
      await createTestStockLevel(productId, locationId, 0);

      const criticalSuggestions = await service.getReorderSuggestions({ urgency: 'CRITICAL' });
      expect(criticalSuggestions).toHaveLength(1);

      const lowSuggestions = await service.getReorderSuggestions({ urgency: 'LOW' });
      expect(lowSuggestions).toHaveLength(0);
    });
  });

  describe('createReorderAlert', () => {
    it('should create alert when evaluating rules', async () => {
      await createTestReorderRule(productId, locationId);
      await createTestStockLevel(productId, locationId, 5);

      await service.evaluateReorderRules();

      const alerts = await prisma.reorderAlert.findMany({
        where: { productId, locationId },
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].status).toBe('PENDING');
      expect(alerts[0].urgency).toBe('HIGH');
    });

    it('should not create duplicate alerts', async () => {
      await createTestReorderRule(productId, locationId);
      await createTestStockLevel(productId, locationId, 5);

      // Evaluate twice
      await service.evaluateReorderRules();
      await service.evaluateReorderRules();

      const alerts = await prisma.reorderAlert.findMany({
        where: { productId, locationId, status: 'PENDING' },
      });

      // Should only have one pending alert
      expect(alerts).toHaveLength(1);
    });
  });

  describe('resolveReorderAlert', () => {
    it('should resolve alert', async () => {
      await createTestReorderRule(productId, locationId);
      await createTestStockLevel(productId, locationId, 5);
      await service.evaluateReorderRules();

      const alert = await prisma.reorderAlert.findFirst({
        where: { productId, locationId },
      });

      const resolved = await service.resolveReorderAlert(alert!.id, 'Order placed');

      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedAt).toBeDefined();
      expect(resolved.resolvedReason).toBe('Order placed');
    });

    it('should throw error for non-existent alert', async () => {
      await expect(service.resolveReorderAlert('non-existent-id', 'Test')).rejects.toThrow(
        AppError
      );
    });
  });

  describe('deleteReorderRule', () => {
    it('should delete reorder rule', async () => {
      const rule = await createTestReorderRule(productId, locationId);

      await service.deleteReorderRule(rule.id);

      const deleted = await prisma.reorderRule.findUnique({
        where: { id: rule.id },
      });

      expect(deleted).toBeNull();
    });

    it('should throw error for non-existent rule', async () => {
      await expect(service.deleteReorderRule('non-existent-id')).rejects.toThrow(AppError);
    });
  });
});
