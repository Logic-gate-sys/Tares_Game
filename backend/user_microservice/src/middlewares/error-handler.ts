import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  if (error.status === 400 || error.status === 401) {
    response.status(error.status).json({ ...error });
    return; 
  }

  // return error to user
  response.status(500).json({error: error})
};
