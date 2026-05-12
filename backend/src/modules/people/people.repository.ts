import { getSession } from '../../core/database';
import { Person, CreatePersonInput, UpdatePersonInput } from '@shared/schemas/people';
import { v4 as uuidv4 } from 'uuid';

export class PeopleRepository {
  static async create(input: CreatePersonInput & { createdBy: string }): Promise<Person> {
    const session = getSession();
    try {
      const id = uuidv4();
      const result = await session.run(
        `
        MATCH (t:FamilyTree {id: $treeId})
        CREATE (p:Person {
          id: $id,
          treeId: $treeId,
          firstName: $firstName,
          lastName: $lastName,
          gender: $gender,
          birthDate: $birthDate,
          deathDate: $deathDate,
          status: $status,
          phone: $phone,
          phoneVisibility: $phoneVisibility,
          email: $email,
          emailVisibility: $emailVisibility,
          address: $address,
          addressVisibility: $addressVisibility,
          birthDateVisibility: $birthDateVisibility,
          createdBy: $createdBy,
          createdAt: timestamp()
        })
        CREATE (p)-[:BELONGS_TO_TREE]->(t)
        RETURN p
        `,
        { ...input, id }
      );
      return result.records[0].get('p').properties;
    } finally {
      await session.close();
    }
  }

  static async findById(id: string): Promise<Person | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (p:Person {id: $id}) WHERE p.deletedAt IS NULL RETURN p`,
        { id }
      );
      if (result.records.length === 0) return null;
      return result.records[0].get('p').properties;
    } finally {
      await session.close();
    }
  }

  static async update(id: string, input: UpdatePersonInput): Promise<Person> {
    if (Object.keys(input).length === 0) {
      const existing = await this.findById(id);
      if (!existing) throw new Error('Person not found');
      return existing;
    }

    const session = getSession();
    try {
      const setters = Object.keys(input)
        .map(key => `p.${key} = $${key}`)
        .join(', ');
      
      const result = await session.run(
        `MATCH (p:Person {id: $id}) SET ${setters} RETURN p`,
        { ...input, id }
      );
      return result.records[0].get('p').properties;
    } finally {
      await session.close();
    }
  }

  static async softDelete(id: string, deletedBy: string): Promise<void> {
    const session = getSession();
    try {
      await session.run(
        `MATCH (p:Person {id: $id}) SET p.deletedAt = timestamp(), p.deletedBy = $deletedBy`,
        { id, deletedBy }
      );
    } finally {
      await session.close();
    }
  }

  static async checkPermission(personId: string, userId: string): Promise<string | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (p:Person {id: $personId})
        OPTIONAL MATCH (u)-[r:MEMBER_OF]->(t:FamilyTree {id: p.treeId})
        OPTIONAL MATCH (u)-[prm:HAS_PERMISSION]->(p)
        RETURN r.role as treeRole, prm.permission as explicitPermission, p.createdBy as creatorId
        `,
        { userId, personId }
      );
      
      if (result.records.length === 0) return null;
      
      const rec = result.records[0];
      const treeRole = rec.get('treeRole');
      const explicitPermission = rec.get('explicitPermission');
      const creatorId = rec.get('creatorId');

      if (treeRole === 'admin' || creatorId === userId || explicitPermission === 'owner') return 'owner';
      if (explicitPermission === 'editor') return 'editor';
      if (treeRole) return 'viewer';
      
      return null;
    } finally {
      await session.close();
    }
  }

  static async createClaimRequest(personId: string, userId: string, treeId: string): Promise<void> {
    const session = getSession();
    try {
      const id = uuidv4();
      await session.run(
        `
        MATCH (p:Person {id: $personId, treeId: $treeId})
        MATCH (u:User {id: $userId})
        CREATE (cr:ClaimRequest {
          id: $id,
          personId: $personId,
          userId: $userId,
          treeId: $treeId,
          status: 'pending',
          createdAt: timestamp()
        })
        CREATE (cr)-[:REQUESTS_CLAIM_ON]->(p)
        CREATE (u)-[:INITIATED_CLAIM]->(cr)
        `,
        { id, personId, userId, treeId }
      );
    } finally {
      await session.close();
    }
  }

  static async findClaimRequestById(id: string): Promise<any | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (cr:ClaimRequest {id: $id}) RETURN cr`,
        { id }
      );
      if (result.records.length === 0) return null;
      return result.records[0].get('cr').properties;
    } finally {
      await session.close();
    }
  }

  static async updateClaimRequestStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    const session = getSession();
    try {
      await session.run(
        `MATCH (cr:ClaimRequest {id: $id}) SET cr.status = $status, cr.processedAt = timestamp()`,
        { id, status }
      );
    } finally {
      await session.close();
    }
  }

  static async getPendingClaimRequests(treeId: string): Promise<any[]> {
    const session = getSession();
    try {
      const result = await session.run(
        `
        MATCH (cr:ClaimRequest {treeId: $treeId, status: 'pending'})
        MATCH (p:Person {id: cr.personId})
        MATCH (u:User {id: cr.userId})
        RETURN cr, p, u.email as email, u.name as name
        ORDER BY cr.createdAt DESC
        `,
        { treeId }
      );
      return result.records.map(r => ({
        ...r.get('cr').properties,
        person: r.get('p').properties,
        userEmail: r.get('email'),
        userName: r.get('name')
      }));
    } finally {
      await session.close();
    }
  }
}
