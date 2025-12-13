/**
 * CRM API CheckAuth Proxy Route
 * POST /api/crm/checkAuth
 * 
 * Proxies token validation requests to the CRM API
 */

import { NextRequest, NextResponse } from 'next/server';

const CRM_API_BASE_URL = process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'https://pw-crm-gateway-1.onrender.com';

export async function POST(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Call CRM API from server-side (no CORS issues)
    const response = await fetch(`${CRM_API_BASE_URL}/checkAuth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Token validation failed' },
        { status: response.status }
      );
    }

    // CRM API returns a string response
    // CRM API returns a string response
    const data = await response.text();
    
    // Return as JSON string (to match expected format)
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('CRM API CheckAuth error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to validate token' 
      },
      { status: 500 }
    );
  }
}

