import { FastifyInstance } from 'fastify'
import { getSession } from '../db'
import { createNotification } from './notifications'

type AuthRequest = {
  user: {
    id: string
    email?: string
  }
}

export default async function adminRoutes(fastify: FastifyInstance) {

  // Combined auth + admin check middleware
  const requireAdmin = async (request: any, reply: any) => {
    // Check auth first
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' })
    }

    // Check admin status
    const session = getSession()
    try {
      const result = await session.run(
        `MATCH (u:User {id: $id}) RETURN u.role as role`,
        { id: request.user.id }
      )

      if (!result.records.length || result.records[0].get('role') !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' })
      }

    } finally {
      await session.close()
    }
  }

  fastify.get(
    '/admin/pending-users',
    { preHandler: requireAdmin },
    async (request, reply) => {

      const session = getSession()
      try {
        const result = await session.run(
          `MATCH (u:User {status: 'pending'}) RETURN u ORDER BY u.createdAt DESC`
        )

        const users = result.records.map(r => r.get('u').properties)
        return reply.send(users)

      } finally {
        await session.close()
      }
    }
  )

  fastify.post(
    '/admin/approve-user',
    { preHandler: requireAdmin },
    async (request: any, reply) => {

      const { userId } = request.body
      const adminId = request.user.id

      if (!userId) {
        return reply.status(400).send({ error: 'userId required' })
      }

      const session = getSession()
      try {
        // Check if user exists
        const check = await session.run(
          `MATCH (u:User {id: $userId}) RETURN u`,
          { userId }
        )

        if (!check.records.length) {
          return reply.status(404).send({ error: 'User not found' })
        }

        await session.run(
          `
          MATCH (u:User {id: $userId})
          SET u.status = 'approved',
              u.approvedAt = timestamp(),
              u.approvedBy = $adminId
          `,
          { userId, adminId }
        )

        // Notify user of approval
        await createNotification(
          userId,
          'relationship_approved',
          'Account Approved',
          `Your account has been approved! You can now log in and access the family tree.`,
          { userId }
        )

        return reply.send({ message: 'User approved successfully' })

      } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Approval failed' })
      } finally {
        await session.close()
      }
    }
  )

  fastify.post(
    '/admin/reject-user',
    { preHandler: requireAdmin },
    async (request: any, reply) => {

      const { userId, reason } = request.body
      const adminId = request.user.id

      if (!userId) {
        return reply.status(400).send({ error: 'userId required' })
      }

      const session = getSession()
      try {
        // Check if user exists
        const check = await session.run(
          `MATCH (u:User {id: $userId}) RETURN u`,
          { userId }
        )

        if (!check.records.length) {
          return reply.status(404).send({ error: 'User not found' })
        }

        await session.run(
          `
          MATCH (u:User {id: $userId})
          SET u.status = 'rejected',
              u.rejectionReason = $reason,
              u.rejectedAt = timestamp(),
              u.rejectedBy = $adminId
          `,
          {
            userId,
            reason: reason || '',
            adminId
          }
        )

        // Notify user of rejection
        await createNotification(
          userId,
          'relationship_rejected',
          'Account Rejected',
          `Your account has been rejected${reason ? ': ' + reason : ''}. Please contact support for more information.`,
          { userId, reason: reason || '' }
        )

        return reply.send({ message: 'User rejected successfully' })

      } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Rejection failed' })
      } finally {
        await session.close()
      }
    }
  )

  fastify.get(
    '/admin/all-users',
    { preHandler: requireAdmin },
    async (request, reply) => {

      const session = getSession()
      try {
        const result = await session.run(
          `MATCH (u:User) RETURN u ORDER BY u.createdAt DESC`
        )

        const users = result.records.map(r => r.get('u').properties)
        return reply.send(users)

      } finally {
        await session.close()
      }
    }
  )

  // Pending Relationships Endpoints
  fastify.get(
    '/admin/pending-relationships',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const session = getSession()
      try {
        const result = await session.run(
          `MATCH (pr:PendingRelationship {status: 'pending'})
           OPTIONAL MATCH (p1:Person {id: pr.fromPersonId})
           OPTIONAL MATCH (p2:Person {id: pr.toPersonId})
           RETURN pr, p1, p2 ORDER BY pr.createdAt DESC`
        )

        const requests = result.records.map(r => ({
          request: r.get('pr').properties,
          fromPerson: r.get('p1')?.properties,
          toPerson: r.get('p2')?.properties
        }))
        return reply.send(requests)

      } finally {
        await session.close()
      }
    }
  )

  fastify.post(
    '/admin/approve-relationship',
    { preHandler: requireAdmin },
    async (request: any, reply) => {
      const { requestId } = request.body
      const adminId = request.user.id

      if (!requestId) {
        return reply.status(400).send({ error: 'requestId required' })
      }

      const session = getSession()
      try {
        // Get pending relationship
        const pendingRes = await session.run(
          `MATCH (pr:PendingRelationship {id: $id}) RETURN pr`,
          { id: requestId }
        )

        if (!pendingRes.records.length) {
          return reply.status(404).send({ error: 'Request not found' })
        }

        const pending = pendingRes.records[0].get('pr').properties
        const { fromPersonId, toPersonId, type, requestedBy, creatorFrom, creatorTo } = pending

        // Create the actual relationship
        await session.run(
          `MATCH (a:Person {id: $from}), (b:Person {id: $to})
           CREATE (a)-[r:${type} {status: 'approved', createdAt: timestamp(), createdBy: $adminId, approvedBy: $adminId}]->(b)
           WITH a, b, r
           MATCH (pr:PendingRelationship {id: $requestId})
           SET pr.status = 'approved', pr.approvedAt = timestamp(), pr.approvedBy = $adminId`,
          { from: fromPersonId, to: toPersonId, adminId, requestId }
        )

        // Notify the user who requested the relationship
        await createNotification(
          requestedBy,
          'relationship_approved',
          'Relationship Approved',
          `Your relationship request between two family members has been approved by an admin.`,
          { requestId, fromPersonId, toPersonId, type }
        )

        // Notify the other creator (if different)
        if (creatorFrom !== requestedBy) {
          await createNotification(
            creatorFrom,
            'relationship_approved',
            'Relationship Approved',
            `A relationship involving your family member has been approved.`,
            { requestId, fromPersonId, toPersonId, type }
          )
        }

        if (creatorTo !== requestedBy) {
          await createNotification(
            creatorTo,
            'relationship_approved',
            'Relationship Approved',
            `A relationship involving your family member has been approved.`,
            { requestId, fromPersonId, toPersonId, type }
          )
        }

        return reply.send({ message: 'Relationship approved' })

      } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Approval failed' })
      } finally {
        await session.close()
      }
    }
  )

  fastify.post(
    '/admin/reject-relationship',
    { preHandler: requireAdmin },
    async (request: any, reply) => {
      const { requestId, reason } = request.body
      const adminId = request.user.id

      if (!requestId) {
        return reply.status(400).send({ error: 'requestId required' })
      }

      const session = getSession()
      try {
        const pendingRes = await session.run(
          `MATCH (pr:PendingRelationship {id: $id}) RETURN pr`,
          { id: requestId }
        )

        if (!pendingRes.records.length) {
          return reply.status(404).send({ error: 'Request not found' })
        }

        const pending = pendingRes.records[0].get('pr').properties
        const { fromPersonId, toPersonId, type, requestedBy } = pending

        await session.run(
          `MATCH (pr:PendingRelationship {id: $requestId})
           SET pr.status = 'rejected', pr.rejectionReason = $reason, pr.rejectedAt = timestamp(), pr.rejectedBy = $adminId`,
          { requestId, reason: reason || '', adminId }
        )

        // Notify the user who requested the relationship
        await createNotification(
          requestedBy,
          'relationship_rejected',
          'Relationship Rejected',
          `Your relationship request has been rejected${reason ? ': ' + reason : ''}`,
          { requestId, fromPersonId, toPersonId, type, reason: reason || '' }
        )

        return reply.send({ message: 'Relationship rejected' })

      } catch (err) {
        console.error(err)
        return reply.status(500).send({ error: 'Rejection failed' })
      } finally {
        await session.close()
      }
    }
  )
}