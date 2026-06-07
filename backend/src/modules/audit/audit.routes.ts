import { FastifyInstance } from 'fastify';
import { AuditService } from './audit.service';
import { verifyTreeAccess } from '../../middleware/tree-auth';
import { z } from 'zod';

const treeIdParamSchema = z.object({
  treeId: z.string().uuid()
});

const auditQuerySchema = z.object({
  limit: z.string().optional()
});

const adminRoutes = async (fastify: FastifyInstance) => {
  /**
   * Get audit logs for a tree
   * Access: Admin
   */
  fastify.get('/trees/:treeId/audit-logs', {
    preHandler: [fastify.authenticate, verifyTreeAccess(['admin'])]
  }, async (request, reply) => {
    const { treeId } = treeIdParamSchema.parse(request.params);
    const { limit } = auditQuerySchema.parse(request.query);
    
    const logs = await AuditService.getTreeLogs(treeId, limit ? parseInt(limit) : 50);
    return { success: true, data: logs };
  });
};

export default adminRoutes;
