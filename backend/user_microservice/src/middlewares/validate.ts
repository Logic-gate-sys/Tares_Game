import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';

export function validateRequestBody(schema: ZodType): RequestHandler {
  return (request: Request, response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      const error = {
        status: 400, // bad request data
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      };
      console.error(error);
      next(error)
    }
    
    request.body = result.data;
    next();
  };
}
