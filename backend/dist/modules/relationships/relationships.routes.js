"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = relationshipsRoutes;
const relationships_1 = require("@shared/schemas/relationships");
const relationships_service_1 = require("./relationships.service");
const tree_auth_1 = require("../../middleware/tree-auth");
const database_1 = require("../../core/database");
const errors_1 = require("../../core/errors");
async function relationshipsRoutes(fastify) {
    /**
     * Get suggested relationships for a person
     */
    fastify.get('/people/:id/suggestions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const session = (0, database_1.getSession)();
        try {
            // Find the person to get their treeId
            const person = await session.run(`MATCH (p:Person {id: $id}) RETURN p.treeId as treeId`, { id });
            if (person.records.length === 0)
                throw new errors_1.AppError('Person not found', 404);
            const treeId = person.records[0].get('treeId');
            const suggestions = await relationships_service_1.RelationshipsService.getSuggestedRelationships(id, treeId);
            return { success: true, data: suggestions };
        }
        finally {
            await session.close();
        }
    });
    /**
     * Propose a new relationship
     * Access: Admin or Member
     */
    fastify.post('/trees/:treeId/relationship-proposals', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin', 'member'])]
    }, async (request, reply) => {
        const user = request.user;
        const body = relationships_1.createProposalSchema.parse({
            ...request.body,
            treeId: request.params.treeId
        });
        const proposal = await relationships_service_1.RelationshipsService.proposeRelationship(body, user.id);
        return { success: true, data: proposal };
    });
    /**
     * Get all pending proposals for a tree
     * Access: Admin
     */
    fastify.get('/trees/:treeId/relationship-proposals', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin'])]
    }, async (request, reply) => {
        const { treeId } = request.params;
        const proposals = await relationships_service_1.RelationshipsService.getPendingProposals(treeId);
        return { success: true, data: proposals };
    });
    /**
     * Approve a proposal
     * Access: Admin
     */
    fastify.post('/trees/:treeId/relationship-proposals/:proposalId/approve', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin'])]
    }, async (request, reply) => {
        const user = request.user;
        const { proposalId } = request.params;
        const result = await relationships_service_1.RelationshipsService.approveProposal(proposalId, user.id);
        return result;
    });
    /**
     * Reject a proposal
     * Access: Admin
     */
    fastify.post('/trees/:treeId/relationship-proposals/:proposalId/reject', {
        preHandler: [fastify.authenticate, (0, tree_auth_1.verifyTreeAccess)(['admin'])]
    }, async (request, reply) => {
        const user = request.user;
        const { proposalId } = request.params;
        const { reason } = relationships_1.rejectProposalSchema.parse(request.body);
        const result = await relationships_service_1.RelationshipsService.rejectProposal(proposalId, reason, user.id);
        return result;
    });
}
