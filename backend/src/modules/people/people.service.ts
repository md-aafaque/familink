import { PeopleRepository } from './people.repository';
import { CreatePersonInput, UpdatePersonInput, Person } from '../../shared/schemas/people';
import { AppError } from '../../core/errors';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { TreesRepository } from '../trees/trees.repository';

import { getSignedUploadUrl } from '../../core/supabase';

export class PeopleService {
  static async getUploadUrl(treeId: string, fileName: string) {
    return getSignedUploadUrl(treeId, fileName);
  }

  static async createPerson(input: CreatePersonInput & { linkToId?: string }, userId: string) {
    const { linkToId, ...createInput } = input;
    const person = await PeopleRepository.create({ ...createInput, createdBy: userId });
    
    await AuditService.log(
      person.treeId,
      userId,
      'person_created',
      'Person',
      person.id,
      { firstName: person.firstName, lastName: person.lastName }
    );

    // If linkToId is provided, we automatically merge this new ghost profile into the existing one
    // This is useful for "re-using" an existing profile in a new part of the tree creation flow
    if (linkToId) {
      await this.mergePeople(person.id, linkToId, userId, person.treeId);
    }

    return person;
  }

  static async getPerson(id: string, treeId: string, userId: string): Promise<Partial<Person>> {
    const person = await PeopleRepository.findById(id, treeId);
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

    // Filter Occupation History
    if (person.occupations) {
      if (person.occupationSectionVisible === false) {
        filtered.occupations = [];
      } else {
        filtered.occupations = person.occupations.filter(o => o.visibility === 'tree');
      }
    }

    // Filter Education History
    if (person.educations) {
      if (person.educationSectionVisible === false) {
        filtered.educations = [];
      } else {
        filtered.educations = person.educations.filter(e => e.visibility === 'tree');
      }
    }

    return filtered;
  }

  static async updatePerson(id: string, treeId: string, input: UpdatePersonInput, userId: string) {
    const permission = await PeopleRepository.checkPermission(id, userId);
    if (permission !== 'owner' && permission !== 'editor') {
      throw new AppError('You do not have permission to edit this profile', 403);
    }

    const person = await PeopleRepository.update(id, treeId, input);

    await AuditService.log(
      person.treeId,
      userId,
      'person_updated',
      'Person',
      id,
      { fields: Object.keys(input) }
    );

    return person;
  }

  static async deletePerson(id: string, treeId: string, userId: string) {
    const permission = await PeopleRepository.checkPermission(id, userId);
    if (permission !== 'owner') {
      throw new AppError('Only owners or admins can delete profiles', 403);
    }

    const person = await PeopleRepository.findById(id, treeId);
    if (!person) throw new AppError('Person not found', 404);

    await PeopleRepository.softDelete(id, treeId, userId);

    await AuditService.log(
      person.treeId,
      userId,
      'person_deleted',
      'Person',
      id
    );
  }

  static async claimProfile(personId: string, userId: string) {
    // 1. Check if person is a ghost
    // Discovery use case: find by ID globally to get treeId
    const person = await PeopleRepository.findByIdGlobal(personId);
    if (!person) throw new AppError('Profile not found', 404);
    if (person.status !== 'ghost') throw new AppError('This profile is already claimed or active', 400);

    // 2. Create Request
    await PeopleRepository.createClaimRequest(personId, userId, person.treeId);

    // 3. Notify Admins
    const adminIds = await TreesRepository.getAdmins(person.treeId);
    for (const adminId of adminIds) {
      await NotificationsService.createNotification(
        adminId,
        'claim_request_pending',
        'Profile Claim Request',
        `A user is requesting to claim the profile of ${person.firstName} ${person.lastName || ''}`,
        { personId, treeId: person.treeId }
      );
    }

    return { success: true, message: 'Claim request submitted for admin review' };
  }

  static async approveClaimRequest(requestId: string, adminId: string) {
    const request = await PeopleRepository.findClaimRequestById(requestId);
    if (!request) throw new AppError('Claim request not found', 404);
    if (request.status !== 'pending') throw new AppError('Request already processed', 400);

    const { personId, userId, treeId } = request;
    
    // Perform the actual link
    await PeopleRepository.linkUserToPerson(userId, personId, treeId);

    await PeopleRepository.updateClaimRequestStatus(requestId, 'approved');

    await AuditService.log(
      treeId,
      adminId,
      'claim_approved',
      'Person',
      personId,
      { userId, requestId }
    );

    await NotificationsService.createNotification(
      userId,
      'claim_approved',
      'Profile Claim Approved',
      `Your request to claim a profile has been approved.`,
      { treeId }
    );

    return { success: true };
  }

  static async rejectClaimRequest(requestId: string, adminId: string) {
    const request = await PeopleRepository.findClaimRequestById(requestId);
    if (!request) throw new AppError('Claim request not found', 404);
    
    await PeopleRepository.updateClaimRequestStatus(requestId, 'rejected');
    
    await AuditService.log(
      request.treeId,
      adminId,
      'claim_rejected',
      'ClaimRequest',
      requestId
    );

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

  static async mergePeople(sourceId: string, targetId: string, userId: string, treeId: string) {
    // 1. Authorization: Only admins can merge
    const isAdmin = await TreesRepository.isAdmin(treeId, userId);
    if (!isAdmin) {
      throw new AppError('Only tree admins can merge profiles', 403);
    }

    // 2. Existence & Same Tree Check
    const source = await PeopleRepository.findById(sourceId, treeId);
    const target = await PeopleRepository.findById(targetId, treeId);

    if (!source || !target) throw new AppError('One or both profiles not found', 404);
    if (source.treeId !== treeId || target.treeId !== treeId) {
      throw new AppError('Profiles must belong to the same tree', 400);
    }
    if (sourceId === targetId) throw new AppError('Cannot merge a profile into itself', 400);

    // 3. Perform Merge
    await PeopleRepository.mergePeople(sourceId, targetId, treeId, userId);

    // 4. Audit Log
    await AuditService.log(
      treeId,
      userId,
      'person_merged',
      'Person',
      targetId,
      { sourceId, action: 'merge' }
    );

    return { success: true };
  }

  static async getPermissions(personId: string, treeId: string, userId: string) {
    const permission = await PeopleRepository.checkPermission(personId, userId);
    if (permission !== 'owner') {
      throw new AppError('Only owners and tree admins can view detailed permissions', 403);
    }
    return PeopleRepository.getPermissions(personId);
  }

  static async grantPermission(personId: string, treeId: string, targetUserId: string, permissionType: 'owner' | 'editor', adminId: string) {
    const permission = await PeopleRepository.checkPermission(personId, adminId);
    if (permission !== 'owner') {
      throw new AppError('Only owners and tree admins can grant permissions', 403);
    }

    await PeopleRepository.grantPermission(personId, targetUserId, permissionType);
    
    // Log Audit
    const person = await PeopleRepository.findById(personId, treeId);
    if (person) {
      await AuditService.log(
        person.treeId,
        adminId,
        'permission_granted',
        'Person',
        personId,
        { targetUserId, permissionType }
      );
    }

    // Notify the user
    await NotificationsService.createNotification(
      targetUserId,
      'permission_granted',
      'Permissions Granted',
      `You have been granted ${permissionType} rights on a profile.`,
      { personId }
    );

    return { success: true };
  }

  static async revokePermission(personId: string, treeId: string, targetUserId: string, adminId: string) {
    const permission = await PeopleRepository.checkPermission(personId, adminId);
    if (permission !== 'owner') {
      throw new AppError('Only owners and tree admins can revoke permissions', 403);
    }

    await PeopleRepository.revokePermission(personId, targetUserId);

    // Log Audit
    const person = await PeopleRepository.findById(personId, treeId);
    if (person) {
      await AuditService.log(
        person.treeId,
        adminId,
        'permission_revoked',
        'Person',
        personId,
        { targetUserId }
      );
    }

    return { success: true };
  }

  static async listPeople(treeId: string) {
    return PeopleRepository.listPeople(treeId);
  }

  static async getNeighborhood(treeId: string, userId: string) {
    return PeopleRepository.getNeighborhood(treeId, userId);
  }
}
