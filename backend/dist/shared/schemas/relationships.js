"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectProposalSchema = exports.createProposalSchema = exports.relationshipTypeSchema = void 0;
const zod_1 = require("zod");
exports.relationshipTypeSchema = zod_1.z.enum([
    'parent',
    'child',
    'spouse',
    'sibling',
    'adopted_child'
]);
exports.createProposalSchema = zod_1.z.object({
    treeId: zod_1.z.string().uuid(),
    fromPersonId: zod_1.z.string().uuid(),
    toPersonId: zod_1.z.string().uuid(),
    relationshipType: exports.relationshipTypeSchema,
});
exports.rejectProposalSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1, "Reason is required for rejection"),
});
