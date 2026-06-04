import { FastifyInstance } from 'fastify';
import { AuditService } from './audit.service';
import { verifyTreeAccess } from '../../middleware/tree-auth';

const adminRoutes = async (fastify: FastifyInstance) => {
  /**
   * Get audit logs for a tree
   * Access: Admin
   */
  fastify.get('/trees/:treeId/audit-logs', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const { treeId } = request.params as { treeId: string };
    const { limit } = request.query as { limit?: string };
    
    const logs = await AuditService.getTreeLogs(treeId, limit ? parseInt(limit) : 50);
    return { success: true, data: logs };
  });
};

export default adminRoutes;
