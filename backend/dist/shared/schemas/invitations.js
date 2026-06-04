"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimProfileSchema = exports.rejectAccessRequestSchema = exports.createAdminInvitationSchema = exports.generateInvitationSchema = exports.accessRoleSchema = exports.publicInvitationRoleSchema = void 0;
const zod_1 = require("zod");
exports.publicInvitationRoleSchema = zod_1.z.enum(['member', 'viewer']);
exports.accessRoleSchema = zod_1.z.enum(['admin', 'member', 'viewer']);
exports.generateInvitationSchema = zod_1.z.object({
    role: exports.publicInvitationRoleSchema,
});
exports.createAdminInvitationSchema = zod_1.z.object({
    email: zod_1.z.string().email().transform((value) => value.trim().toLowerCase()),
});
exports.rejectAccessRequestSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(1, 'Rejection reason is required'),
});
exports.claimProfileSchema = zod_1.z.object({
    personId: zod_1.z.string().uuid(),
});
