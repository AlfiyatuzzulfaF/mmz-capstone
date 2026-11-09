import mysql, { type Pool, type PoolOptions } from 'mysql2/promise';

/**
 * Standardized result for database connectivity and health monitoring.
 * Complies with KNF-01 (Reliability) and KNF-03 (Data Security).
 */
export interface DatabaseHealthResult {
  isConnected: boolean;
  message: string;
  latencyMs?: number;
  timestamp: string;
  error?: string;
}

/**
 * Global singleton pool storage to prevent connection leaks during Next.js Hot Module Reload (HMR).
 */
const globalForDb = globalThis as unknown as {
  tidbPool: Pool | undefined;
};

/**
 * Builds resilient MySQL pool options configured for TiDB Cloud.
 * Enforces TLSv1.2 encryption, connection keep-alive, and idle connection reaping.
 */
function createPoolOptions(): PoolOptions {
  const isSslEnabled = process.env.DB_SSL !== 'false';

  return {
    host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: Number(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'test',
    ssl: isSslEnabled
      ? {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true,
        }
      : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 5,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    dateStrings: true,
  };
}

/**
 * Singleton TiDB Cloud MySQL connection pool instance.
 */
export const pool: Pool = globalForDb.tidbPool ?? mysql.createPool(createPoolOptions());

if (process.env.NODE_ENV !== 'production') {
  globalForDb.tidbPool = pool;
}

/**
 * Health-check helper function that safely executes `SELECT 1` to test the connection.
 * Sanitizes errors and logs operational status without exposing database passwords or tokens.
 *
 * @returns Promise<DatabaseHealthResult> Connectivity status, latency, and sanitized error if failed.
 */
export async function checkDatabaseConnection(): Promise<DatabaseHealthResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const connection = await pool.getConnection();
    try {
      await connection.query('SELECT 1 AS health_check');
      const latencyMs = Date.now() - startTime;

      return {
        isConnected: true,
        message: 'Koneksi ke basis data TiDB Cloud berhasil dan aktif.',
        latencyMs,
        timestamp,
      };
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    const rawErrorMessage =
      error instanceof Error ? error.message : 'Kesalahan jaringan atau basis data tidak dikenal';

    // Mask sensitive connection strings and passwords before logging or returning (KNF-01 & KNF-03)
    const sanitizedError = rawErrorMessage.replace(/(password=)[^&;]+/gi, '$1***');

    console.error(
      `[TiDB Pool Health Check Failure] [${timestamp}]: Gagal melakukan verifikasi koneksi pool. Galat:`,
      sanitizedError
    );

    return {
      isConnected: false,
      message: 'Gagal terhubung ke basis data TiDB Cloud.',
      timestamp,
      error: sanitizedError,
    };
  }
}
