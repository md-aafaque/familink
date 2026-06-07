import neo4j from 'neo4j-driver';
import { config } from './config';

const driver = neo4j.driver(
  config.NEO4J_URI,
  neo4j.auth.basic(config.NEO4J_USER, config.NEO4J_PASSWORD)
);

export const getSession = () => driver.session();
export default driver;