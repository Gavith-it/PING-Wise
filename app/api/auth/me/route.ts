/**
 * Get Current User API Route
 * GET /api/auth/me
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';
import { mockApi } from '@/lib/mockApi';
import { authenticateToken, AuthenticatedRequest } from '@/lib/middleware/auth';

const USE_MOCK_API = process.env.USE_MOCK_API === 'true' || !process.env.MONGODB_URI || process.env.MONGODB_URI === '';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }

    // Use mock API if MongoDB is not configured
    if (USE_MOCK_API) {
      const mockResponse = await mockApi.auth.getCurrentUser();
      return NextResponse.json(mockResponse);
    }

    try {
      await connectDB();
    } catch (error) {
      // If MongoDB connection fails, fall back to mock API
      console.log('MongoDB connection failed, using mock data');
      return NextResponse.json(await mockApi.auth.getCurrentUser());
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { id: string };

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        specialization: user.specialization,
        experience: user.experience,
        phone: user.phone,
        status: user.status,
        initials: user.initials,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

