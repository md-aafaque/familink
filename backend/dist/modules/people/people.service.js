"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeopleService = void 0;
const people_repository_1 = require("./people.repository");
const errors_1 = require("../../core/errors");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
const trees_repository_1 = require("../trees/trees.repository");
class PeopleService {
    static async createPerson(input, userId) {
        const person = await people_repository_1.PeopleRepository.create({ ...input, createdBy: userId });
        await audit_service_1.AuditService.log(person.treeId, userId, 'person_created', 'Person', person.id, { firstName: person.firstName, lastName: person.lastName });
        return person;
    }
    static async getPerson(id, treeId, userId) {
        const person = await people_repository_1.PeopleRepository.findById(id, treeId);
        if (!person)
            throw new errors_1.AppError('Person not found', 404);
        const permission = await people_repository_1.PeopleRepository.checkPermission(id, userId);
        if (!permission)
            throw new errors_1.AppError('Access denied', 403);
        // If owner or editor, return full profile
        if (permission === 'owner' || permission === 'editor') {
            return person;
        }
        // Otherwise, filter based on privacy settings
        const filtered = { ...person };
        if (person.phoneVisibility !== 'tree')
            delete filtered.phone;
        if (person.emailVisibility !== 'tree')
            delete filtered.email;
        if (person.addressVisibility !== 'tree')
            delete filtered.address;
        if (person.birthDateVisibility !== 'tree')
            delete filtered.birthDate;
        return filtered;
    }
    static async updatePerson(id, treeId, input, userId) {
        const permission = await people_repository_1.PeopleRepository.checkPermission(id, userId);
        if (permission !== 'owner' && permission !== 'editor') {
            throw new errors_1.AppError('You do not have permission to edit this profile', 403);
        }
        const person = await people_repository_1.PeopleRepository.update(id, treeId, input);
        await audit_service_1.AuditService.log(person.treeId, userId, 'person_updated', 'Person', id, { fields: Object.keys(input) });
        return person;
    }
    static async deletePerson(id, treeId, userId) {
        const permission = await people_repository_1.PeopleRepository.checkPermission(id, userId);
        if (permission !== 'owner') {
            throw new errors_1.AppError('Only owners or admins can delete profiles', 403);
        }
        const person = await people_repository_1.PeopleRepository.findById(id, treeId);
        if (!person)
            throw new errors_1.AppError('Person not found', 404);
        await people_repository_1.PeopleRepository.softDelete(id, treeId, userId);
        await audit_service_1.AuditService.log(person.treeId, userId, 'person_deleted', 'Person', id);
    }
    static async claimProfile(personId, userId) {
        // 1. Check if person is a ghost
        // Discovery use case: find by ID globally to get treeId
        const person = await people_repository_1.PeopleRepository.findByIdGlobal(personId);
        if (!person)
            throw new errors_1.AppError('Profile not found', 404);
        if (person.status !== 'ghost')
            throw new errors_1.AppError('This profile is already claimed or active', 400);
        // 2. Create Request
        await people_repository_1.PeopleRepository.createClaimRequest(personId, userId, person.treeId);
        // 3. Notify Admins
        const adminIds = await trees_repository_1.TreesRepository.getAdmins(person.treeId);
        for (const adminId of adminIds) {
            await notifications_service_1.NotificationsService.createNotification(adminId, 'claim_request_pending', 'Profile Claim Request', `A user is requesting to claim the profile of ${person.firstName} ${person.lastName || ''}`, { personId, treeId: person.treeId });
        }
        return { success: true, message: 'Claim request submitted for admin review' };
    }
    static async approveClaimRequest(requestId, adminId) {
        const request = await people_repository_1.PeopleRepository.findClaimRequestById(requestId);
        if (!request)
            throw new errors_1.AppError('Claim request not found', 404);
        if (request.status !== 'pending')
            throw new errors_1.AppError('Request already processed', 400);
        const { personId, userId, treeId } = request;
        // Perform the actual link
        await people_repository_1.PeopleRepository.linkUserToPerson(userId, personId, treeId);
        await people_repository_1.PeopleRepository.updateClaimRequestStatus(requestId, 'approved');
        await audit_service_1.AuditService.log(treeId, adminId, 'claim_approved', 'Person', personId, { userId, requestId });
        await notifications_service_1.NotificationsService.createNotification(userId, 'claim_approved', 'Profile Claim Approved', `Your request to claim a profile has been approved.`, { treeId });
        return { success: true };
    }
    static async rejectClaimRequest(requestId, adminId) {
        const request = await people_repository_1.PeopleRepository.findClaimRequestById(requestId);
        if (!request)
            throw new errors_1.AppError('Claim request not found', 404);
        await people_repository_1.PeopleRepository.updateClaimRequestStatus(requestId, 'rejected');
        await audit_service_1.AuditService.log(request.treeId, adminId, 'claim_rejected', 'ClaimRequest', requestId);
        await notifications_service_1.NotificationsService.createNotification(request.userId, 'claim_rejected', 'Profile Claim Rejected', `Your request to claim a profile was rejected.`, { treeId: request.treeId });
        return { success: true };
    }
    static async getPendingClaimRequests(treeId) {
        return people_repository_1.PeopleRepository.getPendingClaimRequests(treeId);
    }
    static async mergePeople(sourceId, targetId, userId, treeId) {
        // 1. Authorization: Only admins can merge
        const isAdmin = await trees_repository_1.TreesRepository.isAdmin(treeId, userId);
        if (!isAdmin) {
            throw new errors_1.AppError('Only tree admins can merge profiles', 403);
        }
        // 2. Existence & Same Tree Check
        const source = await people_repository_1.PeopleRepository.findById(sourceId, treeId);
        const target = await people_repository_1.PeopleRepository.findById(targetId, treeId);
        if (!source || !target)
            throw new errors_1.AppError('One or both profiles not found', 404);
        if (source.treeId !== treeId || target.treeId !== treeId) {
            throw new errors_1.AppError('Profiles must belong to the same tree', 400);
        }
        if (sourceId === targetId)
            throw new errors_1.AppError('Cannot merge a profile into itself', 400);
        // 3. Perform Merge
        await people_repository_1.PeopleRepository.mergePeople(sourceId, targetId, treeId, userId);
        // 4. Audit Log
        await audit_service_1.AuditService.log(treeId, userId, 'person_merged', 'Person', targetId, { sourceId, action: 'merge' });
        return { success: true };
    }
    static async getPermissions(personId, treeId, userId) {
        const permission = await people_repository_1.PeopleRepository.checkPermission(personId, userId);
        if (permission !== 'owner') {
            throw new errors_1.AppError('Only owners and tree admins can view detailed permissions', 403);
        }
        return people_repository_1.PeopleRepository.getPermissions(personId);
    }
    static async grantPermission(personId, treeId, targetUserId, permissionType, adminId) {
        const permission = await people_repository_1.PeopleRepository.checkPermission(personId, adminId);
        if (permission !== 'owner') {
            throw new errors_1.AppError('Only owners and tree admins can grant permissions', 403);
        }
        await people_repository_1.PeopleRepository.grantPermission(personId, targetUserId, permissionType);
        // Log Audit
        const person = await people_repository_1.PeopleRepository.findById(personId, treeId);
        if (person) {
            await audit_service_1.AuditService.log(person.treeId, adminId, 'permission_granted', 'Person', personId, { targetUserId, permissionType });
        }
        // Notify the user
        await notifications_service_1.NotificationsService.createNotification(targetUserId, 'permission_granted', 'Permissions Granted', `You have been granted ${permissionType} rights on a profile.`, { personId });
        return { success: true };
    }
    static async revokePermission(personId, treeId, targetUserId, adminId) {
        const permission = await people_repository_1.PeopleRepository.checkPermission(personId, adminId);
        if (permission !== 'owner') {
            throw new errors_1.AppError('Only owners and tree admins can revoke permissions', 403);
        }
        await people_repository_1.PeopleRepository.revokePermission(personId, targetUserId);
        // Log Audit
        const person = await people_repository_1.PeopleRepository.findById(personId, treeId);
        if (person) {
            await audit_service_1.AuditService.log(person.treeId, adminId, 'permission_revoked', 'Person', personId, { targetUserId });
        }
        return { success: true };
    }
    static async listPeople(treeId) {
        return people_repository_1.PeopleRepository.listPeople(treeId);
    }
    static async getNeighborhood(treeId, userId) {
        return people_repository_1.PeopleRepository.getNeighborhood(treeId, userId);
    }
}
exports.PeopleService = PeopleService;
