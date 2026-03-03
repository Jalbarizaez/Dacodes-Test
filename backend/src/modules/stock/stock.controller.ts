import { Response } from 'express';
import { StockService } from './stock.service.js';
import { AuthRequest } from '../../shared/types/index.js';
import { sendSuccess, calculatePagination } from '../../shared/utils/response.js';
import { HttpStatus } from '../../shared/types/index.js';
import { StockFilters, StockResponse } from './stock.types.js';

/**
 * Stock Controller
 * Handles HTTP requests for stock operations
 */
export class StockController {
  private service: StockService;

  constructor() {
    this.service = new StockService();
  }

  /**
   * GET /api/v1/stock
   * Get all stock levels with filters and pagination
   */
  async getAllStockLevels(req: AuthRequest, res: Response): Promise<Response> {
    const {
      page = 1,
      pageSize = 20,
      productId,
      warehouseId,
      locationId,
      hasStock,
      lowStock,
      sortBy = 'productName',
      sortOrder = 'asc',
    } = req.query as any;

    const filters: StockFilters = {
      productId,
      warehouseId,
      locationId,
      hasStock,
      lowStock,
    };

    const { stockLevels, total } = await this.service.getAllStockLevels(
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    const stockResponses = stockLevels.map((sl) => this.toStockResponse(sl));
    const meta = calculatePagination(total, page, pageSize);

    return sendSuccess(res, stockResponses, HttpStatus.OK, meta);
  }

  /**
   * GET /api/v1/stock/product/:productId
   * Get consolidated stock by product
   */
  async getStockByProduct(req: AuthRequest, res: Response): Promise<Response> {
    const { productId } = req.params;
    const consolidatedStock = await this.service.getConsolidatedStockByProduct(productId);

    return sendSuccess(res, consolidatedStock);
  }

  /**
   * GET /api/v1/stock/warehouse/:warehouseId
   * Get consolidated stock by warehouse
   */
  async getStockByWarehouse(req: AuthRequest, res: Response): Promise<Response> {
    const { warehouseId } = req.params;
    const consolidatedStock = await this.service.getConsolidatedStockByWarehouse(warehouseId);

    return sendSuccess(res, consolidatedStock);
  }

  /**
   * GET /api/v1/stock/location/:locationId
   * Get consolidated stock by location
   */
  async getStockByLocation(req: AuthRequest, res: Response): Promise<Response> {
    const { locationId } = req.params;
    const consolidatedStock = await this.service.getConsolidatedStockByLocation(locationId);

    return sendSuccess(res, consolidatedStock);
  }

  /**
   * GET /api/v1/stock/alerts/low-stock
   * Get low stock alerts
   */
  async getLowStockAlerts(_req: AuthRequest, res: Response): Promise<Response> {
    const alerts = await this.service.getLowStockAlerts();

    return sendSuccess(res, alerts);
  }

  /**
   * Transform stock level to response format
   */
  private toStockResponse(stockLevel: any): StockResponse {
    return {
      id: stockLevel.id,
      productId: stockLevel.productId,
      productSku: stockLevel.product?.sku,
      productName: stockLevel.product?.name,
      locationId: stockLevel.locationId,
      locationCode: stockLevel.location?.code,
      locationName: stockLevel.location?.name,
      warehouseId: stockLevel.location?.warehouse.id,
      warehouseName: stockLevel.location?.warehouse.name,
      quantityAvailable: stockLevel.quantityAvailable,
      quantityReserved: stockLevel.quantityReserved,
      quantityDamaged: stockLevel.quantityDamaged,
      quantityTotal: stockLevel.quantityTotal,
      lastCountDate: stockLevel.lastCountDate,
      updatedAt: stockLevel.updatedAt,
    };
  }
}
