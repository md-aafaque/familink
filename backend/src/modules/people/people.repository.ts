import { getSession } from '../../core/database';
import { Person, CreatePersonInput, UpdatePersonInput } from '../../shared/schemas/people';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../core/errors';

export class PeopleRepository {
  private static serializeArray(arr: any[]): string {
    return JSON.stringify(arr || []);
  }

  private static parseArray(str: string | undefined): any[] {
    try {
      return str ? JSON.parse(str) : [];
    } catch (e) {
      return [];
    }
  }

  static async create(input: CreatePersonInput & { createdBy: string }): Promise<Person> {
    const session = getSession();
    try {
      const id = uuidv4();
      const { occupations, educations, ...rest } = input;
      
      // Ensure all fields used in the query are present in params, even if null
      const params = {
        id,
        treeId: rest.treeId,
        firstName: rest.firstName,
        lastName: rest.lastName || null,
        nickname: rest.nickname || null,
        gender: rest.gender || 'unknown',
        birthDate: rest.birthDate || null,
        deathDate: rest.deathDate || null,
        status: rest.status || 'ghost',
        phone: rest.phone || null,
        phoneVisibility: rest.phoneVisibility || 'tree',
        email: rest.email || null,
        emailVisibility: rest.emailVisibility || 'tree',
        address: rest.address || null,
        addressVisibility: rest.addressVisibility || 'tree',
        occupations: this.serializeArray(occupations),
        occupationSectionVisible: rest.occupationSectionVisible ?? true,
        educations: this.serializeArray(educations),
        educationSectionVisible: rest.educationSectionVisible ?? true,
        birthDateVisibility: rest.birthDateVisibility || 'tree',
        imageUrl: rest.imageUrl || null,
        createdBy: rest.createdBy
      };

      const result = await session.run(
        `
        MATCH (t:FamilyTree {id: $treeId})
        CREATE (p:Person {
          id: $id,
          treeId: $treeId,
          firstName: $firstName,
          lastName: $lastName,
          nickname: $nickname,
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
          occupations: $occupations,
          occupationSectionVisible: $occupationSectionVisible,
          educations: $educations,
          educationSectionVisible: $educationSectionVisible,
          birthDateVisibility: $birthDateVisibility,
          imageUrl: $imageUrl,
          createdBy: $createdBy,
          createdAt: timestamp()
        })
        CREATE (p)-[:BELONGS_TO_TREE]->(t)
        RETURN p
        `,
        params
      );
      const props = result.records[0].get('p').properties;
      return {
        ...props,
        occupations: this.parseArray(props.occupations),
        educations: this.parseArray(props.educations)
      };
    } finally {
      await session.close();
    }
  }

  static async findById(id: string, treeId: string): Promise<Person | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (p:Person {id: $id, treeId: $treeId}) WHERE p.deletedAt IS NULL RETURN p`,
        { id, treeId }
      );
      if (result.records.length === 0) return null;
      const props = result.records[0].get('p').properties;
      return {
        ...props,
        occupations: this.parseArray(props.occupations),
        educations: this.parseArray(props.educations)
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Internal use only for discovery when treeId is unknown.
   * e.g. during initial claim request.
   */
  static async findByIdGlobal(id: string): Promise<Person | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (p:Person {id: $id}) WHERE p.deletedAt IS NULL RETURN p`,
        { id }
      );
      if (result.records.length === 0) return null;
      const props = result.records[0].get('p').properties;
      return {
        ...props,
        occupations: this.parseArray(props.occupations),
        educations: this.parseArray(props.educations)
      };
    } finally {
      await session.close();
    }
  }

  static async update(id: string, treeId: string, input: UpdatePersonInput): Promise<Person> {
    const keys = Object.keys(input);
    if (keys.length === 0) {
      const existing = await this.findById(id, treeId);
      if (!existing) throw new AppError('Person not found', 404);
      return existing;
    }

    const session = getSession();
    try {
      const params: any = { ...input, id, treeId };
      if (input.occupations) params.occupations = this.serializeArray(input.occupations);
      if (input.educations) params.educations = this.serializeArray(input.educations);

      // Build the SET clause dynamically but safely using parameters
      const setters = Object.keys(params)
        .filter(key => !['id', 'treeId'].includes(key))
        .map(key => `p.${key} = $${key}`)
        .join(', ');
      
      const result = await session.run(
        `MATCH (p:Person {id: $id, treeId: $treeId}) 
         WHERE p.deletedAt IS NULL
         SET ${setters} 
         RETURN p`,
        params
      );

      if (result.records.length === 0) {
        throw new AppError('Person not found or already deleted', 404);
      }

      const props = result.records[0].get('p').properties;
      return {
        ...props,
        occupations: this.parseArray(props.occupations),
        educations: this.parseArray(props.educations)
      };
    } finally {
      await session.close();
    }
  }

  static async softDelete(id: string, treeId: string, deletedBy: string): Promise<void> {
    const session = getSession();
    try {
      await session.run(
        `MATCH (p:Person {id: $id, treeId: $treeId}) SET p.deletedAt = timestamp(), p.deletedBy = $deletedBy`,
        { id, treeId, deletedBy }
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

  static async createClaimRequest(personId: string, userId: string, treeId: string): Promise<any> {
    const session = getSession();
    try {
      const id = uuidv4();
      const result = await session.run(
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
        RETURN cr
        `,
        { id, personId, userId, treeId }
      );
      return result.records[0].get('cr').properties;
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

  static async mergePeople(sourceId: string, targetId: string, treeId: string, userId: string): Promise<void> {
    const session = getSession();
    try {
      await session.run(
        `
        MATCH (s:Person {id: $sourceId, treeId: $treeId})
        MATCH (t:Person {id: $targetId, treeId: $treeId})
        
        // 1. Move outgoing relationships
        WITH s, t
        MATCH (s)-[r:FAMILY_RELATIONSHIP]->(other:Person)
        WHERE other.id <> $targetId AND r.deletedAt IS NULL
        MERGE (t)-[newR:FAMILY_RELATIONSHIP {type: r.type, treeId: $treeId}]->(other)
        ON CREATE SET newR.createdBy = r.createdBy, 
                      newR.createdAt = r.createdAt, 
                      newR.approvedBy = r.approvedBy
        SET r.deletedAt = timestamp(), r.deletedBy = $userId, r.mergeTargetId = $targetId

        WITH s, t
        // 2. Move incoming relationships
        MATCH (other:Person)-[r:FAMILY_RELATIONSHIP]->(s)
        WHERE other.id <> $targetId AND r.deletedAt IS NULL
        MERGE (other)-[newR:FAMILY_RELATIONSHIP {type: r.type, treeId: $treeId}]->(t)
        ON CREATE SET newR.createdBy = r.createdBy, 
                      newR.createdAt = r.createdAt, 
                      newR.approvedBy = r.approvedBy
        SET r.deletedAt = timestamp(), r.deletedBy = $userId, r.mergeTargetId = $targetId

        WITH s, t
        // 3. Mark source as merged
        SET s.status = 'merged', s.mergedIntoId = $targetId, s.deletedAt = timestamp(), s.deletedBy = $userId
        `,
        { sourceId, targetId, treeId, userId }
      );
    } finally {
      await session.close();
    }
  }

  static async grantPermission(personId: string, userId: string, permission: 'owner' | 'editor'): Promise<void> {
    const session = getSession();
    try {
      await session.run(
        `
        MATCH (p:Person {id: $personId})
        MATCH (u:User {id: $userId})
        MERGE (u)-[r:HAS_PERMISSION]->(p)
        SET r.permission = $permission, r.updatedAt = timestamp()
        `,
        { personId, userId, permission }
      );
    } finally {
      await session.close();
    }
  }

  static async revokePermission(personId: string, userId: string): Promise<void> {
    const session = getSession();
    try {
      await session.run(
        `
        MATCH (u:User {id: $userId})-[r:HAS_PERMISSION]->(p:Person {id: $personId})
        DELETE r
        `,
        { personId, userId }
      );
    } finally {
      await session.close();
    }
  }

  static async getPermissions(personId: string): Promise<any[]> {
    const session = getSession();
    try {
      const result = await session.run(
        `
        MATCH (u:User)-[r:HAS_PERMISSION]->(p:Person {id: $personId})
        RETURN u.id as userId, u.name as name, u.email as email, r.permission as permission
        `,
        { personId }
      );
      return result.records.map(r => ({
        userId: r.get('userId'),
        name: r.get('name'),
        email: r.get('email'),
        permission: r.get('permission')
      }));
    } finally {
      await session.close();
    }
  }

  static async createDeletionProposal(personId: string, treeId: string, proposerId: string, reason?: string): Promise<any> {
    const session = getSession();
    try {
      const id = uuidv4();
      const result = await session.run(
        `
        MATCH (p:Person {id: $personId, treeId: $treeId})
        MATCH (u:User {id: $proposerId})
        CREATE (dp:DeletionProposal {
          id: $id,
          personId: $personId,
          treeId: $treeId,
          proposerId: $proposerId,
          reason: $reason,
          status: 'pending',
          createdAt: timestamp()
        })
        CREATE (u)-[:PROPOSED_DELETION]->(dp)
        CREATE (dp)-[:TARGETS_PERSON]->(p)
        RETURN dp
        `,
        { id, personId, treeId, proposerId, reason: reason || null }
      );
      return result.records[0].get('dp').properties;
    } finally {
      await session.close();
    }
  }

  static async findDeletionProposalById(id: string): Promise<any | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (dp:DeletionProposal {id: $id}) RETURN dp`,
        { id }
      );
      if (result.records.length === 0) return null;
      return result.records[0].get('dp').properties;
    } finally {
      await session.close();
    }
  }

  static async updateDeletionProposalStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    const session = getSession();
    try {
      await session.run(
        `MATCH (dp:DeletionProposal {id: $id}) SET dp.status = $status, dp.processedAt = timestamp()`,
        { id, status }
      );
    } finally {
      await session.close();
    }
  }

  static async getPendingDeletionProposals(treeId: string): Promise<any[]> {
    const session = getSession();
    try {
      const result = await session.run(
        `
        MATCH (dp:DeletionProposal {treeId: $treeId, status: 'pending'})
        MATCH (p:Person {id: dp.personId})
        MATCH (u:User {id: dp.proposerId})
        RETURN dp, p, u.email as proposerEmail, u.name as proposerName
        ORDER BY dp.createdAt DESC
        `,
        { treeId }
      );
      return result.records.map(r => ({
        ...r.get('dp').properties,
        person: r.get('p').properties,
        proposerEmail: r.get('proposerEmail'),
        proposerName: r.get('proposerName')
      }));
    } finally {
      await session.close();
    }
  }

  static async createMergeProposal(sourceId: string, targetId: string, treeId: string, proposerId: string, reason?: string): Promise<any> {
    const session = getSession();
    try {
      const id = uuidv4();
      const result = await session.run(
        `
        MATCH (s:Person {id: $sourceId, treeId: $treeId})
        MATCH (t:Person {id: $targetId, treeId: $treeId})
        MATCH (u:User {id: $proposerId})
        CREATE (mp:MergeProposal {
          id: $id,
          sourceId: $sourceId,
          targetId: $targetId,
          treeId: $treeId,
          proposerId: $proposerId,
          reason: $reason,
          status: 'pending',
          createdAt: timestamp()
        })
        CREATE (u)-[:PROPOSED_MERGE]->(mp)
        CREATE (mp)-[:TARGETS_SOURCE]->(s)
        CREATE (mp)-[:TARGETS_TARGET]->(t)
        RETURN mp
        `,
        { id, sourceId, targetId, treeId, proposerId, reason: reason || null }
      );
      return result.records[0].get('mp').properties;
    } finally {
      await session.close();
    }
  }

  static async findMergeProposalById(id: string): Promise<any | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (mp:MergeProposal {id: $id}) RETURN mp`,
        { id }
      );
      if (result.records.length === 0) return null;
      return result.records[0].get('mp').properties;
    } finally {
      await session.close();
    }
  }

  static async updateMergeProposalStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    const session = getSession();
    try {
      await session.run(
        `MATCH (mp:MergeProposal {id: $id}) SET mp.status = $status, mp.processedAt = timestamp()`,
        { id, status }
      );
    } finally {
      await session.close();
    }
  }

  static async getPendingMergeProposals(treeId: string): Promise<any[]> {
    const session = getSession();
    try {
      const result = await session.run(
        `
        MATCH (mp:MergeProposal {treeId: $treeId, status: 'pending'})
        MATCH (s:Person {id: mp.sourceId})
        MATCH (t:Person {id: mp.targetId})
        MATCH (u:User {id: mp.proposerId})
        RETURN mp, s, t, u.email as proposerEmail, u.name as proposerName
        ORDER BY mp.createdAt DESC
        `,
        { treeId }
      );
      return result.records.map(r => ({
        ...r.get('mp').properties,
        sourcePerson: r.get('s').properties,
        targetPerson: r.get('t').properties,
        proposerEmail: r.get('proposerEmail'),
        proposerName: r.get('proposerName')
      }));
    } finally {
      await session.close();
    }
  }

  static async listPeople(treeId: string) {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (p:Person {treeId: $treeId})
         WHERE p.deletedAt IS NULL
         OPTIONAL MATCH (p)-[r:FAMILY_RELATIONSHIP]-()
         RETURN p, count(r) as relCount
         ORDER BY p.firstName ASC`,
        { treeId }
      );
      return result.records.map(r => ({
        ...r.get('p').properties,
        relationshipCount: r.get('relCount').toNumber()
      }));
    } finally {
      await session.close();
    }
  }

  static async getNeighborhood(treeId: string, userId: string) {
    const session = getSession();
    try {
      // 1. Find the person represented by this user in this tree
      const meResult = await session.run(
        `MATCH (u:User {id: $userId})-[:REPRESENTS]->(p:Person {treeId: $treeId}) RETURN p`,
        { userId, treeId }
      );

      let rootPerson;
      if (meResult.records.length === 0) {
        // If not representing anyone, just pick the first person or a root
        const anyResult = await session.run(
          `MATCH (p:Person {treeId: $treeId}) RETURN p LIMIT 1`,
          { treeId }
        );
        if (anyResult.records.length === 0) return null;
        rootPerson = anyResult.records[0].get('p').properties;
      } else {
        rootPerson = meResult.records[0].get('p').properties;
      }

      // 2. Get direct relations (level 1)
      const l1Result = await session.run(
        `MATCH (p:Person {id: $id})-[r:FAMILY_RELATIONSHIP]-(n:Person)
         RETURN DISTINCT n`,
        { id: rootPerson.id }
      );
      const level1 = l1Result.records.map(r => r.get('n').properties);

      // 3. Get extended relations (level 2)
      const l1Ids = level1.map((p: any) => p.id).concat([rootPerson.id]);
      const l2Result = await session.run(
        `MATCH (p:Person {id: $id})-[:FAMILY_RELATIONSHIP]-(n:Person)-[:FAMILY_RELATIONSHIP]-(m:Person)
         WHERE NOT m.id IN $l1Ids
         RETURN DISTINCT m`,
        { id: rootPerson.id, l1Ids }
      );
      const level2 = l2Result.records.map(r => r.get('m').properties);

      return {
        person: rootPerson,
        level1,
        level2
      };
    } finally {
      await session.close();
    }
  }

  static async linkUserToPerson(userId: string, personId: string, treeId: string) {
    const session = getSession();
    try {
      // 1. Check if user already represents someone in this tree
      const existing = await session.run(
        `MATCH (u:User {id: $userId})-[:REPRESENTS]->(p:Person {treeId: $treeId}) RETURN p`,
        { userId, treeId }
      );

      if (existing.records.length > 0) {
        const currentPerson = existing.records[0].get('p').properties;
        await session.run(
          `
          MATCH (u:User {id: $userId})-[oldRel:REPRESENTS]->(pOld:Person {id: $oldId})
          MATCH (pNew:Person {id: $newId})
          DELETE oldRel
          CREATE (u)-[:REPRESENTS]->(pNew)
          SET pNew.status = 'active', pNew.accountId = $userId
          
          // Grant owner permission
          MERGE (u)-[pr:HAS_PERMISSION]->(pNew)
          SET pr.permission = 'owner'
          `,
          { userId, oldId: currentPerson.id, newId: personId }
        );
      } else {
        await session.run(
          `
          MATCH (u:User {id: $userId}), (p:Person {id: $personId})
          CREATE (u)-[:REPRESENTS]->(p)
          SET p.status = 'active', p.accountId = $userId
          
          // Grant owner permission
          MERGE (u)-[pr:HAS_PERMISSION]->(p)
          SET pr.permission = 'owner'
          `,
          { userId, personId }
        );
      }
    } finally {
      await session.close();
    }
  }
}
