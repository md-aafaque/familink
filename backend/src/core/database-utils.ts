/**
 * Normalizes Neo4j properties by converting Neo4j Integers to standard numbers.
 * This is necessary because the Neo4j driver returns BigInt-like objects for numbers.
 */
export const normalizeNeo4jProperties = (props: Record<string, any>) => {
  if (!props) return props;
  
  const normalized: Record<string, any> = {};

  Object.entries(props).forEach(([key, value]) => {
    normalized[key] =
      typeof value === 'object' && value !== null && typeof value.toNumber === 'function'
        ? value.toNumber()
        : value;
  });

  return normalized;
};
