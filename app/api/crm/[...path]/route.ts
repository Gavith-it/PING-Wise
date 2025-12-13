/**
 * CRM API Proxy Route - Catch-all
 * Handles all CRM API endpoints: /api/crm/customers, /api/crm/teams, etc.
 * 
 * Proxies requests to the CRM API to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';

const CRM_API_BASE_URL = process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'https://pw-crm-gateway-1.onrender.com';

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
    // Reconstruct the path (e.g., ['customers', '123'] -> '/customers/123')
    const path = '/' + params.path.join('/');
    
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = queryString 
      ? `${CRM_API_BASE_URL}${path}?${queryString}`
      : `${CRM_API_BASE_URL}${path}`;

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

    // Call CRM API from server-side (no CORS issues)
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CRM Proxy] ${method} ${path} - Status: ${response.status}`);
    }

    // Check for error status codes
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[CRM Proxy] Error ${response.status}:`, errorText);
      
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
        console.log(`[CRM Proxy] Response body:`, responseText.substring(0, 200));
      }
      
      if (contentType && contentType.includes('application/json')) {
        if (responseText.trim() === '' || responseText.trim() === 'null') {
          // Handle empty or null JSON response - set to null, will be normalized below
          data = null;
        } else {
          data = JSON.parse(responseText);
          // JSON.parse("null") returns JavaScript null
          if (data === null) {
            data = null; // Keep as null, will be normalized for /customers endpoint
          }
        }
      } else {
        // Try to parse as JSON anyway
        try {
          if (responseText.trim() === '' || responseText.trim() === 'null') {
            data = null;
          } else {
            data = JSON.parse(responseText);
            if (data === null) {
              data = null; // Keep as null
            }
          }
        } catch {
          data = responseText;
        }
      }
    } catch (parseError) {
      console.error('[CRM Proxy] Error parsing response:', parseError);
      data = null;
    }

    // Normalize null to empty array for GET /customers endpoint
    // This handles the case where API returns null instead of [] when no customers exist
    if (method === 'GET' && path === '/customers' && (data === null || data === undefined)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CRM Proxy] Normalizing null response to empty array for /customers');
      }
      data = [];
    }

    // Return response with same status
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error(`CRM API Proxy error (${method}):`, error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to connect to CRM API' 
      },
      { status: 500 }
    );
  }
}

