"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = routes;
const people_routes_1 = __importDefault(require("../modules/people/people.routes"));
const relationships_routes_1 = __importDefault(require("../modules/relationships/relationships.routes"));
const claim_routes_1 = __importDefault(require("../modules/people/claim.routes"));
const trees_routes_1 = __importDefault(require("../modules/trees/trees.routes"));
const notifications_routes_1 = __importDefault(require("../modules/notifications/notifications.routes"));
const invitations_routes_1 = __importDefault(require("../modules/invitations/invitations.routes"));
const users_routes_1 = __importDefault(require("../modules/users/users.routes"));
const audit_routes_1 = __importDefault(require("../modules/audit/audit.routes"));
async function routes(fastify) {
    // Authentication routes
    await fastify.register(users_routes_1.default);
    // Feature routes
    await fastify.register(people_routes_1.default);
    await fastify.register(relationships_routes_1.default);
    await fastify.register(claim_routes_1.default);
    await fastify.register(trees_routes_1.default);
    await fastify.register(notifications_routes_1.default);
    await fastify.register(invitations_routes_1.default);
    await fastify.register(audit_routes_1.default);
}
