/**
 * Team API Route
 * GET /api/team - Get all team members
 * POST /api/team - Create new team member
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import UserModel from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { RegisterRequest } from '@/types';
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
    const response = await mockApi.team.getTeamMembers();
    // Filter by status if provided
    if (params.status && params.status !== 'all' && response.data) {
      response.data = response.data.filter((m: any) => m.status === params.status);
    }
    return NextResponse.json(response);
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const groupBy = searchParams.get('groupBy');

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (department) {
      query.department = department;
    }

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    const teamMembers = await UserModel.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    if (groupBy === 'department') {
      const grouped: Record<string, any[]> = {};
      teamMembers.forEach((member) => {
        const dept = member.department || 'Unassigned';
        if (!grouped[dept]) {
          grouped[dept] = [];
        }
        grouped[dept].push(member);
      });

      return NextResponse.json({
        success: true,
        count: teamMembers.length,
        data: grouped
      });
    }

    return NextResponse.json({
      success: true,
      count: teamMembers.length,
      data: teamMembers
    });
  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (USE_MOCK_API) {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }

    const body: RegisterRequest = await req.json();
    const response = await mockApi.team.createTeamMember(body);
    
    if (!response.success) {
      return NextResponse.json(
        { success: false, message: response.message || 'Failed to create team member' },
        { status: 400 }
      );
    }
    
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

    const body: RegisterRequest = await req.json();
    const { name, email, password, role, department, specialization, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: 'Name, email, password, and role are required' },
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
        { success: false, message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const teamMember = await UserModel.create({
      name,
      email,
      password,
      role,
      department,
      specialization,
      phone
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Team member created successfully',
        data: {
          id: teamMember._id.toString(),
          name: teamMember.name,
          email: teamMember.email,
          role: teamMember.role,
          department: teamMember.department,
          status: teamMember.status,
          initials: teamMember.initials,
          avatarColor: teamMember.avatarColor
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create team member error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

