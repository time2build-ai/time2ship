import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

interface ExampleData {
  id: number;
  name: string;
  createdAt: string;
}

// GET /api/example
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const response: ApiResponse<ExampleData[]> = {
      success: true,
      data: [
        {
          id: 1,
          name: 'Example Item 1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Example Item 2',
          createdAt: new Date().toISOString(),
        },
      ],
      message: 'Examples retrieved successfully',
    };

    res.json(response);
  })
);

// GET /api/example/:id
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('Invalid ID parameter', 400);
    }

    const response: ApiResponse<ExampleData> = {
      success: true,
      data: {
        id: Number(id),
        name: `Example Item ${id}`,
        createdAt: new Date().toISOString(),
      },
      message: 'Example retrieved successfully',
    };

    res.json(response);
  })
);

// POST /api/example
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name) {
      throw new AppError('Name is required', 400);
    }

    const response: ApiResponse<ExampleData> = {
      success: true,
      data: {
        id: Date.now(),
        name,
        createdAt: new Date().toISOString(),
      },
      message: 'Example created successfully',
    };

    res.status(201).json(response);
  })
);

export default router;
