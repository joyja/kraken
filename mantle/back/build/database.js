"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
exports.pool = new pg_1.Pool({
    user: process.env.MANTLE_PGUSER,
    host: process.env.MANTLE_PGHOST,
    database: process.env.MANTLE_PGDATABASE,
    password: process.env.MANTLE_PGPASSWORD,
    port: process.env.MANTLE_PGPORT ? parseInt(process.env.MANTLE_PGPORT) : undefined,
    ssl: {
        rejectUnauthorized: false,
    },
});
