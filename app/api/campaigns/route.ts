/**
 * Campaigns API Route
 * GET /api/campaigns - Get all campaigns
 * POST /api/campaigns - Create new campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import CampaignModel from '@/lib/models/Campaign';
import PatientModel from '@/lib/models/Patient';
import jwt from 'jsonwebtoken';
import { CreateCampaignRequest } from '@/types';
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
    const response = await mockApi.campaigns.getCampaigns();
    return NextResponse.json(response);
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query: any = status ? { status } : {};

    const campaigns = await CampaignModel.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }

    const body: any = await req.json();
    const {
      message,
      title,
      scheduledDate,
      scheduledTime,
      recipientTags,
      excludeRecent,
      priorityOnly,
      includeEmergency,
      template
    } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    let recipientCount = 0;
    const query: any = {};

    if (recipientTags?.includes('all')) {
      recipientCount = await PatientModel.countDocuments(query);
    } else {
      if (recipientTags?.includes('active')) {
        query.status = 'active';
      } else if (recipientTags?.includes('booked')) {
        query.status = 'booked';
      } else if (recipientTags?.includes('follow-up')) {
        query.status = 'follow-up';
      }
      recipientCount = await PatientModel.countDocuments(query);
    }

    const status = scheduledDate && scheduledTime ? 'scheduled' : 'draft';

    const campaign = await CampaignModel.create({
      message,
      title,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      scheduledTime,
      recipientTags: recipientTags || [],
      recipientCount,
      excludeRecent: excludeRecent || false,
      priorityOnly: priorityOnly || false,
      includeEmergency: includeEmergency || false,
      template: template || '',
      status,
      createdBy: userId
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Campaign created successfully',
        data: campaign
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create campaign error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

