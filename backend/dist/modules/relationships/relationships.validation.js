"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipValidation = void 0;
const database_1 = require("../../core/database");
const errors_1 = require("../../core/errors");
class RelationshipValidation {
    static async validate(treeId, fromId, toId, type, excludeProposalId) {
        if (fromId === toId) {
            throw new errors_1.AppError('A person cannot have a relationship with themselves', 400);
        }
        const session = (0, database_1.getSession)();
        try {
            // 1. Verify existence
            const peopleResult = await session.run(`MATCH (p:Person) WHERE p.id IN [$fromId, $toId] AND p.treeId = $treeId RETURN p`, { fromId, toId, treeId });
            if (peopleResult.records.length < 2) {
                throw new errors_1.AppError('One or both people not found in this tree', 404);
            }
            const p1 = peopleResult.records.find(r => r.get('p').properties.id === fromId)?.get('p').properties;
            const p2 = peopleResult.records.find(r => r.get('p').properties.id === toId)?.get('p').properties;
            // 2. Age Check (Parent must be older)
            if (type === 'parent') {
                if (p1.birthDate && p2.birthDate) {
                    const parentBirth = new Date(p1.birthDate).getTime();
                    const childBirth = new Date(p2.birthDate).getTime();
                    if (parentBirth >= childBirth)
                        throw new errors_1.AppError('Parent must be born before the child', 400);
                    if ((childBirth - parentBirth) / (1000 * 60 * 60 * 24 * 365.25) < 12) {
                        // Logically suspicious but we only throw if truly impossible
                    }
                }
            }
            // 3. Duplicate/Equivalence Check logic
            const isBidirectional = ['spouse', 'sibling'].includes(type);
            const checkEquivalence = (otherType, otherFrom, otherTo) => {
                // Direct
                if (otherType === type && otherFrom === fromId && otherTo === toId)
                    return true;
                // Inverse Hierarchical
                if (type === 'parent' && otherType === 'child' && otherFrom === toId && otherTo === fromId)
                    return true;
                if (type === 'child' && otherType === 'parent' && otherFrom === toId && otherTo === fromId)
                    return true;
                if (type === 'parent' && otherType === 'adopted_child' && otherFrom === toId && otherTo === fromId)
                    return true;
                if (type === 'adopted_child' && otherType === 'parent' && otherFrom === toId && otherTo === fromId)
                    return true;
                // Bidirectional
                if (isBidirectional && otherType === type && otherFrom === toId && otherTo === fromId)
                    return true;
                return false;
            };
            // 4. Ancestry Cycle Detection
            if (type === 'parent') {
                // If A is parent of B, then B cannot already be an ancestor of A
                const cycleResult = await session.run(`MATCH (a:Person {id: $fromId, treeId: $treeId})
           MATCH (b:Person {id: $toId, treeId: $treeId})
           MATCH path = (b)-[:FAMILY_RELATIONSHIP* {type: 'parent', treeId: $treeId}]->(a)
           WHERE all(r in relationships(path) WHERE r.deletedAt IS NULL)
           RETURN path`, { fromId, toId, treeId });
                if (cycleResult.records.length > 0) {
                    throw new errors_1.AppError('This relationship would create an ancestry cycle (person cannot be their own ancestor)', 400);
                }
            }
            // 5a. Check Pending Proposals
            const pendingResult = await session.run(`MATCH (rp:RelationshipProposal {status: 'pending', treeId: $treeId})
         WHERE (rp.fromPersonId = $fromId AND rp.toPersonId = $toId)
            OR (rp.fromPersonId = $toId AND rp.toPersonId = $fromId)
         RETURN rp`, { fromId, toId, treeId });
            for (const record of pendingResult.records) {
                const rp = record.get('rp').properties;
                if (excludeProposalId && rp.id === excludeProposalId)
                    continue;
                if (checkEquivalence(rp.relationshipType, rp.fromPersonId, rp.toPersonId)) {
                    throw new errors_1.AppError(`A ${rp.relationshipType} proposal [ID: ${rp.id}] is already pending between these people`, 400);
                }
            }
            // 4b. Check Official Relationships
            const officialResult = await session.run(`MATCH (a:Person {id: $fromId, treeId: $treeId})-[r:FAMILY_RELATIONSHIP]-(b:Person {id: $toId, treeId: $treeId})
         WHERE r.deletedAt IS NULL
         RETURN r, startNode(r).id as startId`, { fromId, toId, treeId });
            for (const record of officialResult.records) {
                const r = record.get('r').properties;
                const startId = record.get('startId');
                const endId = startId === fromId ? toId : fromId;
                if (checkEquivalence(r.type, startId, endId)) {
                    throw new errors_1.AppError(`This relationship already exists in the tree`, 400);
                }
            }
        }
        finally {
            await session.close();
        }
    }
}
exports.RelationshipValidation = RelationshipValidation;
