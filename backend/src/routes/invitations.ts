import { FastifyInstance } from 'fastify'
import { getSession } from '../db'
import { v4 as uuidv4 } from 'uuid'

export default async function invitationRoutes(fastify: FastifyInstance) {
  
  /**
   * Generate an invitation link for a tree
   * Only admin of tree can generate
   * Types: 'admin' | 'member' | 'viewer'
   */
  fastify.post('/trees/:treeId/invitations/generate', 
    { preHandler: fastify.authenticate }, 
    async (request: any, reply) => {
      const { treeId } = request.params
      const { invitationType } = request.body as any
      const user = request.user

      if (!['admin', 'member', 'viewer'].includes(invitationType)) {
        return reply.status(400).send({ error: 'Invalid invitation type' })
      }

      const session = getSession()
      try {
        // Check if user is admin of this tree
        const adminCheck = await session.run(
          `MATCH (u:User {id: $userId})-[r:MEMBER_OF {role: 'admin'}]->(t:FamilyTree {id: $treeId})
           RETURN r`,
          { userId: user.id, treeId }
        )

        if (!adminCheck.records.length) {
          return reply.status(403).send({ error: 'Only tree admin can generate invitations' })
        }

        const token = uuidv4()
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days

        await session.run(
          `MATCH (t:FamilyTree {id: $treeId})
           CREATE (i:TreeInvitation {
             token: $token,
             treeId: $treeId,
             invitationType: $invitationType,
             createdBy: $createdBy,
             createdAt: timestamp(),
             expiresAt: $expiresAt,
             status: 'active'
           })-[:FOR_TREE]->(t)`,
          { token, treeId, invitationType, createdBy: user.id, expiresAt }
        )

        // Get tree name for the invite link
        const treeResult = await session.run(
          `MATCH (t:FamilyTree {id: $treeId}) RETURN t.name as name`,
          { treeId }
        )

        const treeName = treeResult.records[0]?.get('name') || 'Family Tree'
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
        const invitationUrl = `${frontendUrl}/join/${token}`

        return reply.send({
          token,
          invitationUrl,
          invitationType,
          treeId,
          treeName,
          expiresAt
        })

      } finally {
        await session.close()
      }
    }
  )

  /**
   * Get invitation details by token (public endpoint)
   * No auth required - need to check publicly
   */
  fastify.get('/invitations/:token', async (request: any, reply) => {
    const { token } = request.params

    const session = getSession()
    try {
      const result = await session.run(
        `MATCH (i:TreeInvitation {token: $token})-[:FOR_TREE]->(t:FamilyTree)
         RETURN i, t`,
        { token }
      )

      if (!result.records.length) {
        return reply.status(404).send({ error: 'Invalid or expired invitation' })
      }

      const invite = result.records[0].get('i').properties
      const tree = result.records[0].get('t').properties

      // Check if token is expired
      if (invite.expiresAt < Date.now()) {
        return reply.status(410).send({ error: 'Invitation expired' })
      }

      if (invite.status !== 'active') {
        return reply.status(410).send({ error: 'Invitation no longer active' })
      }

      return reply.send({
        token,
        treeId: tree.id,
        treeName: tree.name,
        invitationType: invite.invitationType,
        expiresAt: invite.expiresAt
      })

    } finally {
      await session.close()
    }
  })

  /**
   * Accept invitation for existing user
   * Role Hierarchy: Admin > Member > Viewer
   * 
   * Logic:
   * 1. If user is NOT in this tree yet → create access request (pending approval)
   * 2. If user is already in this tree:
   *    - If current role >= requested role → direct access (no approval needed)
   *    - If current role < requested role → create access request (needs approval to upgrade)
   * 
   * Examples:
   * - User is member, clicks viewer link → direct access (member > viewer)
   * - User is member, clicks admin link → pending approval (need upgrade)
   * - User is admin, clicks member link → direct access (admin > member)
   * - User is viewer, clicks viewer link → direct access (same role)
   */
  fastify.post('/invitations/:token/accept',
    { preHandler: fastify.authenticate },
    async (request: any, reply) => {
      const { token } = request.params
      const user = request.user

      const session = getSession()
      try {
        // Get invitation details
        const inviteResult = await session.run(
          `MATCH (i:TreeInvitation {token: $token})-[:FOR_TREE]->(t:FamilyTree)
           RETURN i, t`,
          { token }
        )

        if (!inviteResult.records.length) {
          return reply.status(404).send({ error: 'Invalid or expired invitation' })
        }

        const invite = inviteResult.records[0].get('i').properties
        const tree = inviteResult.records[0].get('t').properties

        // Check expiration
        if (invite.expiresAt < Date.now()) {
          return reply.status(410).send({ error: 'Invitation expired' })
        }

        if (invite.status !== 'active') {
          return reply.status(410).send({ error: 'Invitation no longer active' })
        }

        const treeId = tree.id
        const invitationType = invite.invitationType

        // Role hierarchy: admin (3) > member (2) > viewer (1)
        const roleHierarchy: { [key: string]: number } = { admin: 3, member: 2, viewer: 1 }

        // Check if user is already a member of this tree
        const existingMemberResult = await session.run(
          `MATCH (u:User {id: $userId})-[r:MEMBER_OF]->(t:FamilyTree {id: $treeId})
           RETURN r.role as role`,
          { userId: user.id, treeId }
        )

        if (existingMemberResult.records.length) {
          // User is already a member of this tree
          const existingRole = existingMemberResult.records[0].get('role')
          const existingRoleLevel = roleHierarchy[existingRole]
          const requestedRoleLevel = roleHierarchy[invitationType]

          // If existing role >= requested role (higher or equal in hierarchy), grant direct access
          if (existingRoleLevel >= requestedRoleLevel) {
            return reply.send({
              success: true,
              message: 'Already a member with sufficient permissions, opening tree',
              treeId,
              role: existingRole
            })
          }

          // If existing role < requested role, need approval to upgrade
          // Create access request for role upgrade
          const accessRequestId = uuidv4()
          await session.run(
            `MATCH (u:User {id: $userId}), (t:FamilyTree {id: $treeId})
             CREATE (ar:TreeAccessRequest {
               id: $requestId,
               userId: $userId,
               treeId: $treeId,
               invitationType: $invitationType,
               status: 'pending',
               createdAt: timestamp(),
               userName: $userName,
               userEmail: $userEmail,
               upgradeFrom: $currentRole
             })-[:REQUESTS_ACCESS_TO]->(t)`,
            {
              requestId: accessRequestId,
              userId: user.id,
              treeId,
              invitationType,
              userName: user.name,
              userEmail: user.email,
              currentRole: existingRole
            }
          )

          return reply.send({
            success: true,
            message: `Request submitted to upgrade from ${existingRole} to ${invitationType}`,
            treeId,
            requestId: accessRequestId,
            status: 'pending',
            currentRole: existingRole,
            requestedRole: invitationType
          })
        }

        // User is NOT in this tree (new to this tree)
        // For admin type invitations, directly add user as admin (no approval needed)
        if (invitationType === 'admin') {
          await session.run(
            `MATCH (u:User {id: $userId}), (t:FamilyTree {id: $treeId})
             CREATE (u)-[:MEMBER_OF {role: 'admin', joinedAt: timestamp()}]->(t)`,
            { userId: user.id, treeId }
          )

          // Create a person node for the user in the tree
          await session.run(
            `MATCH (u:User {id: $userId}), (t:FamilyTree {id: $treeId})
             CREATE (p:Person {id: $personId, name: $name, email: $email, treeId: $treeId, accountId: $userId}),
             (p)-[:BELONGS_TO_TREE]->(t),
             (u)-[:REPRESENTS]->(p)`,
            { userId: user.id, treeId, personId: uuidv4(), name: user.name, email: user.email }
          )

          return reply.send({
            success: true,
            message: 'Successfully added as admin',
            treeId,
            role: 'admin'
          })
        }

        // For member and viewer invitations (new user to tree), create access request (pending approval)
        const accessRequestId = uuidv4()
        await session.run(
          `MATCH (u:User {id: $userId}), (t:FamilyTree {id: $treeId})
           CREATE (ar:TreeAccessRequest {
             id: $requestId,
             userId: $userId,
             treeId: $treeId,
             invitationType: $invitationType,
             status: 'pending',
             createdAt: timestamp(),
             userName: $userName,
             userEmail: $userEmail
           })-[:REQUESTS_ACCESS_TO]->(t)`,
          {
            requestId: accessRequestId,
            userId: user.id,
            treeId,
            invitationType,
            userName: user.name,
            userEmail: user.email
          }
        )

        return reply.send({
          success: true,
          message: `Request submitted for ${invitationType} approval`,
          treeId,
          requestId: accessRequestId,
          status: 'pending'
        })

      } finally {
        await session.close()
      }
    }
  )

  /**
   * Get pending access requests for a tree
   * Only admin can view
   */
  fastify.get('/trees/:treeId/access-requests',
    { preHandler: fastify.authenticate },
    async (request: any, reply) => {
      const { treeId } = request.params
      const user = request.user

      const session = getSession()
      try {
        // Check if user is admin
        const adminCheck = await session.run(
          `MATCH (u:User {id: $userId})-[r:MEMBER_OF {role: 'admin'}]->(t:FamilyTree {id: $treeId})
           RETURN r`,
          { userId: user.id, treeId }
        )

        if (!adminCheck.records.length) {
          return reply.status(403).send({ error: 'Only admin can view access requests' })
        }

        // Get all pending requests
        const requests = await session.run(
          `MATCH (ar:TreeAccessRequest {status: 'pending'})-[:REQUESTS_ACCESS_TO]->(t:FamilyTree {id: $treeId})
           RETURN ar
           ORDER BY ar.createdAt DESC`,
          { treeId }
        )

        const pendingRequests = requests.records.map(r => {
          const req = r.get('ar').properties
          const result: any = {
            id: req.id,
            userId: req.userId,
            userName: req.userName,
            userEmail: req.userEmail,
            invitationType: req.invitationType,
            createdAt: req.createdAt,
            status: req.status
          }
          // Include upgradeFrom if it exists (role upgrade scenario)
          if (req.upgradeFrom) {
            result.upgradeFrom = req.upgradeFrom
          }
          return result
        })

        return reply.send({ pendingRequests })

      } finally {
        await session.close()
      }
    }
  )

  /**
   * Approve access request
   * Only admin can approve
   */
  fastify.post('/trees/:treeId/access-requests/:requestId/approve',
    { preHandler: fastify.authenticate },
    async (request: any, reply) => {
      const { treeId, requestId } = request.params
      const user = request.user

      const session = getSession()
      try {
        // Check if user is admin
        const adminCheck = await session.run(
          `MATCH (u:User {id: $userId})-[r:MEMBER_OF {role: 'admin'}]->(t:FamilyTree {id: $treeId})
           RETURN r`,
          { userId: user.id, treeId }
        )

        if (!adminCheck.records.length) {
          return reply.status(403).send({ error: 'Only admin can approve requests' })
        }

        // Get the access request
        const requestResult = await session.run(
          `MATCH (ar:TreeAccessRequest {id: $requestId, status: 'pending'})-[:REQUESTS_ACCESS_TO]->(t:FamilyTree {id: $treeId})
           RETURN ar`,
          { requestId, treeId }
        )

        if (!requestResult.records.length) {
          return reply.status(404).send({ error: 'Request not found or already processed' })
        }

        const accessRequest = requestResult.records[0].get('ar').properties

        // Check if this is a role upgrade (upgradeFrom exists) or new user
        if (accessRequest.upgradeFrom) {
          // Role upgrade scenario: user already exists in tree with lower role
          // Delete old relationship and create new one with higher role
          await session.run(
            `MATCH (u:User {id: $userId})-[r:MEMBER_OF]->(t:FamilyTree {id: $treeId})
             WHERE r.role = $oldRole
             DELETE r`,
            { userId: accessRequest.userId, treeId, oldRole: accessRequest.upgradeFrom }
          )

          // Create new relationship with upgraded role
          await session.run(
            `MATCH (u:User {id: $userId}), (t:FamilyTree {id: $treeId})
             CREATE (u)-[:MEMBER_OF {role: $role, joinedAt: timestamp()}]->(t)`,
            { userId: accessRequest.userId, treeId, role: accessRequest.invitationType }
          )
        } else {
          // New user scenario: add user to tree
          await session.run(
            `MATCH (u:User {id: $userId}), (t:FamilyTree {id: $treeId})
             CREATE (u)-[:MEMBER_OF {role: $role, joinedAt: timestamp()}]->(t)`,
            { userId: accessRequest.userId, treeId, role: accessRequest.invitationType }
          )

          // Create person node for the user in the tree (only for new users)
          await session.run(
            `MATCH (u:User {id: $userId}), (t:FamilyTree {id: $treeId})
             MERGE (p:Person {id: $personId, treeId: $treeId})
             SET p.name = $name, p.email = $email, p.accountId = $userId
             CREATE (p)-[:BELONGS_TO_TREE]->(t),
             (u)-[:REPRESENTS]->(p)`,
            { 
              userId: accessRequest.userId, 
              treeId, 
              personId: uuidv4(),
              name: accessRequest.userName,
              email: accessRequest.userEmail
            }
          )
        }

        // Update request status to approved
        await session.run(
          `MATCH (ar:TreeAccessRequest {id: $requestId})
           SET ar.status = 'approved', ar.approvedAt = timestamp()`,
          { requestId }
        )

        return reply.send({
          success: true,
          message: `${accessRequest.invitationType} request approved`,
          userId: accessRequest.userId,
          role: accessRequest.invitationType
        })

      } finally {
        await session.close()
      }
    }
  )

  /**
   * Reject access request
   * Only admin can reject
   */
  fastify.post('/trees/:treeId/access-requests/:requestId/reject',
    { preHandler: fastify.authenticate },
    async (request: any, reply) => {
      const { treeId, requestId } = request.params
      const { reason } = request.body as any
      const user = request.user

      const session = getSession()
      try {
        // Check if user is admin
        const adminCheck = await session.run(
          `MATCH (u:User {id: $userId})-[r:MEMBER_OF {role: 'admin'}]->(t:FamilyTree {id: $treeId})
           RETURN r`,
          { userId: user.id, treeId }
        )

        if (!adminCheck.records.length) {
          return reply.status(403).send({ error: 'Only admin can reject requests' })
        }

        // Get the access request
        const requestResult = await session.run(
          `MATCH (ar:TreeAccessRequest {id: $requestId, status: 'pending'})-[:REQUESTS_ACCESS_TO]->(t:FamilyTree {id: $treeId})
           RETURN ar`,
          { requestId, treeId }
        )

        if (!requestResult.records.length) {
          return reply.status(404).send({ error: 'Request not found or already processed' })
        }

        const accessRequest = requestResult.records[0].get('ar').properties

        // Update request status to rejected
        await session.run(
          `MATCH (ar:TreeAccessRequest {id: $requestId})
           SET ar.status = 'rejected', ar.rejectedAt = timestamp(), ar.rejectionReason = $reason`,
          { requestId, reason }
        )

        return reply.send({
          success: true,
          message: 'Request rejected',
          userId: accessRequest.userId
        })

      } finally {
        await session.close()
      }
    }
  )

  /**
   * Get all generated invitation links for a tree
   * Only admin can view
   */
  fastify.get('/trees/:treeId/invitations',
    { preHandler: fastify.authenticate },
    async (request: any, reply) => {
      const { treeId } = request.params
      const user = request.user

      const session = getSession()
      try {
        // Check if user is admin
        const adminCheck = await session.run(
          `MATCH (u:User {id: $userId})-[r:MEMBER_OF {role: 'admin'}]->(t:FamilyTree {id: $treeId})
           RETURN r`,
          { userId: user.id, treeId }
        )

        if (!adminCheck.records.length) {
          return reply.status(403).send({ error: 'Only admin can view invitations' })
        }

        // Get all active invitations
        const invitations = await session.run(
          `MATCH (i:TreeInvitation)-[:FOR_TREE]->(t:FamilyTree {id: $treeId})
           WHERE i.status = 'active' AND i.expiresAt > $now
           RETURN i
           ORDER BY i.createdAt DESC`,
          { treeId, now: Date.now() }
        )

        const activeInvitations = invitations.records.map(r => {
          const inv = r.get('i').properties
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
          return {
            token: inv.token,
            invitationType: inv.invitationType,
            createdAt: inv.createdAt,
            expiresAt: inv.expiresAt,
            invitationUrl: `${frontendUrl}/join/${inv.token}`
          }
        })

        return reply.send({ activeInvitations })

      } finally {
        await session.close()
      }
    }
  )
}
