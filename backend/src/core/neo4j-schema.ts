import driver from './database';

const INDEX_QUERIES = [
  'CREATE INDEX IF NOT EXISTS FOR (u:User) ON (u.id)',
  'CREATE INDEX IF NOT EXISTS FOR (p:Person) ON (p.id)',
  'CREATE INDEX IF NOT EXISTS FOR (p:Person) ON (p.treeId)',
  'CREATE INDEX IF NOT EXISTS FOR (t:FamilyTree) ON (t.id)',
  'CREATE INDEX IF NOT EXISTS FOR (t:FamilyTree) ON (t.createdBy)',
  'CREATE INDEX IF NOT EXISTS FOR (n:Notification) ON (n.userId)',
  'CREATE INDEX IF NOT EXISTS FOR (r:Relationship) ON (r.id)',
  'CREATE INDEX IF NOT EXISTS FOR (r:Relationship) ON (r.treeId)',
  'CREATE INDEX IF NOT EXISTS FOR (m:Memory) ON (m.treeId)',
  'CREATE INDEX IF NOT EXISTS FOR (i:Invitation) ON (i.token)',
];

export async function ensureIndexes(): Promise<void> {
  const session = driver.session();
  try {
    for (const query of INDEX_QUERIES) {
      await session.run(query);
    }
    console.log('[Neo4j] Indexes ensured successfully');
  } catch (error) {
    console.error('[Neo4j] Failed to create indexes:', error);
    throw error;
  } finally {
    await session.close();
  }
}
