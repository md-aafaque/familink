import { FastifyReply, FastifyRequest } from 'fastify';

export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 400, public code?: string) {
    super(message);
  }
}

export const handleError = (error: any, request: FastifyRequest, reply: FastifyReply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: { message: error.message }
    });
  }

  // Handle Zod errors (validation)
  if (error.name === 'ZodError' || error.validation) {
    return reply.status(400).send({
      success: false,
      error: { message: 'Validation failed' }
    });
  }

  request.log.error({ error }, 'Unhandled Error');
  return reply.status(500).send({
    success: false,
    error: { message: 'Internal server error' }
  });
};
