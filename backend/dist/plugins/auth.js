"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const supabase_1 = require("../core/supabase");
const errors_1 = require("../core/errors");
exports.default = (0, fastify_plugin_1.default)(async (fastify) => {
    fastify.decorate('authenticate', async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new errors_1.AppError('Unauthorized', 401);
        }
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            fastify.log.warn({ error }, '[AUTH] Supabase token validation failed');
            throw new errors_1.AppError('Invalid or expired token', 401);
        }
        request.user = { id: user.id, email: user.email };
    });
});
