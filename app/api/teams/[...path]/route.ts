/**
 * Team API Proxy Route - Catch-all
 * Handles all Team API endpoints: /api/teams/{id}, etc.
 * 
 * Proxies requests to the backend API to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'https://pw-crm-gateway-1.onrender.com';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params, 'GET');
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params, 'POST');
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params, 'PUT');
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(req, params, 'DELETE');
}

async function handleRequest(
  req: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // Reconstruct the path (e.g., ['123'] -> '/teams/123')
    const path = params.path && params.path.length > 0 
      ? '/teams/' + params.path.join('/')
      : '/teams';
    
    // Get token from Authorization header (case-insensitive)
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = queryString 
      ? `${BACKEND_API_BASE_URL}${path}?${queryString}`
      : `${BACKEND_API_BASE_URL}${path}`;

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Get body for POST/PUT requests
    let body: string | undefined;
    if (method === 'POST' || method === 'PUT') {
      try {
        const reqBody = await req.json();
        body = JSON.stringify(reqBody);
      } catch {
        // No body or invalid JSON
      }
    }

    // Call backend API from server-side (no CORS issues)
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Team API Proxy] ${method} ${path} - Status: ${response.status}`);
    }

    // Check for error status codes
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Team API Proxy] Error ${response.status}:`, errorText);
      
      return NextResponse.json(
        { 
          error: `API returned ${response.status}`,
          message: errorText,
          path 
        },
        { status: response.status }
      );
    }

    // Get response data
    const contentType = response.headers.get('content-type');
    let data: any;
    
    try {
      const responseText = await response.text();
      
      // Log raw response in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Team API Proxy] Response body:`, responseText.substring(0, 200));
      }
      
      if (contentType && contentType.includes('application/json')) {
        if (responseText.trim() === '' || responseText.trim() === 'null') {
          data = null;
        } else {
          data = JSON.parse(responseText);
        }
      } else {
        // For DELETE, might return plain string
        data = responseText;
      }
    } catch (parseError) {
      console.error('[Team API Proxy] Error parsing response:', parseError);
      data = null;
    }

    // Return response with same status
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error(`Team API Proxy error (${method}):`, error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to connect to backend API' 
      },
      { status: 500 }
    );
  }
}

