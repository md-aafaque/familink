"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const auth_1 = __importDefault(require("./plugins/auth"));
const config_1 = require("./core/config");
const errors_1 = require("./core/errors");
// Modular Route Imports
const people_routes_1 = __importDefault(require("./modules/people/people.routes"));
const trees_routes_1 = __importDefault(require("./modules/trees/trees.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const invitations_routes_1 = __importDefault(require("./modules/invitations/invitations.routes"));
const notifications_routes_1 = __importDefault(require("./modules/notifications/notifications.routes"));
const claim_routes_1 = __importDefault(require("./modules/people/claim.routes"));
const relationships_routes_1 = __importDefault(require("./modules/relationships/relationships.routes"));
const audit_routes_1 = __importDefault(require("./modules/audit/audit.routes"));
const server = (0, fastify_1.default)({
    logger: true,
});
async function start() {
    // Error Handler
    server.setErrorHandler(errors_1.handleError);
    // Plugins
    await server.register(cors_1.default, {
        origin: config_1.config.FRONTEND_URL,
        credentials: true
    });
    await server.register(auth_1.default);
    // Feature Routes (Modular Monolith Style)
    await server.register(async (api) => {
        await api.register(users_routes_1.default);
        await api.register(people_routes_1.default);
        await api.register(trees_routes_1.default);
        await api.register(notifications_routes_1.default);
        await api.register(invitations_routes_1.default);
        await api.register(claim_routes_1.default);
        await api.register(relationships_routes_1.default);
        await api.register(audit_routes_1.default);
    }, { prefix: '/api' });
    // Health check
    server.get('/health', async () => ({ status: 'ok' }));
    try {
        const port = parseInt(config_1.config.PORT, 10);
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`Server ready at http://localhost:${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
start();
