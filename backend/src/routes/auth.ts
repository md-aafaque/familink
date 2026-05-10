import { FastifyInstance } from 'fastify'
import { getSession } from '../db'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for login
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for creating users
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export default async function authRoutes(fastify: FastifyInstance) {

  fastify.post('/auth/signup', async (request: any, reply) => {
    let { email, password, name } = request.body

    if (!email || !password || !name) {
      return reply.status(400).send({ error: 'All fields required' })
    }

    email = email.toLowerCase().trim()

    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: { name },
      })

      if (error || !data.user) {
        return reply.status(400).send({ error: error?.message })
      }

      const session = getSession()
      try {
        await session.run(
          `
          CREATE (u:User {
            id: $id,
            email: $email,
            name: $name,
            role: 'user',
            status: 'pending',
            createdAt: timestamp()
          })
          `,
          { id: data.user.id, email, name }
        )
      } finally {
        await session.close()
      }

      return reply.send({
        message: 'Signup successful. Await admin approval.',
      })

    } catch (err) {
      console.error(err)
      return reply.status(500).send({ error: 'Signup failed' })
    }
  })

  fastify.post('/auth/login', async (request: any, reply) => {
    let { email, password } = request.body

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password required' })
    }

    email = email.toLowerCase().trim()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.session) {
        return reply.status(401).send({ error: 'Invalid credentials' })
      }

      const sessionDb = getSession()
      try {
        const result = await sessionDb.run(
          `MATCH (u:User {id: $id}) RETURN u.status as status, u.role as role`,
          { id: data.user.id }
        )

        if (!result.records.length) {
          return reply.status(404).send({ error: 'User not found' })
        }

        const status = result.records[0].get('status')
        const role = result.records[0].get('role')

        if (status === 'pending') {
          return reply.status(403).send({ error: 'Account pending approval' })
        }

        if (status === 'rejected') {
          return reply.status(403).send({ error: 'Account rejected' })
        }

        return reply.send({
          accessToken: data.session.access_token,
          user: {
            id: data.user.id,
            email: data.user.email,
            role,
          },
        })

      } finally {
        await sessionDb.close()
      }

    } catch (err) {
      console.error(err)
      return reply.status(500).send({ error: 'Login failed' })
    }
  })

  fastify.post('/auth/admin/invite', { preHandler: fastify.authenticate }, async (request: any, reply) => {
    const { email } = request.body
    const currentUser = request.user

    if (!email) {
      return reply.status(400).send({ error: 'Email required' })
    }

    const session = getSession()
    try {
      const check = await session.run(
        `MATCH (u:User {id: $id}) RETURN u.role as role`,
        { id: currentUser.id }
      )

      if (!check.records.length || check.records[0].get('role') !== 'admin') {
        return reply.status(403).send({ error: 'Only admins allowed' })
      }

      const token = uuidv4()
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000

      await session.run(
        `
        CREATE (i:AdminInvite {
          token: $token,
          email: $email,
          createdAt: timestamp(),
          expiresAt: $expiresAt
        })
        `,
        { token, email, expiresAt }
      )

      return reply.send({
        inviteToken: token,
        url: `http://localhost:3000/admin/setup/${token}`,
      })

    } finally {
      await session.close()
    }
  })

  fastify.post('/auth/admin/setup', async (request: any, reply) => {
    const { token, email, password, name } = request.body

    if (!token || !email || !password || !name) {
      return reply.status(400).send({ error: 'All fields required' })
    }

    const session = getSession()
    try {
      const inviteResult = await session.run(
        `MATCH (i:AdminInvite {token: $token}) RETURN i`,
        { token }
      )

      if (!inviteResult.records.length) {
        return reply.status(400).send({ error: 'Invalid token' })
      }

      const invite = inviteResult.records[0].get('i').properties

      if (invite.expiresAt < Date.now()) {
        return reply.status(400).send({ error: 'Invite expired' })
      }

      if (invite.email !== email) {
        return reply.status(400).send({ error: 'Email mismatch' })
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      })

      if (error || !data.user) {
        return reply.status(400).send({ error: error?.message })
      }

      await session.run(
        `
        CREATE (u:User {
          id: $id,
          email: $email,
          name: $name,
          role: 'admin',
          status: 'approved',
          createdAt: timestamp()
        })
        `,
        { id: data.user.id, email, name }
      )

      await session.run(
        `MATCH (i:AdminInvite {token: $token}) DELETE i`,
        { token }
      )

      return reply.send({ message: 'Admin created' })

    } finally {
      await session.close()
    }
  })

  fastify.get('/auth/me', { preHandler: fastify.authenticate }, async (request: any, reply) => {
    console.log('GET /auth/me called, request.user:', request.user);
    
    if (!request.user) {
      console.error('request.user is not set!');
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const user = request.user;
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $id}) RETURN u`,
        { id: user.id }
      );

      if (!result.records.length) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send(result.records[0].get('u').properties);

    } finally {
      await session.close();
    }
  });

  /**
   * Sign up through invitation link
   * - Admin invitations: directly create admin user
   * - Member/Viewer invitations: create pending user awaiting approval
   */
  fastify.post('/auth/signup-with-invitation', async (request: any, reply) => {
    const { token, email, password, name } = request.body

    if (!token || !email || !password || !name) {
      return reply.status(400).send({ error: 'All fields required' })
    }

    const session = getSession()
    try {
      // Get invitation details
      const inviteResult = await session.run(
        `MATCH (i:TreeInvitation {token: $token})-[:FOR_TREE]->(t:FamilyTree)
         RETURN i, t`,
        { token }
      )

      if (!inviteResult.records.length) {
        return reply.status(400).send({ error: 'Invalid invitation token' })
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

      // Create user in Supabase
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        email_confirm: true,
        user_metadata: { name },
      })

      if (error || !data.user) {
        return reply.status(400).send({ error: error?.message })
      }

      // Create user node in Neo4j
      await session.run(
        `
        CREATE (u:User {
          id: $id,
          email: $email,
          name: $name,
          role: 'user',
          status: 'approved',
          createdAt: timestamp()
        })
        `,
        { id: data.user.id, email: email.toLowerCase().trim(), name }
      )

      // Handle based on invitation type
      if (invitationType === 'admin') {
        // For admin invitations, directly add as admin
        await session.run(
          `MATCH (u:User {id: $userId}), (t:FamilyTree {id: $treeId})
           CREATE (u)-[:MEMBER_OF {role: 'admin', joinedAt: timestamp()}]->(t)`,
          { userId: data.user.id, treeId }
        )

        // Create person node
        await session.run(
          `MATCH (u:User {id: $userId}), (t:FamilyTree {id: $treeId})
           CREATE (p:Person {id: $personId, name: $name, email: $email, treeId: $treeId, accountId: $userId}),
           (p)-[:BELONGS_TO_TREE]->(t),
           (u)-[:REPRESENTS]->(p)`,
          { userId: data.user.id, treeId, personId: uuidv4(), name, email }
        )

        return reply.send({
          message: 'Admin account created successfully',
          userId: data.user.id,
          role: 'admin',
          treeId
        })
      } else {
        // For member/viewer invitations, create access request (pending approval)
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
            userId: data.user.id, 
            treeId, 
            invitationType,
            userName: name,
            userEmail: email.toLowerCase().trim()
          }
        )

        return reply.send({
          message: 'Account created. Awaiting admin approval to join tree.',
          userId: data.user.id,
          treeId,
          requestId: accessRequestId,
          status: 'pending',
          role: invitationType
        })
      }

    } catch (err) {
      console.error(err)
      return reply.status(500).send({ error: 'Signup failed' })
    } finally {
      await session.close()
    }
  })
}