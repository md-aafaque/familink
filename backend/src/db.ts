import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';

// Only set encryption config if NOT already specified in URI scheme
const driverConfig: any = {};
if (!uri.includes('+s://')) {
  // Plain schemes: bolt:// or neo4j:// need explicit config
  driverConfig.encrypted = 'ENCRYPTION_OFF';
}

const driver = neo4j.driver(
  uri,
  neo4j.auth.basic(user, password),
  driverConfig
);

export function getSession() {
  return driver.session();
}

export default driver;
