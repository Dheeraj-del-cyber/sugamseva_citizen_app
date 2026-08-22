import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './db.js';

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set. Please configure it in your Render dashboard under Environment.');
    process.exitCode = 1;
} else {
    const directory = dirname(fileURLToPath(import.meta.url));

    try {
        const sql = await fs.readFile(join(directory, 'schema.sql'), 'utf8');
        await pool.query(sql);
        console.log('Database schema is ready.');
    } catch (error) {
        console.error('Database migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}
