"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeNeo4jProperties = void 0;
/**
 * Normalizes Neo4j properties by converting Neo4j Integers to standard numbers.
 * This is necessary because the Neo4j driver returns BigInt-like objects for numbers.
 */
const normalizeNeo4jProperties = (props) => {
    if (!props)
        return props;
    const normalized = {};
    Object.entries(props).forEach(([key, value]) => {
        normalized[key] =
            typeof value === 'object' && value !== null && typeof value.toNumber === 'function'
                ? value.toNumber()
                : value;
    });
    return normalized;
};
exports.normalizeNeo4jProperties = normalizeNeo4jProperties;
