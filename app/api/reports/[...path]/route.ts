/**
 * Reports API Proxy Route - Catch-all
 * Handles all Reports API endpoints: /api/reports/daily, etc.
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

async function handleRequest(
  req: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // Reconstruct the path (e.g., ['daily'] -> '/reports/daily')
    const path = params.path && params.path.length > 0 
      ? `/reports/${params.path.join('/')}`
      : '/reports';
    
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

    // Get body for POST requests
    let body: string | undefined;
    if (method === 'POST') {
      try {
        const reqBody = await req.json();
        body = JSON.stringify(reqBody);
      } catch {
        // No body or invalid JSON
      }
    }

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // Call CRM API from server-side (no CORS issues)
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Log request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Reports Proxy] ${method} ${path} - Status: ${response.status}`);
      }

      // Check for error status codes
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`[Reports Proxy] Error ${response.status}:`, errorText);
        
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
          console.log(`[Reports Proxy] Response body:`, responseText.substring(0, 200));
        }
        
        if (contentType && contentType.includes('application/json')) {
          if (responseText.trim() === '' || responseText.trim() === 'null') {
            data = null;
          } else {
            data = JSON.parse(responseText);
          }
        } else {
          // Try to parse as JSON anyway
          try {
            if (responseText.trim() === '' || responseText.trim() === 'null') {
              data = null;
            } else {
              data = JSON.parse(responseText);
            }
          } catch {
            data = responseText;
          }
        }
      } catch (parseError) {
        console.error('[Reports Proxy] Error parsing response:', parseError);
        data = null;
      }

      // Return response with same status
      return NextResponse.json(data, { 
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout specifically
      if (fetchError.name === 'AbortError' || fetchError.code === 'UND_ERR_CONNECT_TIMEOUT') {
        console.error(`Reports API Proxy timeout (${method}):`, fetchError);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Connection timeout: The backend server is taking too long to respond or may be unavailable. Please check if the backend service is running.',
            error: 'CONNECTION_TIMEOUT',
            backend_url: CRM_API_BASE_URL
          },
          { status: 504 } // Gateway Timeout
        );
      }
      
      // Handle other connection errors
      if (fetchError.message?.includes('fetch failed') || fetchError.code === 'ECONNREFUSED') {
        console.error(`Reports API Proxy connection error (${method}):`, fetchError);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Cannot connect to backend server. Please verify the backend service is running and accessible.',
            error: 'CONNECTION_FAILED',
            backend_url: CRM_API_BASE_URL
          },
          { status: 503 } // Service Unavailable
        );
      }
      
      // Re-throw to be caught by outer catch
      throw fetchError;
    }
  } catch (error: any) {
    console.error(`Reports API Proxy error (${method}):`, error);
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
