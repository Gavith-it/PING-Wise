/**
 * Template API Proxy Route - Base
 * Handles GET /api/templates and POST /api/templates
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
    const path = '/templates';
    
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

    // Call backend API from server-side (no CORS issues)
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Template API Proxy Base] ${method} ${path} - Status: ${response.status}`, {
        url: url,
        hasAuth: !!authHeader,
        queryParams: queryString
      });
    }

    // Check for error status codes
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Template API Proxy Base] Error ${response.status}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: url,
        hasAuth: !!authHeader,
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
        console.log(`[Template API Proxy Base] Response body:`, responseText.substring(0, 200));
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
      console.error('[Template API Proxy Base] Error parsing response:', parseError);
      data = null;
    }

    // According to Swagger, GET /templates returns a single Template object
    // Don't normalize null - let it pass through (might be valid empty response)
    // The service layer will handle converting single object to array

    // Return response with same status
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error(`Template API Proxy Base error (${method}):`, error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to connect to backend API' 
      },
      { status: 500 }
    );
  }
}

