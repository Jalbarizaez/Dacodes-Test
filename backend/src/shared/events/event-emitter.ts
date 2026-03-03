/**
 * Event Emitter for Real-Time Updates
 * 
 * This module provides a centralized event system for emitting
 * real-time updates across the application.
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../../config/logger.js';

/**
 * Event Types
 */
export enum EventType {
  // Stock Events
  STOCK_UPDATED = 'stock:updated',
  STOCK_LOW = 'stock:low',
  
  // Purchase Order Events
  PURCHASE_ORDER_CREATED = 'purchase-order:created',
  PURCHASE_ORDER_RECEIVED = 'purchase-order:received',
  PURCHASE_ORDER_PARTIALLY_RECEIVED = 'purchase-order:partially-received',
  
  // Reception Events
  RECEPTION_CREATED = 'reception:created',
  
  // Movement Events
  MOVEMENT_CREATED = 'movement:created',
  
  // Transfer Events
  TRANSFER_CREATED = 'transfer:created',
  TRANSFER_COMPLETED = 'transfer:completed',
}

/**
 * Event Payloads
 */
export interface StockUpdatedPayload {
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
  change: number;
}

export interface StockLowPayload {
  productId: string;
  productSku: string;
  productName: string;
  minStock: number;
  currentStock: number;
  deficit: number;
}

export interface PurchaseOrderPayload {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: string;
  totalAmount: string;
  orderDate: string;
}

export interface ReceptionPayload {
  id: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  receivedDate: string;
  receivedBy: string;
  itemsCount: number;
}

export interface MovementPayload {
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

export interface TransferPayload {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  status: string;
}

/**
 * Event Payload Map
 */
export type EventPayloadMap = {
  [EventType.STOCK_UPDATED]: StockUpdatedPayload;
  [EventType.STOCK_LOW]: StockLowPayload;
  [EventType.PURCHASE_ORDER_CREATED]: PurchaseOrderPayload;
  [EventType.PURCHASE_ORDER_RECEIVED]: PurchaseOrderPayload;
  [EventType.PURCHASE_ORDER_PARTIALLY_RECEIVED]: PurchaseOrderPayload;
  [EventType.RECEPTION_CREATED]: ReceptionPayload;
  [EventType.MOVEMENT_CREATED]: MovementPayload;
  [EventType.TRANSFER_CREATED]: TransferPayload;
  [EventType.TRANSFER_COMPLETED]: TransferPayload;
};

/**
 * Real-Time Event Emitter
 */
class RealTimeEventEmitter {
  private io: SocketIOServer | null = null;
  private connectedClients = 0;

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HTTPServer): void {
    const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map(origin => origin.trim());

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin
          if (!origin) return callback(null, true);
          
          // Check if origin matches any allowed origin or pattern
          const isAllowed = corsOrigins.some(allowedOrigin => {
            if (allowedOrigin === '*') return true;
            if (allowedOrigin.includes('*')) {
              const pattern = allowedOrigin.replace(/\*/g, '.*');
              return new RegExp(`^${pattern}$`).test(origin);
            }
            return allowedOrigin === origin;
          });
          
          callback(null, isAllowed);
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    logger.info('Real-time event system initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      this.connectedClients++;
      logger.info(`Client connected: ${socket.id} (Total: ${this.connectedClients})`);

      socket.on('disconnect', () => {
        this.connectedClients--;
        logger.info(`Client disconnected: ${socket.id} (Total: ${this.connectedClients})`);
      });

      // Send initial connection confirmation
      socket.emit('connected', {
        message: 'Connected to DaCodes Inventory real-time updates',
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Emit an event to all connected clients
   */
  emit<T extends EventType>(event: T, payload: EventPayloadMap[T]): void {
    if (!this.io) {
      logger.warn('Socket.IO not initialized, event not emitted:', event);
      return;
    }

    try {
      this.io.emit(event, {
        event,
        data: payload,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Event emitted: ${event}`, {
        clientsCount: this.connectedClients,
        payload,
      });
    } catch (error) {
      logger.error('Error emitting event:', error);
    }
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients;
  }
}

// Singleton instance
export const eventEmitter = new RealTimeEventEmitter();
