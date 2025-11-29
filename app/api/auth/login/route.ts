/**
 * Login API Route
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';
import { mockApi } from '@/lib/mockApi';
import jwt from 'jsonwebtoken';
import { LoginRequest, AuthResponse } from '@/types';

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
    const body: LoginRequest = await req.json();
    const { email, password } = body;

    // Use mock API if MongoDB is not configured
    if (USE_MOCK_API) {
      return NextResponse.json(await mockApi.auth.login(email, password));
    }

    try {
      await connectDB();
    } catch (error) {
      // If MongoDB connection fails, fall back to mock API
      console.log('MongoDB connection failed, using mock data');
      return NextResponse.json(await mockApi.auth.login(email, password));
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Account is inactive. Please contact administrator.' },
        { status: 403 }
      );
    }

    const token = generateToken(user._id.toString());

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      token,
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
        avatarColor: user.avatarColor
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during login' },
      { status: 500 }
    );
  }
}

