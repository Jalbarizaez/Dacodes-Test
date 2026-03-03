import { Response } from 'express';
import { CategoryService } from './category.service.js';
import { CreateCategoryDTO, UpdateCategoryDTO, CategoryFilters } from './category.types.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { AuthRequest, HttpStatus } from '../../shared/types/index.js';
import { asyncHandler } from '../../shared/middleware/error.middleware.js';

/**
 * Category Controller
 */
export class CategoryController {
  private service: CategoryService;

  constructor() {
    this.service = new CategoryService();
  }

  /**
   * GET /categories
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { parentId, isActive, search } = req.query;

    const filters: CategoryFilters = {
      parentId: parentId === 'null' ? null : (parentId as string),
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
    };

    const categories = await this.service.getAllCategories(filters);
    return sendSuccess(res, categories);
  });

  /**
   * GET /categories/:id
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const category = await this.service.getCategoryById(id);
    return sendSuccess(res, category);
  });

  /**
   * POST /categories
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data: CreateCategoryDTO = req.body;
    const category = await this.service.createCategory(data);
    return sendSuccess(res, category, HttpStatus.CREATED);
  });

  /**
   * PUT /categories/:id
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const data: UpdateCategoryDTO = req.body;
    const category = await this.service.updateCategory(id, data);
    return sendSuccess(res, category);
  });

  /**
   * DELETE /categories/:id
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const category = await this.service.deleteCategory(id);
    return sendSuccess(res, category);
  });
}

export const categoryController = new CategoryController();
