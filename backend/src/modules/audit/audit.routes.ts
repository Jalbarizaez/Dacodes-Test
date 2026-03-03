import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { validate } from '../../shared/middleware/validation.middleware.js';
import { auditLogFiltersSchema } from './audit.validator.js';
import { asyncHandler } from '../../shared/middleware/error.middleware.js';

const router = Router();
const controller = new AuditController();

/**
 * @route   GET /api/v1/audit/logs
 * @desc    Get all audit logs with filters and pagination
 * @access  Private (future)
 */
router.get('/logs', validate(auditLogFiltersSchema, 'query'), asyncHandler(controller.getAllAuditLogs));

/**
 * @route   GET /api/v1/audit/logs/:id
 * @desc    Get audit log by ID
 * @access  Private (future)
 */
router.get('/logs/:id', asyncHandler(controller.getAuditLogById));

/**
 * @route   GET /api/v1/audit/logs/entity/:entityType/:entityId
 * @desc    Get audit logs by entity
 * @access  Private (future)
 */
router.get('/logs/entity/:entityType/:entityId', asyncHandler(controller.getAuditLogsByEntity));

/**
 * @route   GET /api/v1/audit/logs/user/:userId
 * @desc    Get audit logs by user
 * @access  Private (future)
 */
router.get('/logs/user/:userId', asyncHandler(controller.getAuditLogsByUser));

/**
 * @route   GET /api/v1/audit/statistics
 * @desc    Get audit statistics
 * @access  Private (future)
 */
router.get('/statistics', asyncHandler(controller.getStatistics));

export default router;
