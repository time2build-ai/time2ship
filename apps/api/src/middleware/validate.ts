import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Express middleware factory for validating request data using Zod schemas.
 * Validates body, params, and query against the provided schema.
 * On success, attaches validated data to req.validated.
 * On failure, passes an AppError with 400 status to the error handler.
 *
 * @param schema - Zod schema defining expected structure of body, params, and query
 * @returns Express middleware function
 *
 * @throws {AppError} With status 400 if validation fails
 *
 * @example
 * const loginSchema = z.object({
 *   body: z.object({
 *     email: z.string().email(),
 *     password: z.string().min(8),
 *   }),
 * });
 *
 * router.post('/login', validate(loginSchema), async (req: ValidatedRequest, res) => {
 *   const { email, password } = req.validated.body;
 *   // email and password are now type-safe and validated
 * });
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      }) as {
        body?: any;
        params?: any;
        query?: any;
      };

      req.validated = validated;
      next();
    } catch (error: any) {
      // Pass ZodError directly to error handler for proper formatting
      next(error);
    }
  };
};
