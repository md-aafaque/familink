import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public message: string, 
    public statusCode: number = 400, 
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: any, request: FastifyRequest, reply: FastifyReply) => {
  // Handle AppError
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: { 
        message: error.message,
        code: error.code,
        details: error.details
      }
    });
  }

  // Handle Zod Validation Errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      }
    });
  }

  // Handle Fastify Validation Errors (if any)
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.validation
      }
    });
  }

  // Database Errors (Neo4j)
  if (error.code?.startsWith('Neo.ClientError')) {
    request.log.warn({ error }, 'Neo4j Client Error');
    return reply.status(400).send({
      success: false,
      error: {
        message: 'Database operation failed',
        code: 'DATABASE_ERROR'
      }
    });
  }

  // Log unhandled errors
  request.log.error({ 
    err: error,
    url: request.url,
    method: request.method,
    body: request.body,
    params: request.params
  }, 'Unhandled Server Error');

  return reply.status(500).send({
    success: false,
    error: { 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
};
