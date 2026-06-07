"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTreeSchema = void 0;
const zod_1 = require("zod");
exports.createTreeSchema = zod_1.z.object({
    name: zod_1.z.string().min(4, "Tree name must be at least 4 characters long").max(100, "Tree name too long"),
});
