/**
 * Real-Time Events Hooks
 * 
 * Provides React hooks for subscribing to real-time events
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  websocketManager,
  EventType,
} from '../services/websocket';
import type {
  EventWrapper,
  StockUpdatedPayload,
  StockLowPayload,
  PurchaseOrderPayload,
  ReceptionPayload,
  MovementPayload,
  TransferPayload,
} from '../services/websocket';

/**
 * Generic hook for subscribing to real-time events
 */
export function useRealTimeEvent<T>(
  event: EventType,
  handler: (data: EventWrapper<T>) => void
): void {
  const handlerRef = useRef(handler);

  // Update handler ref when it changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // Ensure WebSocket is connected
    websocketManager.connect();

    // Subscribe to event
    const unsubscribe = websocketManager.on<T>(event, (data) => {
      handlerRef.current(data);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [event]);
}

/**
 * Hook for stock updated events
 */
export function useStockUpdated(
  handler: (data: EventWrapper<StockUpdatedPayload>) => void
): void {
  useRealTimeEvent(EventType.STOCK_UPDATED, handler);
}

/**
 * Hook for low stock alerts
 */
export function useStockLow(
  handler: (data: EventWrapper<StockLowPayload>) => void
): void {
  useRealTimeEvent(EventType.STOCK_LOW, handler);
}

/**
 * Hook for purchase order created events
 */
export function usePurchaseOrderCreated(
  handler: (data: EventWrapper<PurchaseOrderPayload>) => void
): void {
  useRealTimeEvent(EventType.PURCHASE_ORDER_CREATED, handler);
}

/**
 * Hook for purchase order received events
 */
export function usePurchaseOrderReceived(
  handler: (data: EventWrapper<PurchaseOrderPayload>) => void
): void {
  useRealTimeEvent(EventType.PURCHASE_ORDER_RECEIVED, handler);
}

/**
 * Hook for purchase order partially received events
 */
export function usePurchaseOrderPartiallyReceived(
  handler: (data: EventWrapper<PurchaseOrderPayload>) => void
): void {
  useRealTimeEvent(EventType.PURCHASE_ORDER_PARTIALLY_RECEIVED, handler);
}

/**
 * Hook for reception created events
 */
export function useReceptionCreated(
  handler: (data: EventWrapper<ReceptionPayload>) => void
): void {
  useRealTimeEvent(EventType.RECEPTION_CREATED, handler);
}

/**
 * Hook for movement created events
 */
export function useMovementCreated(
  handler: (data: EventWrapper<MovementPayload>) => void
): void {
  useRealTimeEvent(EventType.MOVEMENT_CREATED, handler);
}

/**
 * Hook for transfer created events
 */
export function useTransferCreated(
  handler: (data: EventWrapper<TransferPayload>) => void
): void {
  useRealTimeEvent(EventType.TRANSFER_CREATED, handler);
}

/**
 * Hook for transfer completed events
 */
export function useTransferCompleted(
  handler: (data: EventWrapper<TransferPayload>) => void
): void {
  useRealTimeEvent(EventType.TRANSFER_COMPLETED, handler);
}

/**
 * Hook for multiple events with a single handler
 */
export function useMultipleEvents<T>(
  events: EventType[],
  handler: (event: EventType, data: EventWrapper<T>) => void
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    websocketManager.connect();

    const unsubscribers = events.map((event) =>
      websocketManager.on<T>(event, (data) => {
        handlerRef.current(event, data);
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [events.join(',')]);
}

/**
 * Hook to check WebSocket connection status
 */
export function useWebSocketStatus(): {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
} {
  const connect = useCallback(() => {
    websocketManager.connect();
  }, []);

  const disconnect = useCallback(() => {
    websocketManager.disconnect();
  }, []);

  return {
    isConnected: websocketManager.isConnected(),
    connect,
    disconnect,
  };
}
