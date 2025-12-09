/**
 * Appointments API Route
 * GET /api/appointments - Get all appointments
 * POST /api/appointments - Create new appointment
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import AppointmentModel from '@/lib/models/Appointment';
import PatientModel from '@/lib/models/Patient';
import jwt from 'jsonwebtoken';
import { CreateAppointmentRequest } from '@/types';
import { mockApi } from '@/lib/mockApi';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const USE_MOCK_API = process.env.USE_MOCK_API === 'true' || !process.env.MONGODB_URI;

function getUserIdFromToken(req: NextRequest): string | null {
  // Check both lowercase and uppercase header names (Next.js is case-insensitive but be explicit)
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  
  if (!authHeader) {
    console.log('No authorization header found. Available headers:', Object.keys(req.headers));
    return null;
  }
  
  console.log('Authorization header found:', authHeader.substring(0, 20) + '...');
  
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : authHeader;
    
  if (!token || token.trim() === '') {
    console.log('No token found in authorization header after parsing');
    return null;
  }
  
  // Handle mock tokens when in mock mode
  if (USE_MOCK_API && token.startsWith('mock-jwt-token-')) {
    // For mock mode, return the default user ID (matches mock API)
    console.log('Mock token detected, using default user ID: 1');
    return '1'; // Return default user ID for mock mode (matches mockApi.auth.login)
  }
  
  // Verify real JWT tokens
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    console.log('Token verified successfully for user:', decoded.id);
    return decoded.id;
  } catch (error: any) {
    console.log('Token verification failed:', error.message);
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (USE_MOCK_API) {
    const { searchParams } = new URL(req.url);
    const params: any = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const response = await mockApi.appointments.getAppointments(params);
    return NextResponse.json(response);
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const doctor = searchParams.get('doctor');
    const patient = searchParams.get('patient');

    const query: any = {};

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (status) {
      query.status = status;
    }

    if (doctor) {
      query.doctor = doctor;
    }

    if (patient) {
      query.patient = patient;
    }

    const appointments = await AppointmentModel.find(query)
      .populate('patient', 'name age phone email initials avatarColor')
      .populate('doctor', 'name email department specialization initials avatarColor')
      .sort({ date: 1, time: 1 });

    return NextResponse.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Log all headers for debugging
  const allHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    allHeaders[key] = value;
  });
  console.log('POST /appointments - Received headers:', Object.keys(allHeaders));
  console.log('POST /appointments - Authorization header:', req.headers.get('authorization') || req.headers.get('Authorization') || 'NOT FOUND');
  
  if (USE_MOCK_API) {
    const userId = getUserIdFromToken(req);
    console.log('POST /appointments - User ID from token:', userId);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }

    const body: CreateAppointmentRequest = await req.json();
    const response = await mockApi.appointments.createAppointment({
      ...body,
      createdBy: userId
    });
    
    if (!response.success) {
      return NextResponse.json(
        { success: false, message: response.message || 'Failed to create appointment' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(response, { status: 201 });
  }

  try {
    await connectDB();

    // Log headers for debugging
    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    console.log('POST /appointments (DB) - Received headers:', Object.keys(allHeaders));
    console.log('POST /appointments (DB) - Authorization header:', req.headers.get('authorization') || req.headers.get('Authorization') || 'NOT FOUND');

    const userId = getUserIdFromToken(req);
    console.log('POST /appointments (DB) - User ID from token:', userId);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }

    const body: CreateAppointmentRequest = await req.json();
    const { patient, doctor, date, time, type, reason, notes } = body;

    if (!patient || !doctor || !date || !time || !type || !reason) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const patientExists = await PatientModel.findById(patient);
    if (!patientExists) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    const appointmentDate = new Date(date);
    const conflictingAppointment = await AppointmentModel.findOne({
      doctor,
      date: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
      },
      time,
      status: { $in: ['confirmed', 'pending'] }
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { success: false, message: 'Doctor already has an appointment at this time' },
        { status: 400 }
      );
    }

    const appointment = await AppointmentModel.create({
      patient,
      doctor,
      date: new Date(date),
      time,
      type,
      reason,
      medicalNotes: notes,
      createdBy: userId
    });

    await PatientModel.findByIdAndUpdate(patient, {
      nextAppointment: new Date(date),
      status: 'booked'
    });

    const populatedAppointment = await AppointmentModel.findById(appointment._id)
      .populate('patient', 'name age phone email initials avatarColor')
      .populate('doctor', 'name email department specialization initials avatarColor');

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment created successfully',
        data: populatedAppointment
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

