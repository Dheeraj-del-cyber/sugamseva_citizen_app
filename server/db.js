import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not configured. The API will start, but database requests will fail until PostgreSQL is configured.');
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    // Render PostgreSQL uses a self-signed certificate on its private connection.
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export async function query(text, params) {
    return pool.query(text, params);
}
