import { getSession } from '../../core/database';
import { v4 as uuidv4 } from 'uuid';
import { Memory, CreateMemoryInput, UpdateMemoryInput } from '../../shared/schemas/memories';
import { AppError } from '../../core/errors';

export class MemoriesRepository {
  static async create(posterId: string, input: CreateMemoryInput): Promise<Memory> {
    const session = getSession();
    try {
      const id = uuidv4();
      const { associatedPersonIds, treeId, ...rest } = input;
      const imageUrl = rest.imageUrl || null;
      
      // 1. Create Memory Node
      const params = { 
        ...rest, 
        content: rest.content || null,
        imageUrl, 
        id, 
        posterId, 
        treeId 
      };

      await session.run(
        `
        MATCH (t:FamilyTree {id: $treeId})
        MATCH (u:User {id: $posterId})
        CREATE (m:Memory {
          id: $id,
          treeId: $treeId,
          type: $type,
          title: $title,
          content: $content,
          imageUrl: $imageUrl,
          date: $date,
          posterId: $posterId,
          createdAt: timestamp()
        })
        CREATE (u)-[:POSTED]->(m)
        CREATE (m)-[:BELONGS_TO_TREE]->(t)
        `,
        params
      );

      // 2. Optional: Create Relationships
      if (associatedPersonIds && associatedPersonIds.length > 0) {
        await session.run(
          `
          MATCH (m:Memory {id: $id})
          UNWIND $associatedPersonIds AS personId
          MATCH (p:Person {id: personId, treeId: $treeId})
          CREATE (m)-[:ASSOCIATED_WITH]->(p)
          `,
          { id, associatedPersonIds, treeId }
        );
      }

      // 3. Return the fully formed memory
      return (await this.findById(id, treeId))!;
    } finally {
      await session.close();
    }
  }

  static async findByTreeId(treeId: string, limit: number = 50): Promise<Memory[]> {
    const session = getSession();
    try {
      const result = await session.run(
        `
        MATCH (m:Memory {treeId: $treeId})
        WHERE m.deletedAt IS NULL
        OPTIONAL MATCH (m)-[:ASSOCIATED_WITH]->(p:Person)
        RETURN m, collect({id: p.id, firstName: p.firstName, lastName: p.lastName}) as associatedPeople
        ORDER BY m.date DESC
        LIMIT toInteger($limit)
        `,
        { treeId, limit }
      );

      return result.records.map(r => ({
        ...this.mapRecordToMemory(r.get('m')),
        associatedPeople: r.get('associatedPeople').filter((p: any) => p.id !== null)
      }));
    } finally {
      await session.close();
    }
  }

  static async findByPersonId(treeId: string, personId: string): Promise<Memory[]> {
    const session = getSession();
    try {
      const result = await session.run(
        `
        MATCH (p:Person {id: $personId, treeId: $treeId})<-[:ASSOCIATED_WITH]-(m:Memory)
        WHERE m.deletedAt IS NULL
        OPTIONAL MATCH (m)-[:ASSOCIATED_WITH]->(other:Person)
        RETURN m, collect({id: other.id, firstName: other.firstName, lastName: other.lastName}) as associatedPeople
        ORDER BY m.date DESC
        `,
        { treeId, personId }
      );

      return result.records.map(r => ({
        ...this.mapRecordToMemory(r.get('m')),
        associatedPeople: r.get('associatedPeople').filter((p: any) => p.id !== null)
      }));
    } finally {
      await session.close();
    }
  }

  static async findById(id: string, treeId: string): Promise<Memory | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `
        MATCH (m:Memory {id: $id, treeId: $treeId})
        WHERE m.deletedAt IS NULL
        OPTIONAL MATCH (m)-[:ASSOCIATED_WITH]->(p:Person)
        RETURN m, collect({id: p.id, firstName: p.firstName, lastName: p.lastName}) as associatedPeople
        `,
        { id, treeId }
      );

      if (result.records.length === 0) return null;

      return {
        ...this.mapRecordToMemory(result.records[0].get('m')),
        associatedPeople: result.records[0].get('associatedPeople').filter((p: any) => p.id !== null)
      };
    } finally {
      await session.close();
    }
  }

  static async update(id: string, treeId: string, input: UpdateMemoryInput): Promise<Memory> {
    const session = getSession();
    try {
      const { associatedPersonIds, ...rest } = input;
      const keys = Object.keys(rest);
      
      let query = `MATCH (m:Memory {id: $id, treeId: $treeId}) WHERE m.deletedAt IS NULL `;
      
      if (keys.length > 0) {
        const setters = keys.map(key => `m.${key} = $${key}`).join(', ');
        query += `SET ${setters} `;
      }

      if (associatedPersonIds) {
        query += `
          WITH m
          OPTIONAL MATCH (m)-[r:ASSOCIATED_WITH]->(:Person)
          DELETE r
          WITH m
          UNWIND $associatedPersonIds AS personId
          MATCH (p:Person {id: personId, treeId: $treeId})
          CREATE (m)-[:ASSOCIATED_WITH]->(p)
        `;
      }

      query += ` RETURN m`;

      const result = await session.run(query, {
        id: id,
        treeId: treeId,
        associatedPersonIds: associatedPersonIds || [],
        type: rest.type,
        title: rest.title,
        content: rest.content,
        imageUrl: rest.imageUrl,
        date: rest.date
      });

      if (result.records.length === 0) {
        throw new AppError('Memory not found', 404);
      }

      // Re-fetch to get associated people correctly after update
      return (await this.findById(id, treeId))!;
    } finally {
      await session.close();
    }
  }

  static async softDelete(id: string, treeId: string, deletedBy: string): Promise<void> {
    const session = getSession();
    try {
      await session.run(
        `MATCH (m:Memory {id: $id, treeId: $treeId}) SET m.deletedAt = timestamp(), m.deletedBy = $deletedBy`,
        { id: id, treeId: treeId, deletedBy: deletedBy }
      );
    } finally {
      await session.close();
    }
  }

  private static mapRecordToMemory(node: any): Memory {
    if (!node) {
      throw new Error('Memory record not found');
    }
    const props = node.properties;
    return {
      ...props,
      date: typeof props.date === 'object' ? props.date.toNumber() : props.date,
      createdAt: typeof props.createdAt === 'object' ? props.createdAt.toNumber() : props.createdAt,
      deletedAt: props.deletedAt ? (typeof props.deletedAt === 'object' ? props.deletedAt.toNumber() : props.deletedAt) : undefined,
    };
  }
}
