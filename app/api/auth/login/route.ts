/**
 * Login API Route
 * POST /api/auth/login
 * 
 * Proxies login requests to the backend API to avoid CORS issues
 * Backend: https://pw-crm-gateway-1.onrender.com/login
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'https://pw-crm-gateway-1.onrender.com';

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { user_name, email, password } = body;

    // Use user_name if provided, otherwise use email
    const username = user_name || email;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username/Email and password are required' },
        { status: 400 }
      );
    }

    // Call backend API from server-side (no CORS issues)
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(`${BACKEND_API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: username,
          password: password,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

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

      const data = await response.json();

      // Return response in format expected by frontend
      // Backend returns: { access_token, expires_at, role }
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        access_token: data.access_token,
        expires_at: data.expires_at,
        role: data.role,
        // Also include token for compatibility with existing code
        token: data.access_token,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout specifically
      if (fetchError.name === 'AbortError' || fetchError.code === 'UND_ERR_CONNECT_TIMEOUT') {
        console.error('Login API timeout:', fetchError);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Connection timeout: The backend server is taking too long to respond or may be unavailable. Please check if the backend service is running.',
            error: 'CONNECTION_TIMEOUT',
            backend_url: BACKEND_API_BASE_URL
          },
          { status: 504 } // Gateway Timeout
        );
      }
      
      // Handle other connection errors
      if (fetchError.message?.includes('fetch failed') || fetchError.code === 'ECONNREFUSED') {
        console.error('Login API connection error:', fetchError);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Cannot connect to backend server. Please verify the backend service is running and accessible.',
            error: 'CONNECTION_FAILED',
            backend_url: BACKEND_API_BASE_URL
          },
          { status: 503 } // Service Unavailable
        );
      }
      
      // Re-throw to be caught by outer catch
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to connect to backend API',
        error: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

