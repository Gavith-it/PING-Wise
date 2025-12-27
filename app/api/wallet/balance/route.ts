import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { logger } from '@/lib/utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

  try {
    const decoded = jwt.verify(token.trim(), JWT_SECRET) as { id: string };
    return decoded.id;
  } catch (error) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
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

    // NOTE: Wallet balance integration pending - will be replaced with actual backend API call
    // when wallet service is fully implemented by client
    // For now, return default balance to allow page to work
    const balance = 0;

    return NextResponse.json({
      success: true,
      data: {
        balance: balance
      }
    });
  } catch (error) {
    logger.error('Wallet balance error', error);
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

