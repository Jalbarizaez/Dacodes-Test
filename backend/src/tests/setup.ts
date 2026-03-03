import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../config/database.js';

// Setup before all tests
beforeAll(async () => {
  // Ensure database connection
  await prisma.$connect();
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Clean database before each test
beforeEach(async () => {
  // Delete all data in reverse order of dependencies
  await prisma.auditLog.deleteMany();
  await prisma.reorderAlert.deleteMany();
  await prisma.reorderRule.deleteMany();
  await prisma.stockTransferItem.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.receptionItem.deleteMany();
  await prisma.reception.deleteMany();
  await prisma.purchaseOrderLineItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.lotStock.deleteMany();
  await prisma.stockLevel.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
});
