"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreesService = void 0;
const trees_repository_1 = require("./trees.repository");
const audit_service_1 = require("../audit/audit.service");
const errors_1 = require("../../core/errors");
class TreesService {
    static async createTree(name, userId, userEmail, userName) {
        const tree = await trees_repository_1.TreesRepository.create(name, userId, userEmail, userName);
        await audit_service_1.AuditService.log(tree.id, userId, 'tree_created', 'FamilyTree', tree.id, { name });
        return tree;
    }
    static async getUserTrees(userId) {
        return trees_repository_1.TreesRepository.findByUserId(userId);
    }
    static async getTreeDetails(treeId) {
        const tree = await trees_repository_1.TreesRepository.findById(treeId);
        if (!tree)
            throw new errors_1.AppError('Tree not found', 404);
        return tree;
    }
    static async getVisualData(treeId) {
        return trees_repository_1.TreesRepository.getVisualData(treeId);
    }
    static async getMembers(treeId) {
        return trees_repository_1.TreesRepository.getMembers(treeId);
    }
}
exports.TreesService = TreesService;
