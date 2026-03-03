import { describe, it, expect, beforeEach } from 'vitest';
import { ProductService } from './product.service.js';
import { createTestCategory, createTestProduct, createTestWarehouse, createTestLocation, createTestStockLevel } from '../../tests/helpers.js';
import { AppError } from '../../shared/middleware/error.middleware.js';

describe('ProductService', () => {
  let service: ProductService;
  let categoryId: string;

  beforeEach(async () => {
    service = new ProductService();
    const category = await createTestCategory();
    categoryId = category.id;
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const productData = {
        sku: 'PROD-001',
        name: 'Test Product',
        description: 'Test description',
        categoryId,
        unitOfMeasure: 'UNIT' as const,
        minStock: 10,
        maxStock: 100,
      };

      const product = await service.createProduct(productData);

      expect(product).toBeDefined();
      expect(product.sku).toBe('PROD-001');
      expect(product.name).toBe('Test Product');
      expect(product.categoryId).toBe(categoryId);
      expect(product.isActive).toBe(true);
    });

    it('should throw error for duplicate SKU', async () => {
      const productData = {
        sku: 'PROD-001',
        name: 'Test Product',
        description: 'Test description',
        categoryId,
        unitOfMeasure: 'UNIT' as const,
      };

      await service.createProduct(productData);

      await expect(service.createProduct(productData)).rejects.toThrow(AppError);
      await expect(service.createProduct(productData)).rejects.toThrow('already exists');
    });

    it('should throw error for duplicate barcode', async () => {
      const productData1 = {
        sku: 'PROD-001',
        name: 'Test Product 1',
        description: 'Test description',
        categoryId,
        unitOfMeasure: 'UNIT' as const,
        barcode: '1234567890',
      };

      const productData2 = {
        sku: 'PROD-002',
        name: 'Test Product 2',
        description: 'Test description',
        categoryId,
        unitOfMeasure: 'UNIT' as const,
        barcode: '1234567890',
      };

      await service.createProduct(productData1);

      await expect(service.createProduct(productData2)).rejects.toThrow(AppError);
      await expect(service.createProduct(productData2)).rejects.toThrow('barcode');
    });

    it('should throw error for invalid category', async () => {
      const productData = {
        sku: 'PROD-001',
        name: 'Test Product',
        description: 'Test description',
        categoryId: 'invalid-category-id',
        unitOfMeasure: 'UNIT' as const,
      };

      await expect(service.createProduct(productData)).rejects.toThrow();
    });
  });

  describe('getProductById', () => {
    it('should get product by ID', async () => {
      const created = await createTestProduct(categoryId, 'PROD-001');

      const product = await service.getProductById(created.id);

      expect(product).toBeDefined();
      expect(product.id).toBe(created.id);
      expect(product.sku).toBe('PROD-001');
    });

    it('should throw error for non-existent product', async () => {
      await expect(service.getProductById('non-existent-id')).rejects.toThrow(AppError);
      await expect(service.getProductById('non-existent-id')).rejects.toThrow('not found');
    });
  });

  describe('getProductBySku', () => {
    it('should get product by SKU', async () => {
      await createTestProduct(categoryId, 'PROD-001');

      const product = await service.getProductBySku('PROD-001');

      expect(product).toBeDefined();
      expect(product.sku).toBe('PROD-001');
    });

    it('should throw error for non-existent SKU', async () => {
      await expect(service.getProductBySku('NON-EXISTENT')).rejects.toThrow(AppError);
    });
  });

  describe('getAllProducts', () => {
    it('should get all products with pagination', async () => {
      await createTestProduct(categoryId, 'PROD-001');
      await createTestProduct(categoryId, 'PROD-002');
      await createTestProduct(categoryId, 'PROD-003');

      const result = await service.getAllProducts({}, 1, 2);

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(3);
    });

    it('should filter products by category', async () => {
      const category2 = await createTestCategory('Category 2');
      await createTestProduct(categoryId, 'PROD-001');
      await createTestProduct(category2.id, 'PROD-002');

      const result = await service.getAllProducts({ categoryId }, 1, 10);

      expect(result.products).toHaveLength(1);
      expect(result.products[0].sku).toBe('PROD-001');
    });

    it('should filter products by active status', async () => {
      const product1 = await createTestProduct(categoryId, 'PROD-001');
      await createTestProduct(categoryId, 'PROD-002');

      // Deactivate product1
      await service.updateProduct(product1.id, { isActive: false });

      const result = await service.getAllProducts({ isActive: true }, 1, 10);

      expect(result.products).toHaveLength(1);
      expect(result.products[0].sku).toBe('PROD-002');
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const product = await createTestProduct(categoryId, 'PROD-001');

      const updated = await service.updateProduct(product.id, {
        name: 'Updated Product Name',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated Product Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.sku).toBe('PROD-001'); // SKU should not change
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        service.updateProduct('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow(AppError);
    });

    it('should throw error for duplicate barcode', async () => {
      const product1 = await createTestProduct(categoryId, 'PROD-001');
      await createTestProduct(categoryId, 'PROD-002');

      // Try to update product1 with product2's barcode
      await expect(
        service.updateProduct(product1.id, { barcode: '1234567890' })
      ).rejects.toThrow();
    });
  });

  describe('deactivateProduct', () => {
    it('should deactivate product without stock', async () => {
      const product = await createTestProduct(categoryId, 'PROD-001');

      const deactivated = await service.deactivateProduct(product.id);

      expect(deactivated.isActive).toBe(false);
    });

    it('should throw error when deactivating product with stock', async () => {
      const product = await createTestProduct(categoryId, 'PROD-001');
      const warehouse = await createTestWarehouse();
      const location = await createTestLocation(warehouse.id);
      await createTestStockLevel(product.id, location.id, 50);

      await expect(service.deactivateProduct(product.id)).rejects.toThrow(AppError);
      await expect(service.deactivateProduct(product.id)).rejects.toThrow('existing stock');
    });

    it('should throw error when deactivating already inactive product', async () => {
      const product = await createTestProduct(categoryId, 'PROD-001');
      await service.deactivateProduct(product.id);

      await expect(service.deactivateProduct(product.id)).rejects.toThrow(AppError);
      await expect(service.deactivateProduct(product.id)).rejects.toThrow('already inactive');
    });
  });
});
