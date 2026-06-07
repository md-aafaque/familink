"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTreeAccess = void 0;
const errors_1 = require("../core/errors");
const trees_repository_1 = require("../modules/trees/trees.repository");
const verifyTreeAccess = (roles = ['admin', 'member', 'viewer']) => {
    return async (request, reply) => {
        const { treeId } = request.params || {};
        const user = request.user;
        if (!treeId) {
            throw new errors_1.AppError('treeId is required for this operation', 400);
        }
        if (!user) {
            throw new errors_1.AppError('Authentication required', 401);
        }
        const userRole = await trees_repository_1.TreesRepository.getUserRole(treeId, user.id);
        if (!userRole) {
            throw new errors_1.AppError('Access denied: You are not a member of this tree', 403);
        }
        // Check role hierarchy/required roles
        const roleWeights = { admin: 3, member: 2, viewer: 1 };
        const minRequiredWeight = Math.min(...roles.map(r => roleWeights[r] || 0));
        const userWeight = roleWeights[userRole] || 0;
        if (userWeight < minRequiredWeight) {
            throw new errors_1.AppError(`Access denied: Required role level not met. Your role: ${userRole}`, 403);
        }
        // Attach tree role to request for later use
        request.treeRole = userRole;
    };
};
exports.verifyTreeAccess = verifyTreeAccess;
