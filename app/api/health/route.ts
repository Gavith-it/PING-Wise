/**
 * Health Check API Route
 * GET /api/health
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'PingWise API is running',
    timestamp: new Date().toISOString()
  });
}

