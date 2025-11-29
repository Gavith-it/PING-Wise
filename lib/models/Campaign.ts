/**
 * Campaign Model
 * 
 * Mongoose model for Campaign
 */

import mongoose, { Schema, Model, Document } from 'mongoose';
import { Campaign } from '@/types';

export interface CampaignDocument extends Omit<Campaign, 'id' | 'recipients' | 'createdBy'>, Document {
  _id: mongoose.Types.ObjectId;
  message: string;
  title?: string;
  scheduledDate?: Date;
  scheduledTime?: string;
  sentAt?: Date;
  recipientTags: string[];
  recipientCount: number;
  excludeRecent: boolean;
  priorityOnly: boolean;
  includeEmergency: boolean;
  template: string;
  status: 'draft' | 'scheduled' | 'sending' | 'delivered' | 'failed';
  createdBy: mongoose.Types.ObjectId;
}

const campaignSchema = new Schema<CampaignDocument>({
  message: {
    type: String,
    required: [true, 'Please provide campaign message'],
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  scheduledTime: {
    type: String,
    default: null
  },
  sentAt: {
    type: Date,
    default: null
  },
  recipientTags: [{
    type: String,
    enum: ['all', 'active', 'booked', 'follow-up', 'new']
  }],
  recipientCount: {
    type: Number,
    default: 0
  },
  excludeRecent: {
    type: Boolean,
    default: false
  },
  priorityOnly: {
    type: Boolean,
    default: false
  },
  includeEmergency: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'delivered', 'failed'],
    default: 'draft'
  },
  template: {
    type: String,
    enum: ['Festival Promotions', 'Pre-Surgery', 'Post-Surgery', 'Special Offers', ''],
    default: ''
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

campaignSchema.index({ status: 1 });
campaignSchema.index({ scheduledDate: 1 });
campaignSchema.index({ createdAt: -1 });

const CampaignModel: Model<CampaignDocument> = mongoose.models.Campaign || mongoose.model<CampaignDocument>('Campaign', campaignSchema);

export default CampaignModel;

