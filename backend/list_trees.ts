import { getSession } from './src/core/database';
import { normalizeNeo4jProperties } from './src/core/database-utils';

async function run() {
  const session = getSession();
  try {
    const result = await session.run('MATCH (t:FamilyTree) RETURN t.id as id, t.name as name LIMIT 5');
    console.log(result.records.map(r => ({ id: r.get('id'), name: r.get('name') })));
  } finally {
    await session.close();
  }
}
run();
