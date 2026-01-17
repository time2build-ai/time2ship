// src/common/helpers/pagination.ts
import { PaginationMeta } from './response';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

/**
 * Utility class for handling pagination logic.
 * Supports offset-based pagination with configurable defaults.
 */
export class PaginationHelper {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 100;

  /**
   * Parse and validate pagination parameters from query string.
   * Ensures page and limit are valid numbers within acceptable ranges.
   *
   * @param params - Pagination parameters from query string
   * @param options - Optional configuration for defaults and limits
   * @returns Validated pagination values and calculated offset
   *
   * @example
   * const { page, limit, offset } = PaginationHelper.parseParams({ page: 2, limit: 10 });
   * // Returns: { page: 2, limit: 10, offset: 10 }
   */
  static parseParams(
    params: PaginationParams,
    options?: PaginationOptions
  ): { page: number; limit: number; offset: number } {
    const defaultLimit = options?.defaultLimit || this.DEFAULT_LIMIT;
    const maxLimit = options?.maxLimit || this.MAX_LIMIT;

    // Parse and validate page (minimum 1)
    let page = Math.max(1, Number(params.page) || 1);

    // Parse and validate limit (minimum 1, maximum maxLimit)
    let limit = Math.max(1, Number(params.limit) || defaultLimit);
    limit = Math.min(limit, maxLimit);

    // Calculate offset for database queries
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Build pagination metadata for response.
   * Calculates total pages based on total count and limit.
   *
   * @param page - Current page number
   * @param limit - Items per page
   * @param total - Total number of items
   * @returns Pagination metadata object
   *
   * @example
   * const meta = PaginationHelper.buildMeta(2, 20, 150);
   * // Returns: { page: 2, limit: 20, total: 150, totalPages: 8 }
   */
  static buildMeta(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
    };
  }
}
