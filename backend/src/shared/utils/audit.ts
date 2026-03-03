import { AuditAction } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';

/**
 * Audit Helper
 * Provides a simple and extensible way to log audit events
 */

export interface AuditLogData {
  userId?: string; // Optional: for system actions
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValues?: any; // Will be stringified to JSON
  newValues?: any; // Will be stringified to JSON
  ipAddress?: string;
  userAgent?: string;
  description?: string;
}

/**
 * Create an audit log entry
 * This is a fire-and-forget operation that won't block the main flow
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        description: data.description,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit failures shouldn't break the main flow
    logger.error('Failed to create audit log:', error);
  }
}

/**
 * Audit a CREATE action
 */
export async function auditCreate(
  entityType: string,
  entityId: string,
  newValues: any,
  userId?: string,
  description?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'CREATE',
    entityType,
    entityId,
    newValues,
    description: description || `Created ${entityType} ${entityId}`,
  });
}

/**
 * Audit an UPDATE action
 */
export async function auditUpdate(
  entityType: string,
  entityId: string,
  oldValues: any,
  newValues: any,
  userId?: string,
  description?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'UPDATE',
    entityType,
    entityId,
    oldValues,
    newValues,
    description: description || `Updated ${entityType} ${entityId}`,
  });
}

/**
 * Audit a DELETE action
 */
export async function auditDelete(
  entityType: string,
  entityId: string,
  oldValues: any,
  userId?: string,
  description?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'DELETE',
    entityType,
    entityId,
    oldValues,
    description: description || `Deleted ${entityType} ${entityId}`,
  });
}

/**
 * Sanitize sensitive data before logging
 * Remove passwords, tokens, etc.
 */
export function sanitizeForAudit(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'passwordHash', 'token', 'apiKey', 'secret'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Extract only changed fields between old and new values
 * This reduces the size of audit logs
 */
export function extractChangedFields(oldValues: any, newValues: any): { old: any; new: any } {
  if (!oldValues || !newValues) {
    return { old: oldValues, new: newValues };
  }

  const changedOld: any = {};
  const changedNew: any = {};

  for (const key in newValues) {
    if (newValues[key] !== oldValues[key]) {
      changedOld[key] = oldValues[key];
      changedNew[key] = newValues[key];
    }
  }

  return { old: changedOld, new: changedNew };
}

/**
 * Create a summary payload for audit logs
 * This is useful for complex objects where we only want to log key fields
 */
export function createAuditSummary(data: any, fields: string[]): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const summary: any = {};
  for (const field of fields) {
    if (field in data) {
      summary[field] = data[field];
    }
  }

  return summary;
}
