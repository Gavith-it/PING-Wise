import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const USE_MOCK_API = process.env.USE_MOCK_API === 'true';

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
    const userId = getUserIdFromToken(req);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For now, return a mock balance
    // TODO: Replace with actual wallet balance from database
    const balance = 0; // Default balance

    return NextResponse.json({
      success: true,
      data: {
        balance: balance
      }
    });
  } catch (error) {
    console.error('Wallet balance error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

