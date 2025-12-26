/**
 * Dashboard Activity API Route
 * GET /api/dashboard/activity
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import PatientModel from '@/lib/models/Patient';
import { mockApi } from '@/lib/mockApi';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const USE_MOCK_API = process.env.USE_MOCK_API === 'true' || !process.env.MONGODB_URI || process.env.MONGODB_URI === '';

function getUserIdFromToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Use mock API if MongoDB is not configured - skip auth check in mock mode
    if (USE_MOCK_API) {
      return NextResponse.json(await mockApi.dashboard.getActivity());
    }

    // Only check authentication if NOT in mock mode
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }

    try {
      await connectDB();
    } catch (error) {
      // If MongoDB connection fails, fall back to mock API
      console.log('MongoDB connection failed, using mock data');
      return NextResponse.json(await mockApi.dashboard.getActivity());
    }

    const activePatients = await PatientModel.countDocuments({ status: 'active' });
    const bookedPatients = await PatientModel.countDocuments({ status: 'booked' });
    const inactivePatients = await PatientModel.countDocuments({ status: 'inactive' });
    const totalPatients = await PatientModel.countDocuments();

    const activityData = {
      total: totalPatients,
      active: {
        count: activePatients,
        percentage: totalPatients > 0 ? Math.round((activePatients / totalPatients) * 100) : 0
      },
      booked: {
        count: bookedPatients,
        percentage: totalPatients > 0 ? Math.round((bookedPatients / totalPatients) * 100) : 0
      },
      inactive: {
        count: inactivePatients,
        percentage: totalPatients > 0 ? Math.round((inactivePatients / totalPatients) * 100) : 0
      }
    };

    return NextResponse.json({
      success: true,
      data: activityData
    });
  } catch (error) {
    console.error('Get activity data error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

