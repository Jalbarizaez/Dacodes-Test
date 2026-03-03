import { prisma } from '../config/database.js';

/**
 * Test Helpers
 * Utility functions for creating test data
 */

export async function createTestUser() {
  return prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN',
    },
  });
}

export async function createTestCategory(name: string = 'Test Category') {
  // Use timestamp to make name unique
  const uniqueName = `${name}-${Date.now()}`;
  return prisma.category.create({
    data: {
      name: uniqueName,
      description: 'Test category description',
    },
  });
}

export async function createTestProduct(categoryId: string, sku: string = 'TEST-001') {
  // Use timestamp to make SKU unique if default
  const uniqueSku = sku === 'TEST-001' ? `TEST-${Date.now()}` : sku;
  return prisma.product.create({
    data: {
      sku: uniqueSku,
      name: `Test Product ${uniqueSku}`,
      description: 'Test product description',
      categoryId,
      unitOfMeasure: 'UNIT',
      minStock: 10,
      maxStock: 100,
      isActive: true,
    },
  });
}

export async function createTestWarehouse(name: string = 'Test Warehouse') {
  return prisma.warehouse.create({
    data: {
      name,
      address: '123 Test St',
      isActive: true,
    },
  });
}

export async function createTestLocation(warehouseId: string, code: string = 'A-01') {
  return prisma.location.create({
    data: {
      warehouseId,
      code,
      name: `Location ${code}`,
      type: 'SHELF',
      isActive: true,
    },
  });
}

export async function createTestSupplier(name: string = 'Test Supplier') {
  return prisma.supplier.create({
    data: {
      name,
      contactName: 'John Doe',
      email: 'supplier@example.com',
      phone: '1234567890',
      address: '456 Supplier Ave',
      isActive: true,
    },
  });
}

export async function createTestPurchaseOrder(supplierId: string, productId: string) {
  const count = await prisma.purchaseOrder.count();
  const year = new Date().getFullYear();
  const orderNumber = `PO-${year}-${String(count + 1).padStart(4, '0')}`;

  return prisma.purchaseOrder.create({
    data: {
      orderNumber,
      supplierId,
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'DRAFT',
      totalAmount: 1000,
      lineItems: {
        create: [
          {
            productId,
            quantity: 10,
            unitPrice: 100,
            totalPrice: 1000,
          },
        ],
      },
    },
    include: {
      lineItems: true,
    },
  });
}

export async function createTestStockLevel(
  productId: string,
  locationId: string,
  quantity: number = 100
) {
  return prisma.stockLevel.create({
    data: {
      productId,
      locationId,
      quantityAvailable: quantity,
      quantityReserved: 0,
      quantityDamaged: 0,
      quantityTotal: quantity,
    },
  });
}

export async function createTestReorderRule(productId: string, locationId: string) {
  return prisma.reorderRule.create({
    data: {
      productId,
      locationId,
      minimumQuantity: 10,
      reorderQuantity: 50,
      isEnabled: true,
    },
  });
}

export async function getStockLevel(productId: string, locationId: string) {
  return prisma.stockLevel.findUnique({
    where: {
      productId_locationId: {
        productId,
        locationId,
      },
    },
  });
}
