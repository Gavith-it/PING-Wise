/**
 * Patients API Route
 * GET /api/patients - Get all patients
 * POST /api/patients - Create new patient
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import PatientModel from '@/lib/models/Patient';
import AppointmentModel from '@/lib/models/Appointment';
import jwt from 'jsonwebtoken';
import { CreatePatientRequest } from '@/types';
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

export async function GET(req: NextRequest) {
  if (USE_MOCK_API) {
    const { searchParams } = new URL(req.url);
    const params: any = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const response = await mockApi.patients.getPatients(params);
    return NextResponse.json(response);
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const doctor = searchParams.get('doctor');
    const ageMin = searchParams.get('ageMin');
    const ageMax = searchParams.get('ageMax');

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (doctor) {
      query.assignedDoctor = doctor;
    }

    if (ageMin || ageMax) {
      query.age = {};
      if (ageMin) query.age.$gte = parseInt(ageMin);
      if (ageMax) query.age.$lte = parseInt(ageMax);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await PatientModel.find(query)
      .populate('assignedDoctor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PatientModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      count: patients.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: patients
    });
  } catch (error) {
    console.error('Get patients error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (USE_MOCK_API) {
    const body: CreatePatientRequest = await req.json();
    const response = await mockApi.patients.createPatient(body);
    return NextResponse.json(response, { status: 201 });
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

    const body: CreatePatientRequest = await req.json();
    const { name, age, email, phone, gender, address, assignedDoctor, status, medicalNotes } = body;

    if (!name || !age || !email || !phone) {
      return NextResponse.json(
        { success: false, message: 'Name, age, email, and phone are required' },
        { status: 400 }
      );
    }

    const existingPatient = await PatientModel.findOne({ email });
    if (existingPatient) {
      return NextResponse.json(
        { success: false, message: 'Patient with this email already exists' },
        { status: 400 }
      );
    }

    const patient = await PatientModel.create({
      name,
      age,
      email,
      phone,
      gender: gender || '',
      address,
      assignedDoctor,
      status: status || 'active',
      medicalNotes,
      createdBy: userId
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Patient created successfully',
        data: patient
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

