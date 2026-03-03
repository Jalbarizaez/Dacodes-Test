import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTestCategory,
  createTestProduct,
  createTestWarehouse,
  createTestLocation,
  createTestSupplier,
  createTestUser,
  getStockLevel,
} from '../helpers.js';
import { ProductService } from '../../modules/products/product.service.js';
import { PurchaseOrderService } from '../../modules/purchase-orders/purchase-order.service.js';
import { ReceptionService } from '../../modules/receptions/reception.service.js';
import { MovementService } from '../../modules/movements/movement.service.js';
import { TransferService } from '../../modules/transfers/transfer.service.js';
import { ReorderService } from '../../modules/reorder/reorder.service.js';
import { prisma } from '../../config/database.js';

describe('Complete Inventory Flow Integration Test', () => {
  let poService: PurchaseOrderService;
  let receptionService: ReceptionService;
  let movementService: MovementService;
  let transferService: TransferService;
  let reorderService: ReorderService;

  let productId: string;
  let supplierId: string;
  let locationA1Id: string;
  let locationB1Id: string;
  let userId: string;

  beforeEach(async () => {
    productService = new ProductService();
    poService = new PurchaseOrderService();
    receptionService = new ReceptionService();
    movementService = new MovementService();
    transferService = new TransferService();
    reorderService = new ReorderService();

    // Setup test data
    const category = await createTestCategory();
    const product = await createTestProduct(category.id, 'PROD-001');
    const supplier = await createTestSupplier();
    const warehouseA = await createTestWarehouse('Warehouse A');
    const warehouseB = await createTestWarehouse('Warehouse B');
    const locationA1 = await createTestLocation(warehouseA.id, 'A-01');
    const locationB1 = await createTestLocation(warehouseB.id, 'B-01');
    const user = await createTestUser();

    productId = product.id;
    supplierId = supplier.id;
    warehouseAId = warehouseA.id;
    warehouseBId = warehouseB.id;
    locationA1Id = locationA1.id;
    locationB1Id = locationB1.id;
    userId = user.id;
  });

  it('should handle complete inventory lifecycle', async () => {
    // ========================================
    // STEP 1: Create Purchase Order
    // ========================================
    const po = await poService.createPurchaseOrder({
      supplierId,
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lineItems: [
        {
          productId,
          quantity: 100,
          unitPrice: 10,
        },
      ],
    });

    expect(po.status).toBe('DRAFT');
    expect(po.lineItems).toHaveLength(1);

    // ========================================
    // STEP 2: Submit Purchase Order
    // ========================================
    const submittedPO = await poService.updateStatus(po.id, 'SUBMITTED');
    expect(submittedPO.status).toBe('SUBMITTED');

    // ========================================
    // STEP 3: Receive Purchase Order
    // ========================================
    const lineItem = po.lineItems[0];
    const reception = await receptionService.createReception(
      {
        purchaseOrderId: po.id,
        receivedDate: new Date(),
        receivedBy: 'Warehouse Manager',
        items: [
          {
            lineItemId: lineItem.id,
            receivedQuantity: 100,
            locationId: locationA1Id,
            batchNumber: 'BATCH-001',
          },
        ],
      },
      userId
    );

    expect(reception).toBeDefined();

    // Verify stock was created
    let stockA1 = await getStockLevel(productId, locationA1Id);
    expect(stockA1?.quantityTotal).toBe(100);
    expect(stockA1?.quantityAvailable).toBe(100);

    // Verify PO status updated
    const receivedPO = await prisma.purchaseOrder.findUnique({
      where: { id: po.id },
    });
    expect(receivedPO?.status).toBe('RECEIVED');

    // ========================================
    // STEP 4: Reserve Stock for Customer Order
    // ========================================
    await movementService.changeStockStatus(
      productId,
      locationA1Id,
      30,
      'AVAILABLE',
      'RESERVED',
      userId,
      'Reserved for customer order #123'
    );

    stockA1 = await getStockLevel(productId, locationA1Id);
    expect(stockA1?.quantityAvailable).toBe(70);
    expect(stockA1?.quantityReserved).toBe(30);
    expect(stockA1?.quantityTotal).toBe(100);

    // ========================================
    // STEP 5: Ship Reserved Stock
    // ========================================
    await movementService.createMovement({
      type: 'SHIPMENT',
      productId,
      locationId: locationA1Id,
      quantity: -30,
      fromStatus: 'RESERVED',
      toStatus: 'AVAILABLE',
      userId,
      reason: 'Shipped to customer #123',
    });

    stockA1 = await getStockLevel(productId, locationA1Id);
    expect(stockA1?.quantityTotal).toBe(70);
    expect(stockA1?.quantityAvailable).toBe(70);
    expect(stockA1?.quantityReserved).toBe(0);

    // ========================================
    // STEP 6: Transfer Stock to Warehouse B
    // ========================================
    const transfer = await transferService.createTransfer({
      sourceLocationId: locationA1Id,
      destinationLocationId: locationB1Id,
      requestedDate: new Date(),
      requestedBy: userId,
      items: [
        {
          productId,
          quantityRequested: 40,
        },
      ],
    });

    expect(transfer.status).toBe('PENDING');

    // Ship transfer
    const transferItem = await prisma.stockTransferItem.findFirst({
      where: { transferId: transfer.id },
    });

    const shippedTransfer = await transferService.shipTransfer(
      transfer.id,
      new Date(),
      [
        {
          itemId: transferItem!.id,
          quantityShipped: 40,
        },
      ],
      userId
    );

    expect(shippedTransfer.status).toBe('IN_TRANSIT');

    // Verify source stock decreased
    stockA1 = await getStockLevel(productId, locationA1Id);
    expect(stockA1?.quantityTotal).toBe(30);

    // Complete transfer
    const completedTransfer = await transferService.completeTransfer(
      transfer.id,
      new Date(),
      [
        {
          itemId: transferItem!.id,
          quantityReceived: 40,
        },
      ],
      userId
    );

    expect(completedTransfer.status).toBe('COMPLETED');

    // Verify destination stock increased
    const stockB1 = await getStockLevel(productId, locationB1Id);
    expect(stockB1?.quantityTotal).toBe(40);

    // ========================================
    // STEP 7: Inventory Adjustment
    // ========================================
    await movementService.adjustStock(
      productId,
      locationA1Id,
      -2,
      userId,
      'Inventory count adjustment - 2 units damaged'
    );

    stockA1 = await getStockLevel(productId, locationA1Id);
    expect(stockA1?.quantityTotal).toBe(28);

    // ========================================
    // STEP 8: Setup Reorder Rule and Evaluate
    // ========================================
    await reorderService.createReorderRule({
      productId,
      locationId: locationA1Id,
      minimumQuantity: 50,
      reorderQuantity: 100,
      isEnabled: true,
    });

    const suggestions = await reorderService.evaluateReorderRules();

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].productId).toBe(productId);
    expect(suggestions[0].currentStock).toBe(28);
    expect(suggestions[0].minimumQuantity).toBe(50);
    expect(suggestions[0].suggestedOrderQuantity).toBeGreaterThan(100);
    expect(suggestions[0].urgency).toBe('HIGH');

    // ========================================
    // STEP 9: Verify Total Inventory Consistency
    // ========================================
    const finalStockA1 = await getStockLevel(productId, locationA1Id);
    const finalStockB1 = await getStockLevel(productId, locationB1Id);

    const totalInventory =
      (finalStockA1?.quantityTotal || 0) + (finalStockB1?.quantityTotal || 0);

    // Initial: 100, Shipped: -30, Adjustment: -2 = 68
    expect(totalInventory).toBe(68);

    // ========================================
    // STEP 10: Verify Movement History
    // ========================================
    const movementsA1 = await movementService.getMovementHistory(productId, locationA1Id, 100);

    // Should have: RECEIPT, RESERVATION, RELEASE, SHIPMENT, TRANSFER_OUT, ADJUSTMENT
    expect(movementsA1.length).toBeGreaterThanOrEqual(5);

    const movementsB1 = await movementService.getMovementHistory(productId, locationB1Id, 100);

    // Should have: TRANSFER_IN
    expect(movementsB1).toHaveLength(1);
    expect(movementsB1[0].type).toBe('TRANSFER_IN');
  });

  it('should handle partial reception and multiple transfers', async () => {
    // Create PO for 100 units
    const po = await poService.createPurchaseOrder({
      supplierId,
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lineItems: [
        {
          productId,
          quantity: 100,
          unitPrice: 10,
        },
      ],
    });

    await poService.updateStatus(po.id, 'SUBMITTED');

    const lineItem = po.lineItems[0];

    // Partial reception 1: 40 units
    await receptionService.createReception(
      {
        purchaseOrderId: po.id,
        receivedDate: new Date(),
        receivedBy: 'User 1',
        items: [
          {
            lineItemId: lineItem.id,
            receivedQuantity: 40,
            locationId: locationA1Id,
          },
        ],
      },
      userId
    );

    let stockA1 = await getStockLevel(productId, locationA1Id);
    expect(stockA1?.quantityTotal).toBe(40);

    let poStatus = await prisma.purchaseOrder.findUnique({
      where: { id: po.id },
      select: { status: true },
    });
    expect(poStatus?.status).toBe('PARTIALLY_RECEIVED');

    // Partial reception 2: 60 units
    await receptionService.createReception(
      {
        purchaseOrderId: po.id,
        receivedDate: new Date(),
        receivedBy: 'User 2',
        items: [
          {
            lineItemId: lineItem.id,
            receivedQuantity: 60,
            locationId: locationA1Id,
          },
        ],
      },
      userId
    );

    stockA1 = await getStockLevel(productId, locationA1Id);
    expect(stockA1?.quantityTotal).toBe(100);

    poStatus = await prisma.purchaseOrder.findUnique({
      where: { id: po.id },
      select: { status: true },
    });
    expect(poStatus?.status).toBe('RECEIVED');

    // Transfer 50 units to Warehouse B
    const transfer1 = await transferService.createTransfer({
      sourceLocationId: locationA1Id,
      destinationLocationId: locationB1Id,
      requestedDate: new Date(),
      requestedBy: userId,
      items: [
        {
          productId,
          quantityRequested: 50,
        },
      ],
    });

    const item1 = await prisma.stockTransferItem.findFirst({
      where: { transferId: transfer1.id },
    });

    await transferService.shipTransfer(
      transfer1.id,
      new Date(),
      [{ itemId: item1!.id, quantityShipped: 50 }],
      userId
    );

    await transferService.completeTransfer(
      transfer1.id,
      new Date(),
      [{ itemId: item1!.id, quantityReceived: 50 }],
      userId
    );

    // Verify stocks
    stockA1 = await getStockLevel(productId, locationA1Id);
    const stockB1 = await getStockLevel(productId, locationB1Id);

    expect(stockA1?.quantityTotal).toBe(50);
    expect(stockB1?.quantityTotal).toBe(50);

    // Total should still be 100
    const total = (stockA1?.quantityTotal || 0) + (stockB1?.quantityTotal || 0);
    expect(total).toBe(100);
  });

  it('should handle stock status changes correctly', async () => {
    // Receive 100 units
    const po = await poService.createPurchaseOrder({
      supplierId,
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lineItems: [
        {
          productId,
          quantity: 100,
          unitPrice: 10,
        },
      ],
    });

    await poService.updateStatus(po.id, 'SUBMITTED');

    await receptionService.createReception(
      {
        purchaseOrderId: po.id,
        receivedDate: new Date(),
        receivedBy: 'Manager',
        items: [
          {
            lineItemId: po.lineItems[0].id,
            receivedQuantity: 100,
            locationId: locationA1Id,
          },
        ],
      },
      userId
    );

    // Reserve 30 units
    await movementService.changeStockStatus(
      productId,
      locationA1Id,
      30,
      'AVAILABLE',
      'RESERVED',
      userId,
      'Order #1'
    );

    let stock = await getStockLevel(productId, locationA1Id);
    expect(stock?.quantityAvailable).toBe(70);
    expect(stock?.quantityReserved).toBe(30);
    expect(stock?.quantityDamaged).toBe(0);
    expect(stock?.quantityTotal).toBe(100);

    // Mark 10 units as damaged
    await movementService.changeStockStatus(
      productId,
      locationA1Id,
      10,
      'AVAILABLE',
      'DAMAGED',
      userId,
      'Damaged during handling'
    );

    stock = await getStockLevel(productId, locationA1Id);
    expect(stock?.quantityAvailable).toBe(60);
    expect(stock?.quantityReserved).toBe(30);
    expect(stock?.quantityDamaged).toBe(10);
    expect(stock?.quantityTotal).toBe(100);

    // Release 15 reserved units
    await movementService.changeStockStatus(
      productId,
      locationA1Id,
      15,
      'RESERVED',
      'AVAILABLE',
      userId,
      'Order cancelled'
    );

    stock = await getStockLevel(productId, locationA1Id);
    expect(stock?.quantityAvailable).toBe(75);
    expect(stock?.quantityReserved).toBe(15);
    expect(stock?.quantityDamaged).toBe(10);
    expect(stock?.quantityTotal).toBe(100);

    // Ship reserved units
    await movementService.createMovement({
      type: 'SHIPMENT',
      productId,
      locationId: locationA1Id,
      quantity: -15,
      fromStatus: 'RESERVED',
      toStatus: 'AVAILABLE',
      userId,
      reason: 'Shipped',
    });

    stock = await getStockLevel(productId, locationA1Id);
    expect(stock?.quantityTotal).toBe(85);
    expect(stock?.quantityAvailable).toBe(75);
    expect(stock?.quantityReserved).toBe(0);
    expect(stock?.quantityDamaged).toBe(10);
  });
});
