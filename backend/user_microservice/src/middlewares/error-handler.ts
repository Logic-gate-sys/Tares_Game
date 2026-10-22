import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  if (error.status === 400) {
    response.status(error.status).json({ ...error });
    return; 
  }
  // move to next middleware in-line
  response.status(500).json({
    error: 'Internal Server Error'
  })
};
