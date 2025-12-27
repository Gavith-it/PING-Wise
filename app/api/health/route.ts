/**
 * Health Check API Route
 * GET /api/health
 * 
 * Calls the real backend API health endpoint
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'https://pw-crm-gateway-1.onrender.com';

export async function GET() {
  try {
    // Call the real backend health API
    const response = await axios.get(`${BACKEND_BASE_URL}/health`, {
      timeout: 5000, // 5 second timeout
    });

    return NextResponse.json({
      status: 'OK',
      message: 'Backend API is healthy',
      backend: response.data || { status: 'OK' },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    // If backend is down, still return a response but indicate the issue
    return NextResponse.json({
      status: 'ERROR',
      message: 'Backend API health check failed',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 }); // Service Unavailable
  }
}

