# Real-Time Events System

## Overview

This module provides a real-time event system using Socket.IO for broadcasting inventory updates to connected clients.

## Architecture

```
┌─────────────────┐
│   Service Layer │ (e.g., MovementService, ReceptionService)
└────────┬────────┘
         │ calls
         ▼
┌─────────────────┐
│  Emit Helpers   │ (emitStockUpdated, emitReceptionCreated, etc.)
└────────┬────────┘
         │ uses
         ▼
┌─────────────────┐
│  Event Emitter  │ (Singleton with Socket.IO instance)
└────────┬────────┘
         │ broadcasts
         ▼
┌─────────────────┐
│  WebSocket      │
│  Clients        │
└─────────────────┘
```

## Event Types

### Stock Events
- `stock:updated` - Emitted when stock levels change
- `stock:low` - Emitted when stock falls below minimum threshold

### Purchase Order Events
- `purchase-order:created` - Emitted when a new PO is created
- `purchase-order:received` - Emitted when a PO is fully received
- `purchase-order:partially-received` - Emitted when a PO is partially received

### Reception Events
- `reception:created` - Emitted when a reception is registered

### Movement Events
- `movement:created` - Emitted when a stock movement is recorded

### Transfer Events
- `transfer:created` - Emitted when a transfer is created
- `transfer:completed` - Emitted when a transfer is completed

## Usage

### 1. Initialize in Server

```typescript
// In your main server file (e.g., index.ts)
import { eventEmitter } from './shared/events/event-emitter.js';

const httpServer = createServer(app);
eventEmitter.initialize(httpServer);

httpServer.listen(port, () => {
  console.log('Server started with real-time events');
});
```

### 2. Emit Events from Services

```typescript
import { emitStockUpdated, emitStockLow } from '../shared/events/emit-helper.js';

// In your service method
async updateStock(productId: string, quantity: number) {
  // ... your business logic ...
  
  // Emit real-time event
  emitStockUpdated({
    productId: stock.productId,
    productSku: product.sku,
    productName: product.name,
    locationId: stock.locationId,
    locationCode: location.code,
    warehouseId: location.warehouseId,
    warehouseName: warehouse.name,
    quantityAvailable: stock.quantityAvailable,
    quantityReserved: stock.quantityReserved,
    quantityDamaged: stock.quantityDamaged,
    quantityTotal: stock.quantityTotal,
    change: quantity,
  });
  
  // Check for low stock
  if (stock.quantityAvailable < product.minStock) {
    emitStockLow({
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      minStock: product.minStock,
      currentStock: stock.quantityAvailable,
      deficit: product.minStock - stock.quantityAvailable,
    });
  }
}
```

### 3. Available Emit Functions

```typescript
// Stock
emitStockUpdated(payload: StockUpdatedPayload)
emitStockLow(payload: StockLowPayload)

// Purchase Orders
emitPurchaseOrderCreated(payload: PurchaseOrderPayload)
emitPurchaseOrderReceived(payload: PurchaseOrderPayload)
emitPurchaseOrderPartiallyReceived(payload: PurchaseOrderPayload)

// Receptions
emitReceptionCreated(payload: ReceptionPayload)

// Movements
emitMovementCreated(payload: MovementPayload)

// Transfers
emitTransferCreated(payload: TransferPayload)
emitTransferCompleted(payload: TransferPayload)
```

## Event Payload Structures

### StockUpdatedPayload
```typescript
{
  productId: string;
  productSku: string;
  productName: string;
  locationId: string;
  locationCode: string;
  warehouseId: string;
  warehouseName: string;
  quantityAvailable: number;
  quantityReserved: number;
  quantityDamaged: number;
  quantityTotal: number;
  change: number; // Positive for increase, negative for decrease
}
```

### StockLowPayload
```typescript
{
  productId: string;
  productSku: string;
  productName: string;
  minStock: number;
  currentStock: number;
  deficit: number;
}
```

### PurchaseOrderPayload
```typescript
{
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: string;
  totalAmount: string;
  orderDate: string;
}
```

### ReceptionPayload
```typescript
{
  id: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  receivedDate: string;
  receivedBy: string;
  itemsCount: number;
}
```

### MovementPayload
```typescript
{
  id: string;
  type: string;
  productId: string;
  productSku: string;
  productName: string;
  locationId: string;
  locationCode: string;
  quantity: number;
  date: string;
}
```

### TransferPayload
```typescript
{
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  status: string;
}
```

## Best Practices

### 1. Fire-and-Forget Pattern
Events are emitted asynchronously and should not block the main business logic:

```typescript
// ✅ Good - Non-blocking
async createMovement(data: CreateMovementDTO) {
  const movement = await this.repository.create(data);
  
  // Emit event (fire-and-forget)
  emitMovementCreated({
    id: movement.id,
    type: movement.type,
    // ... other fields
  });
  
  return movement;
}

// ❌ Bad - Waiting for event emission
async createMovement(data: CreateMovementDTO) {
  const movement = await this.repository.create(data);
  await emitMovementCreated(data); // Don't await!
  return movement;
}
```

### 2. Error Handling
All emit functions have built-in error handling. Errors are logged but don't throw:

```typescript
// No need for try-catch around emit functions
emitStockUpdated(payload); // Safe to call
```

### 3. Conditional Emission
Only emit events when necessary:

```typescript
// Check conditions before emitting
if (stock.quantityAvailable < product.minStock) {
  emitStockLow(payload);
}
```

### 4. Payload Construction
Keep payloads lean but informative:

```typescript
// ✅ Good - Essential information
emitStockUpdated({
  productId: product.id,
  productSku: product.sku,
  productName: product.name,
  // ... essential fields
});

// ❌ Bad - Too much data
emitStockUpdated({
  ...product, // Don't send entire objects
  ...stock,
  ...location,
});
```

## Configuration

### Environment Variables

```env
# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

### Socket.IO Options

The event emitter is configured with:
- CORS enabled for frontend URL
- WebSocket and polling transports
- Automatic reconnection
- Connection logging

## Monitoring

### Get Connected Clients Count

```typescript
import { eventEmitter } from './shared/events/event-emitter.js';

const count = eventEmitter.getConnectedClientsCount();
console.log(`Connected clients: ${count}`);
```

### Logs

All events are logged with debug level:
- Client connections/disconnections
- Event emissions
- Error conditions

## Testing

### Manual Testing with Socket.IO Client

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connected', (data) => {
  console.log('Connected:', data);
});

socket.on('stock:updated', (event) => {
  console.log('Stock updated:', event);
});

socket.on('stock:low', (event) => {
  console.log('Low stock alert:', event);
});
```

### Integration Testing

```typescript
// In your tests
import { eventEmitter } from './shared/events/event-emitter.js';

describe('Real-time events', () => {
  it('should emit stock updated event', async () => {
    const spy = jest.spyOn(eventEmitter, 'emit');
    
    await movementService.create(data);
    
    expect(spy).toHaveBeenCalledWith(
      EventType.STOCK_UPDATED,
      expect.objectContaining({
        productId: expect.any(String),
        change: expect.any(Number),
      })
    );
  });
});
```

## Troubleshooting

### Events Not Received on Frontend

1. Check Socket.IO connection:
   ```javascript
   socket.on('connect', () => console.log('Connected'));
   socket.on('disconnect', () => console.log('Disconnected'));
   ```

2. Verify CORS configuration in `event-emitter.ts`

3. Check browser console for WebSocket errors

### High Memory Usage

1. Monitor connected clients count
2. Ensure clients properly disconnect
3. Consider implementing room-based broadcasting for large deployments

### Event Delays

1. Check network latency
2. Verify server is not overloaded
3. Consider using Redis adapter for horizontal scaling

## Future Enhancements

- [ ] Room-based broadcasting (per warehouse, per user)
- [ ] Event history/replay
- [ ] Redis adapter for multi-server deployments
- [ ] Authentication/authorization for WebSocket connections
- [ ] Rate limiting for event emissions
- [ ] Event aggregation for high-frequency updates
