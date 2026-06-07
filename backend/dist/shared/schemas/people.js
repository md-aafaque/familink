"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePersonSchema = exports.createPersonSchema = exports.personSchema = exports.visibilitySchema = void 0;
const zod_1 = require("zod");
exports.visibilitySchema = zod_1.z.enum(['private', 'editors', 'tree']).default('tree');
exports.personSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required"),
    lastName: zod_1.z.string().optional(),
    gender: zod_1.z.enum(['male', 'female', 'other', 'unknown']).default('unknown'),
    birthDate: zod_1.z.string().optional().nullable(),
    deathDate: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(['active', 'ghost', 'merged', 'archived', 'deceased']).default('ghost'),
    // Privacy Controls
    phone: zod_1.z.string().optional().nullable(),
    phoneVisibility: exports.visibilitySchema,
    email: zod_1.z.string().email().optional().nullable(),
    emailVisibility: exports.visibilitySchema,
    address: zod_1.z.string().optional().nullable(),
    addressVisibility: exports.visibilitySchema,
    birthDateVisibility: exports.visibilitySchema,
});
exports.createPersonSchema = exports.personSchema.extend({
    treeId: zod_1.z.string().uuid(),
});
exports.updatePersonSchema = exports.personSchema.partial();
