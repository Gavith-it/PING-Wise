/**
 * Dashboard Stats API Route
 * GET /api/dashboard/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import PatientModel from '@/lib/models/Patient';
import AppointmentModel from '@/lib/models/Appointment';
import CampaignModel from '@/lib/models/Campaign';
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
      return NextResponse.json(await mockApi.dashboard.getStats());
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
      return NextResponse.json(await mockApi.dashboard.getStats());
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalBookings = await AppointmentModel.countDocuments({
      status: { $in: ['confirmed', 'pending'] }
    });

    const totalPatients = await PatientModel.countDocuments();
    const followUps = await PatientModel.countDocuments({ status: 'follow-up' });
    const activeCampaigns = await CampaignModel.countDocuments({ status: 'draft' });

    const todayAppointments = await AppointmentModel.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'pending'] }
    });

    const revenue = totalBookings * 100;

    const stats = {
      totalBookings: {
        value: totalBookings,
        change: 7,
        trend: 'up' as const
      },
      totalPatients: {
        value: totalPatients,
        change: 8,
        trend: 'up' as const
      },
      followUps: {
        value: followUps,
        change: -5,
        trend: 'down' as const
      },
      revenue: {
        value: revenue,
        change: 12,
        trend: 'up' as const
      },
      todayAppointments: {
        value: todayAppointments
      },
      activeCampaigns: {
        value: activeCampaigns
      }
    };

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

