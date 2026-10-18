import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  console.error(error);
  response.status(error.status).json({ error: 'Internal server error' });
  next(); 
};
