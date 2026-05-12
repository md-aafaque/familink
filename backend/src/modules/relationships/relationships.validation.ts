import { getSession } from '../../core/database';
import { RelationshipType } from '@shared/schemas/relationships';
import { AppError } from '../../core/errors';

export class RelationshipValidation {
  static async validate(
    treeId: string,
    fromId: string,
    toId: string,
    type: RelationshipType
  ): Promise<void> {
    if (fromId === toId) {
      throw new AppError("A person cannot have a relationship with themselves", 400);
    }

    const session = getSession();
    try {
      // 1. Fetch both people to check existence and ages
      const peopleResult = await session.run(
        `MATCH (p:Person) WHERE p.id IN [$fromId, $toId] AND p.treeId = $treeId RETURN p`,
        { fromId, toId, treeId }
      );

      if (peopleResult.records.length < 2) {
        throw new AppError("One or both people not found in this tree", 404);
      }

      const p1 = peopleResult.records.find(r => r.get('p').properties.id === fromId)?.get('p').properties;
      const p2 = peopleResult.records.find(r => r.get('p').properties.id === toId)?.get('p').properties;

      // 2. Age Validation (if dates available)
      if (type === 'parent') {
        // fromId is Parent, toId is Child
        if (p1.birthDate && p2.birthDate) {
          const birth1 = new Date(p1.birthDate).getTime();
          const birth2 = new Date(p2.birthDate).getTime();
          if (birth1 >= birth2) {
            throw new AppError("Parent must be born before the child", 400);
          }
          
          // Optional: Check if parent was reasonably old enough (e.g., at least 12 years old)
          const ageDiffYears = (birth2 - birth1) / (1000 * 60 * 60 * 24 * 365.25);
          if (ageDiffYears < 12) {
             // We'll allow it but maybe in the future we return a warning instead of error
             // For now, let's just stick to the hard 'must be older'
          }
        }
      }

      // 3. Cycle Prevention (Only for hierarchical relationships like parent)
      if (type === 'parent') {
        // If we make A parent of B, check if B is already an ancestor of A
        const cycleResult = await session.run(
          `
          MATCH (a:Person {id: $fromId}), (b:Person {id: $toId})
          OPTIONAL MATCH path = (b)-[:FAMILY_RELATIONSHIP* {type: 'parent'}]->(a)
          RETURN count(path) > 0 as hasCycle
          `,
          { fromId, toId }
        );

        if (cycleResult.records[0].get('hasCycle')) {
          throw new AppError("This relationship would create an ancestry cycle (the child is already an ancestor of the parent)", 400);
        }
      }

      // 4. Duplicate Check
      const dupResult = await session.run(
        `
        MATCH (a:Person {id: $fromId})-[r:FAMILY_RELATIONSHIP {type: $type}]->(b:Person {id: $toId})
        RETURN count(r) > 0 as exists
        `,
        { fromId, toId, type }
      );

      if (dupResult.records[0].get('exists')) {
        throw new AppError(`This ${type} relationship already exists`, 400);
      }

    } finally {
      await session.close();
    }
  }
}
