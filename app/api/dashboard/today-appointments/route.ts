/**
 * Today's Appointments API Route
 * GET /api/dashboard/today-appointments
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import AppointmentModel from '@/lib/models/Appointment';
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
      return NextResponse.json(await mockApi.dashboard.getTodayAppointments());
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
      return NextResponse.json(await mockApi.dashboard.getTodayAppointments());
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await AppointmentModel.find({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'pending'] }
    })
      .populate('patient', 'name phone email initials avatarColor')
      .populate('doctor', 'name')
      .sort({ time: 1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get today appointments error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

