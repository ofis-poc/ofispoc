import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL environment variable is not defined. PostgreSQL connection is not established.');
}

// Set up the pool with SSL settings appropriate for Neon PostgreSQL / Vercel
const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('neon.tech') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
});

/**
 * Execute a query with parameters and return the resulting rows.
 * Includes defensive logging and error handling.
 */
export async function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed Query:', { text, durationMs: duration, rowCount: res.rowCount });
    }
    return res.rows as T[];
  } catch (error) {
    const err = error as Error;
    console.error('Database query failure:', {
      sql: text,
      params,
      errorMessage: err.message,
      stack: err.stack,
    });
    throw error;
  }
}

/**
 * Get a client from the pool. Useful for transactions.
 */
export async function getClient() {
  try {
    return await pool.connect();
  } catch (error) {
    const err = error as Error;
    console.error('Failed to acquire database client from pool:', err.message);
    throw error;
  }
}

export default pool;
