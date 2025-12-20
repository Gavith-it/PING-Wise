/**
 * Team API Proxy Route - Base
 * Handles GET /api/teams and POST /api/teams
 * 
 * Proxies requests to the backend API to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'https://pw-crm-gateway-1.onrender.com';

export async function GET(req: NextRequest) {
  return handleBaseRequest(req, 'GET');
}

export async function POST(req: NextRequest) {
  return handleBaseRequest(req, 'POST');
}

async function handleBaseRequest(req: NextRequest, method: string) {
  try {
    const path = '/teams';
    
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
      // Call backend API from server-side (no CORS issues)
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Log request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Team API Proxy Base] ${method} ${path} - Status: ${response.status}`, {
          url: url,
          hasAuth: !!authHeader,
          queryParams: queryString
        });
      }

      // Check for error status codes
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        // Try to parse error as JSON for better error details
        let errorData: any = errorText;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // Keep as string if not JSON
        }
        
        console.error(`[Team API Proxy Base] Error ${response.status}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          errorText: errorText,
          url: url,
          hasAuth: !!authHeader,
          authHeaderPreview: authHeader ? authHeader.substring(0, 30) + '...' : 'none',
          path: path
        });
        
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
          console.log(`[Team API Proxy Base] Response body:`, responseText.substring(0, 200));
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
        console.error('[Team API Proxy Base] Error parsing response:', parseError);
        data = null;
      }

      // Normalize null to empty array for GET /teams endpoint
      if (method === 'GET' && (data === null || data === undefined)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Team API Proxy Base] Normalizing null response to empty array');
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
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout specifically
      if (fetchError.name === 'AbortError' || fetchError.code === 'UND_ERR_CONNECT_TIMEOUT') {
        console.error(`Team API Proxy Base timeout (${method}):`, fetchError);
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
        console.error(`Team API Proxy Base connection error (${method}):`, fetchError);
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
    console.error(`Team API Proxy Base error (${method}):`, error);
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

