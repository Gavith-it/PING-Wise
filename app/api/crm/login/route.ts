/**
 * CRM API Login Proxy Route
 * POST /api/crm/login
 * 
 * Proxies login requests to the CRM API to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { CrmLoginRequest, CrmTokenResponse } from '@/types/crmApi';

const CRM_API_BASE_URL = process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'https://pw-crm-gateway-1.onrender.com';

export async function POST(req: NextRequest) {
  try {
    const body: CrmLoginRequest = await req.json();
    const { user_name, password } = body;

    if (!user_name || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Call CRM API from server-side (no CORS issues)
    const response = await fetch(`${CRM_API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_name, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Login failed',
          error: response.status === 401 ? 'Invalid credentials' : 'Server error'
        },
        { status: response.status }
      );
    }

    const data: CrmTokenResponse = await response.json();

    // Return token response in same format as CRM API (access_token, expires_at, role)
    return NextResponse.json({
      access_token: data.access_token,
      expires_at: data.expires_at,
      role: data.role,
    });
  } catch (error: any) {
    console.error('CRM API Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to connect to CRM API' 
      },
      { status: 500 }
    );
  }
}

