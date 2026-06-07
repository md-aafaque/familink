"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.AppError = void 0;
const zod_1 = require("zod");
class AppError extends Error {
    constructor(message, statusCode = 400, code, details) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
const handleError = (error, request, reply) => {
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
    if (error instanceof zod_1.ZodError) {
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
exports.handleError = handleError;
