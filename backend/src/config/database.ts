import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

/**
 * Prisma Client instance
 * Singleton pattern to ensure only one instance exists
 */
class DatabaseClient {
  private static instance: PrismaClient | null = null;

  /**
   * Get Prisma Client instance
   */
  static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log: [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
      });

      // Log queries in development
      if (process.env.NODE_ENV === 'development') {
        DatabaseClient.instance.$on('query' as never, (e: any) => {
          logger.debug('Query:', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
          });
        });
      }

      // Log errors
      DatabaseClient.instance.$on('error' as never, (e: any) => {
        logger.error('Database error:', e);
      });

      // Log warnings
      DatabaseClient.instance.$on('warn' as never, (e: any) => {
        logger.warn('Database warning:', e);
      });

      logger.info('✅ Prisma Client initialized');
    }

    return DatabaseClient.instance;
  }

  /**
   * Connect to database
   */
  static async connect(): Promise<void> {
    try {
      const client = DatabaseClient.getInstance();
      await client.$connect();
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  static async disconnect(): Promise<void> {
    try {
      if (DatabaseClient.instance) {
        await DatabaseClient.instance.$disconnect();
        DatabaseClient.instance = null;
        logger.info('✅ Database disconnected successfully');
      }
    } catch (error) {
      logger.error('❌ Failed to disconnect from database:', error);
      throw error;
    }
  }

  /**
   * Health check - verify database connectivity
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const client = DatabaseClient.getInstance();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const prisma = DatabaseClient.getInstance();

// Export utility functions
export const connectDatabase = DatabaseClient.connect;
export const disconnectDatabase = DatabaseClient.disconnect;
export const databaseHealthCheck = DatabaseClient.healthCheck;
