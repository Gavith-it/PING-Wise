/**
 * Register API Route
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';
import { mockApi } from '@/lib/mockApi';
import jwt from 'jsonwebtoken';
import { RegisterRequest, AuthResponse } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const USE_MOCK_API = process.env.USE_MOCK_API === 'true' || !process.env.MONGODB_URI || process.env.MONGODB_URI === '';

function generateToken(userId: string): string {
  return jwt.sign(
    { id: userId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE } as jwt.SignOptions
  );
}

export async function POST(req: NextRequest) {
  try {
    const body: RegisterRequest = await req.json();

    // Use mock API if MongoDB is not configured
    if (USE_MOCK_API) {
      return NextResponse.json(await mockApi.auth.register(body), { status: 201 });
    }

    try {
      await connectDB();
    } catch (error) {
      // If MongoDB connection fails, fall back to mock API
      console.log('MongoDB connection failed, using mock data');
      return NextResponse.json(await mockApi.auth.register(body), { status: 201 });
    }
    const { name, email, password, role, department, specialization, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists with this email' },
        { status: 400 }
      );
    }

    const user = await UserModel.create({
      name,
      email,
      password,
      role: role || 'staff',
      department,
      specialization,
      phone
    });

    const token = generateToken(user._id.toString());

    const response: AuthResponse = {
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        initials: user.initials,
        avatarColor: user.avatarColor
      }
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during registration' },
      { status: 500 }
    );
  }
}

