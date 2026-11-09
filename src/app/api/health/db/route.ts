import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/db
 * Operates as an automated or manual health check endpoint for TiDB Cloud connectivity.
 */
export async function GET() {
  const health = await checkDatabaseConnection();
  const statusCode = health.isConnected ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
