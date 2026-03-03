/**
 * WebSocket Service
 * 
 * Provides real-time communication with the backend using Socket.IO
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

/**
 * Event Types (must match backend)
 */
export const EventType = {
  // Stock Events
  STOCK_UPDATED: 'stock:updated',
  STOCK_LOW: 'stock:low',
  
  // Purchase Order Events
  PURCHASE_ORDER_CREATED: 'purchase-order:created',
  PURCHASE_ORDER_RECEIVED: 'purchase-order:received',
  PURCHASE_ORDER_PARTIALLY_RECEIVED: 'purchase-order:partially-received',
  
  // Reception Events
  RECEPTION_CREATED: 'reception:created',
  
  // Movement Events
  MOVEMENT_CREATED: 'movement:created',
  
  // Transfer Events
  TRANSFER_CREATED: 'transfer:created',
  TRANSFER_COMPLETED: 'transfer:completed',
} as const;

export type EventType = typeof EventType[keyof typeof EventType];

/**
 * Event Payloads (must match backend)
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
 * Event wrapper with metadata
 */
export interface EventWrapper<T> {
  event: EventType;
  data: T;
  timestamp: string;
}

/**
 * Event handler type
 */
export type EventHandler<T> = (data: EventWrapper<T>) => void;

/**
 * WebSocket Manager
 */
class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  /**
   * Connect to WebSocket server
   */
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return this.socket!;
    }

    this.isConnecting = true;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupConnectionHandlers();
    this.isConnecting = false;

    return this.socket;
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('connected', (data) => {
      console.log('WebSocket server message:', data);
    });
  }

  /**
   * Subscribe to an event
   */
  on<T>(event: EventType, handler: EventHandler<T>): () => void {
    if (!this.socket) {
      this.connect();
    }

    this.socket!.on(event, handler);

    // Return unsubscribe function
    return () => {
      this.socket?.off(event, handler);
    };
  }

  /**
   * Unsubscribe from an event
   */
  off<T>(event: EventType, handler?: EventHandler<T>): void {
    if (handler) {
      this.socket?.off(event, handler);
    } else {
      this.socket?.off(event);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
export const websocketManager = new WebSocketManager();

// Auto-connect on module load
if (typeof window !== 'undefined') {
  websocketManager.connect();
}
