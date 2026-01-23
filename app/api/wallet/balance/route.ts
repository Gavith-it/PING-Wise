import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { logger } from '@/lib/utils/logger';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_CRM_API_BASE_URL || 'https://pw-crm-gateway-1.onrender.com';

// Mark this route as dynamic since it uses request headers
export const dynamic = 'force-dynamic';

/**
 * Get authorization token from request headers
 */
function getAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  
  if (!authHeader) {
    return null;
  }
  
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : authHeader;
    
  return token && token.trim() !== '' ? token.trim() : null;
}

/**
 * External API response structure
 */
interface BalanceApiResponse {
  balance?: {
    conversion_rate?: number;
    current_balance?: number;
    name?: string;
  };
  total_balance?: number;
}

export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    
    // Prepare headers for external API call
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    };
    
    // Add authorization token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Call external balance API
    const response = await axios.get<BalanceApiResponse>(
      `${BACKEND_BASE_URL}/balance`,
      {
        headers,
        timeout: 10000, // 10 second timeout
      }
    );

    // Extract total_balance from response
    // The API returns: { balance: { ... }, total_balance: number }
    const totalBalance = response.data?.total_balance ?? 0;

    logger.debug('Balance API response', {
      totalBalance,
      hasBalance: !!response.data?.balance,
    });

    return NextResponse.json({
      success: true,
      data: {
        balance: totalBalance
      }
    });
  } catch (error: any) {
    logger.error('Wallet balance error', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    // Return default balance on error instead of 500
    // This ensures the wallet page can still open and display
    return NextResponse.json({
      success: true,
      data: {
        balance: 0
      }
    });
  }
}

