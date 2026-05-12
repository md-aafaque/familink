import { PeopleRepository } from './people.repository';
import { CreatePersonInput, UpdatePersonInput, Person } from '@shared/schemas/people';
import { AppError } from '../../core/errors';
import { getSession } from '../../core/database';
import { NotificationsService } from '../notifications/notifications.service';

export class PeopleService {
  static async createPerson(input: CreatePersonInput, userId: string) {
    // Check if user has permission to add people to this tree
    // (Simplification: any tree member can add people)
    return PeopleRepository.create({ ...input, createdBy: userId });
  }

  static async getPerson(id: string, userId: string): Promise<Partial<Person>> {
    const person = await PeopleRepository.findById(id);
    if (!person) throw new AppError('Person not found', 404);

    const permission = await PeopleRepository.checkPermission(id, userId);
    if (!permission) throw new AppError('Access denied', 403);

    // If owner or editor, return full profile
    if (permission === 'owner' || permission === 'editor') {
      return person;
    }

    // Otherwise, filter based on privacy settings
    const filtered: Partial<Person> = { ...person };
    
    if (person.phoneVisibility !== 'tree') delete filtered.phone;
    if (person.emailVisibility !== 'tree') delete filtered.email;
    if (person.addressVisibility !== 'tree') delete filtered.address;
    if (person.birthDateVisibility !== 'tree') delete filtered.birthDate;

    return filtered;
  }

  static async updatePerson(id: string, input: UpdatePersonInput, userId: string) {
    const permission = await PeopleRepository.checkPermission(id, userId);
    if (permission !== 'owner' && permission !== 'editor') {
      throw new AppError('You do not have permission to edit this profile', 403);
    }

    return PeopleRepository.update(id, input);
  }

  static async deletePerson(id: string, userId: string) {
    const permission = await PeopleRepository.checkPermission(id, userId);
    if (permission !== 'owner') {
      throw new AppError('Only owners or admins can delete profiles', 403);
    }

    return PeopleRepository.softDelete(id, userId);
  }

  static async claimProfile(personId: string, userId: string) {
    // 1. Check if person is a ghost
    const person = await PeopleRepository.findById(personId);
    if (!person) throw new AppError('Profile not found', 404);
    if (person.status !== 'ghost') throw new AppError('This profile is already claimed or active', 400);

    // 2. Create Request
    await PeopleRepository.createClaimRequest(personId, userId, person.treeId);

    // 3. Notify Admins
    const session = getSession();
    try {
      const admins = await session.run(
        `MATCH (u:User)-[:MEMBER_OF {role: 'admin'}]->(t:FamilyTree {id: $treeId}) RETURN u.id as id`,
        { treeId: person.treeId }
      );
      for (const rec of admins.records) {
        await NotificationsService.createNotification(
          rec.get('id'),
          'claim_request_pending',
          'Profile Claim Request',
          `A user is requesting to claim the profile of ${person.firstName} ${person.lastName || ''}`,
          { personId, treeId: person.treeId }
        );
      }
    } finally {
      await session.close();
    }

    return { success: true, message: 'Claim request submitted for admin review' };
  }

  static async approveClaimRequest(requestId: string, adminId: string) {
    const request = await PeopleRepository.findClaimRequestById(requestId);
    if (!request) throw new AppError('Claim request not found', 404);
    if (request.status !== 'pending') throw new AppError('Request already processed', 400);

    const { personId, userId, treeId } = request;
    const session = getSession();
    
    try {
      // Perform the actual link (using the logic previously in claimProfile)
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
          `,
          { userId, oldId: currentPerson.id, newId: personId }
        );
      } else {
        await session.run(
          `
          MATCH (u:User {id: $userId}), (p:Person {id: $personId})
          CREATE (u)-[:REPRESENTS]->(p)
          SET p.status = 'active', p.accountId = $userId
          `,
          { userId, personId }
        );
      }

      await PeopleRepository.updateClaimRequestStatus(requestId, 'approved');

      await NotificationsService.createNotification(
        userId,
        'claim_approved',
        'Profile Claim Approved',
        `Your request to claim a profile has been approved.`,
        { treeId }
      );

      return { success: true };
    } finally {
      await session.close();
    }
  }

  static async rejectClaimRequest(requestId: string, adminId: string) {
    const request = await PeopleRepository.findClaimRequestById(requestId);
    if (!request) throw new AppError('Claim request not found', 404);
    
    await PeopleRepository.updateClaimRequestStatus(requestId, 'rejected');
    
    await NotificationsService.createNotification(
      request.userId,
      'claim_rejected',
      'Profile Claim Rejected',
      `Your request to claim a profile was rejected.`,
      { treeId: request.treeId }
    );

    return { success: true };
  }

  static async getPendingClaimRequests(treeId: string) {
    return PeopleRepository.getPendingClaimRequests(treeId);
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
      const l1Ids = level1.map(p => p.id).concat([rootPerson.id]);
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
}
