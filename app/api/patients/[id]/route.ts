/**
 * Patient API Route (Single)
 * GET /api/patients/[id] - Get single patient
 * PUT /api/patients/[id] - Update patient
 * DELETE /api/patients/[id] - Delete patient
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import PatientModel from '@/lib/models/Patient';
import AppointmentModel from '@/lib/models/Appointment';
import jwt from 'jsonwebtoken';
import { mockApi } from '@/lib/mockApi';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const USE_MOCK_API = process.env.USE_MOCK_API === 'true' || !process.env.MONGODB_URI;

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (USE_MOCK_API) {
    try {
      const response = await mockApi.patients.getPatient(params.id);
      return NextResponse.json(response);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, message: error.message || 'Patient not found' },
        { status: 404 }
      );
    }
  }

  try {
    await connectDB();

    const patient = await PatientModel.findById(params.id)
      .populate('assignedDoctor', 'name email phone department specialization');

    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    const appointments = await AppointmentModel.find({ patient: patient._id })
      .populate('doctor', 'name')
      .sort({ date: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        patient,
        recentAppointments: appointments
      }
    });
  } catch (error) {
    console.error('Get patient error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (USE_MOCK_API) {
    try {
      const body = await req.json();
      const response = await mockApi.patients.updatePatient(params.id, body);
      return NextResponse.json(response);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update patient' },
        { status: 404 }
      );
    }
  }

  try {
    await connectDB();

    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const patient = await PatientModel.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (error) {
    console.error('Update patient error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (USE_MOCK_API) {
    try {
      const response = await mockApi.patients.deletePatient(params.id);
      return NextResponse.json(response);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to delete patient' },
        { status: 404 }
      );
    }
  }

  try {
    await connectDB();

    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }

    const patient = await PatientModel.findById(params.id);
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    const appointments = await AppointmentModel.countDocuments({ patient: patient._id });
    if (appointments > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete patient with existing appointments' },
        { status: 400 }
      );
    }

    await PatientModel.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

