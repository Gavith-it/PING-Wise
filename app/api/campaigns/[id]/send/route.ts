/**
 * Send Campaign API Route
 * POST /api/campaigns/[id]/send
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import CampaignModel from '@/lib/models/Campaign';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }

    const campaign = await CampaignModel.findById(params.id);
    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      );
    }

    campaign.status = 'delivered';
    campaign.sentAt = new Date();
    await campaign.save();

    return NextResponse.json({
      success: true,
      message: 'Campaign sent successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

