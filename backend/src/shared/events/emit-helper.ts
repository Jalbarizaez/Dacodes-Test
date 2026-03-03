/**
 * Event Emission Helper
 * 
 * Provides convenient functions to emit real-time events
 * from anywhere in the application.
 */

import { eventEmitter, EventType } from './event-emitter.js';
import type {
  StockUpdatedPayload,
  StockLowPayload,
  PurchaseOrderPayload,
  ReceptionPayload,
  MovementPayload,
  TransferPayload,
} from './event-emitter.js';
import { logger } from '../../config/logger.js';

/**
 * Emit stock updated event
 */
export function emitStockUpdated(payload: StockUpdatedPayload): void {
  try {
    eventEmitter.emit(EventType.STOCK_UPDATED, payload);
  } catch (error) {
    logger.error('Error emitting stock updated event:', error);
  }
}

/**
 * Emit low stock alert event
 */
export function emitStockLow(payload: StockLowPayload): void {
  try {
    eventEmitter.emit(EventType.STOCK_LOW, payload);
  } catch (error) {
    logger.error('Error emitting stock low event:', error);
  }
}

/**
 * Emit purchase order created event
 */
export function emitPurchaseOrderCreated(payload: PurchaseOrderPayload): void {
  try {
    eventEmitter.emit(EventType.PURCHASE_ORDER_CREATED, payload);
  } catch (error) {
    logger.error('Error emitting purchase order created event:', error);
  }
}

/**
 * Emit purchase order received event
 */
export function emitPurchaseOrderReceived(payload: PurchaseOrderPayload): void {
  try {
    eventEmitter.emit(EventType.PURCHASE_ORDER_RECEIVED, payload);
  } catch (error) {
    logger.error('Error emitting purchase order received event:', error);
  }
}

/**
 * Emit purchase order partially received event
 */
export function emitPurchaseOrderPartiallyReceived(payload: PurchaseOrderPayload): void {
  try {
    eventEmitter.emit(EventType.PURCHASE_ORDER_PARTIALLY_RECEIVED, payload);
  } catch (error) {
    logger.error('Error emitting purchase order partially received event:', error);
  }
}

/**
 * Emit reception created event
 */
export function emitReceptionCreated(payload: ReceptionPayload): void {
  try {
    eventEmitter.emit(EventType.RECEPTION_CREATED, payload);
  } catch (error) {
    logger.error('Error emitting reception created event:', error);
  }
}

/**
 * Emit movement created event
 */
export function emitMovementCreated(payload: MovementPayload): void {
  try {
    eventEmitter.emit(EventType.MOVEMENT_CREATED, payload);
  } catch (error) {
    logger.error('Error emitting movement created event:', error);
  }
}

/**
 * Emit transfer created event
 */
export function emitTransferCreated(payload: TransferPayload): void {
  try {
    eventEmitter.emit(EventType.TRANSFER_CREATED, payload);
  } catch (error) {
    logger.error('Error emitting transfer created event:', error);
  }
}

/**
 * Emit transfer completed event
 */
export function emitTransferCompleted(payload: TransferPayload): void {
  try {
    eventEmitter.emit(EventType.TRANSFER_COMPLETED, payload);
  } catch (error) {
    logger.error('Error emitting transfer completed event:', error);
  }
}
