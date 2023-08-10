import { Client, Pool } from 'pg'

export const pool = new Pool({
  user: process.env.MANTLE_PGUSER,
  host: process.env.MANTLE_PGHOST,
  database: process.env.MANTLE_PGDATABASE,
  password: process.env.MANTLE_PGPASSWORD,
  port: process.env.MANTLE_PGPORT ? parseInt(process.env.MANTLE_PGPORT) : undefined,
  ssl: {
    rejectUnauthorized: false,
  },
})