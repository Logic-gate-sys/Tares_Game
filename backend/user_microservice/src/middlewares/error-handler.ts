import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  response
    .status(error.status)
    .json({ error: 'Internal server error' });
  // move to next middleware in-line
  next(); 
};
