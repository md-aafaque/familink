"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSession = void 0;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const config_1 = require("./config");
const driver = neo4j_driver_1.default.driver(config_1.config.NEO4J_URI, neo4j_driver_1.default.auth.basic(config_1.config.NEO4J_USER, config_1.config.NEO4J_PASSWORD));
const getSession = () => driver.session();
exports.getSession = getSession;
exports.default = driver;
