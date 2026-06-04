import { getSession } from '../../core/database';

export class UsersRepository {
  static async findById(id: string) {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $id}) RETURN u`,
        { id }
      );
      if (result.records.length === 0) return null;
      return result.records[0].get('u').properties;
    } finally {
      await session.close();
    }
  }

  static async getEmail(id: string): Promise<string | null> {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $id}) RETURN u.email as email`,
        { id }
      );
      if (result.records.length === 0) return null;
      return result.records[0].get('email');
    } finally {
      await session.close();
    }
  }

  static async syncUser(id: string, email: string) {
    const session = getSession();
    try {
      const result = await session.executeWrite(async (tx) => {
        const query = `
          MERGE (u:User {id: $id})
          SET u.email = $email, 
              u.lastSynced = timestamp(),
              u.createdAt = COALESCE(u.createdAt, timestamp())
          RETURN u
        `;
        const res = await tx.run(query, { id, email });
        return res.records[0].get('u').properties;
      });
      return result;
    } finally {
      await session.close();
    }
  }
}
