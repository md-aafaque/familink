import { FastifyRequest, FastifyReply } from 'fastify';
import { getSession } from '@/core/database';
import { AppError } from '@/core/errors';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role?: string;
    };
    treeRole?: string;
  }
}

export const verifyTreeAccess = (roles: string[] = ['admin', 'member', 'viewer']) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { treeId } = request.params as { treeId?: string };
    const user = request.user;

    if (!treeId) {
      throw new AppError('treeId is required for this operation', 400);
    }

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[r:MEMBER_OF]->(t:FamilyTree {id: $treeId})
         RETURN r.role as role`,
        { userId: user.id, treeId }
      );

      if (result.records.length === 0) {
        throw new AppError('Access denied: You are not a member of this tree', 403);
      }

      const userRole = result.records[0].get('role');
      
      // Check role hierarchy/required roles
      const roleWeights: { [key: string]: number } = { admin: 3, member: 2, viewer: 1 };
      const minRequiredWeight = Math.min(...roles.map(r => roleWeights[r] || 0));
      const userWeight = roleWeights[userRole] || 0;

      if (userWeight < minRequiredWeight) {
        throw new AppError(`Access denied: Required role level not met. Your role: ${userRole}`, 403);
      }

      // Attach tree role to request for later use
      request.treeRole = userRole;
    } finally {
      await session.close();
    }
  };
};
