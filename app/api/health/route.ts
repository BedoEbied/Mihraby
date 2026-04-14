import { NextResponse } from 'next/server';
import pool from '@/lib/db/connection';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Liveness + readiness probe for Railway and Coolify.
 *
 * Returns 200 when the process is up AND a trivial MySQL query succeeds.
 * Returns 503 when the DB probe fails — so the platform health check will
 * flip the service to "down" and hold traffic off until the DB recovers.
 *
 * No auth: intentional. Health checks are called by the platform without
 * credentials. This endpoint leaks nothing beyond liveness + DB reachability.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await pool.query('SELECT 1');
    return NextResponse.json(
      {
        status: 'ok',
        db: 'ok',
        uptime_s: Math.round(process.uptime()),
        check_ms: Date.now() - startedAt,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json(
      {
        status: 'degraded',
        db: 'down',
        uptime_s: Math.round(process.uptime()),
        check_ms: Date.now() - startedAt,
        error: message,
      },
      { status: 503 }
    );
  }
}
