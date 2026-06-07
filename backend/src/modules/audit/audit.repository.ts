import { getSession } from '../../core/database';
import { v4 as uuidv4 } from 'uuid';
import { AuditAction } from './audit.service';

export class AuditRepository {
  static async log(
    treeId: string,
    actorId: string,
    actionType: AuditAction,
    entityType: string,
    entityId: string,
    metadata: any = {}
  ) {
    const session = getSession();
    try {
      const id = uuidv4();
      await session.run(
        `CREATE (a:ActivityLog {
          id: $id,
          treeId: $treeId,
          actorId: $actorId,
          actionType: $actionType,
          entityType: $entityType,
          entityId: $entityId,
          createdAt: timestamp(),
          metadata: $metadata
        })`,
        { 
          id, 
          treeId, 
          actorId, 
          actionType, 
          entityType, 
          entityId, 
          metadata: JSON.stringify(metadata) 
        }
      );
    } finally {
      await session.close();
    }
  }

  static async findByTreeId(treeId: string, limit: number = 50) {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (a:ActivityLog {treeId: $treeId})
         MATCH (u:User {id: a.actorId})
         RETURN a, u.name as actorName, u.email as actorEmail
         ORDER BY a.createdAt DESC
         LIMIT toInteger($limit)`,
        { treeId, limit }
      );

      return result.records.map(r => ({
        ...r.get('a').properties,
        actorName: r.get('actorName'),
        actorEmail: r.get('actorEmail')
      }));
    } finally {
      await session.close();
    }
  }
}
