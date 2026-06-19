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

  static async syncUser(id: string, email: string, name: string) {
    const session = getSession();
    try {
      const result = await session.executeWrite(async (tx) => {
        const query = `
          MERGE (u:User {id: $id})
          SET u.email = $email,
              u.name = $name,
              u.lastSynced = timestamp(),
              u.createdAt = COALESCE(u.createdAt, timestamp())
          RETURN u
        `;
        const res = await tx.run(query, { id, email, name });
        return res.records[0].get('u').properties;
      });
      return result;
    } finally {
      await session.close();
    }
  }

  static async updateProfile(id: string, updates: any) {
    const session = getSession();
    try {
      const result = await session.executeWrite(async (tx) => {
        // Handle notificationPreferences serialization if it's an object
        const params = { ...updates, id };
        if (params.notificationPreferences && typeof params.notificationPreferences === 'object') {
          params.notificationPreferences = JSON.stringify(params.notificationPreferences);
        }

        let setClause = Object.keys(updates)
          .map(key => `u.${key} = $${key}`)
          .join(', ');

        if (!setClause) return (await this.findById(id));

        const query = `
          MATCH (u:User {id: $id})
          SET ${setClause}, u.updatedAt = timestamp()
          RETURN u
        `;
        const res = await tx.run(query, params);
        if (res.records.length === 0) return null;
        return res.records[0].get('u').properties;
      });
      return result;
    } finally {
      await session.close();
    }
  }

  static async deleteUser(id: string) {
    const session = getSession();
    try {
      await session.executeWrite(async (tx) => {
        await tx.run(
          `MATCH (u:User {id: $id}) DETACH DELETE u`,
          { id }
        );
      });
      return true;
    } finally {
      await session.close();
    }
  }
}
