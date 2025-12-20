import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { logger } from '@/lib/utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const USE_MOCK_API = process.env.USE_MOCK_API === 'true';

// Mark this route as dynamic since it uses request headers
export const dynamic = 'force-dynamic';

function getUserIdFromToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  
  if (!authHeader) {
    return null;
  }
  
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : authHeader;
    
  if (!token || token.trim() === '') {
    return null;
  }

  // Handle mock tokens when in mock API mode
  if (USE_MOCK_API && token.startsWith('mock-jwt-token-')) {
    return '1'; // Return a consistent mock user ID
  }

  try {
    const decoded = jwt.verify(token.trim(), JWT_SECRET) as { id: string };
    return decoded.id;
  } catch (error) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Handle mock API mode
    if (USE_MOCK_API) {
      const { mockApi } = await import('@/lib/mockApi');
      const mockResponse = await mockApi.wallet.getBalance();
      return NextResponse.json(mockResponse);
    }

    const userId = getUserIdFromToken(req);
    
    // If no user ID, return default balance instead of error
    // This allows the UI to work even if token is missing/expired
    if (!userId) {
      return NextResponse.json({
        success: true,
        data: {
          balance: 0
        }
      });
    }

    // For now, return a mock balance
    // NOTE: Wallet balance integration pending - will be replaced with actual database query
    // when wallet service is fully implemented
    const balance = 0; // Default balance

    return NextResponse.json({
      success: true,
      data: {
        balance: balance
      }
    });
  } catch (error) {
    logger.error('Wallet balance error', error);
    // Return default balance on error instead of 500
    return NextResponse.json({
      success: true,
      data: {
        balance: 0
      }
    });
  }
}

