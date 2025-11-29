/**
 * Appointment Model
 * 
 * Mongoose model for Appointment
 */

import mongoose, { Schema, Model, Document } from 'mongoose';
import { Appointment } from '@/types';

export interface AppointmentDocument extends Omit<Appointment, 'id' | 'patient' | 'doctor' | 'createdBy'>, Document {
  _id: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  confirmationSent?: boolean;
}

const appointmentSchema = new Schema<AppointmentDocument>({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Please provide a patient']
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a doctor']
  },
  date: {
    type: Date,
    required: [true, 'Please provide appointment date']
  },
  time: {
    type: String,
    required: [true, 'Please provide appointment time']
  },
  duration: {
    type: Number,
    default: 30,
    min: [15, 'Duration must be at least 15 minutes']
  },
  type: {
    type: String,
    enum: [
      'Consultation',
      'Follow-up',
      'Checkup',
      'Surgery',
      'Lab Results',
      'Vaccination',
      'Physical Therapy',
      'Emergency'
    ],
    required: [true, 'Please provide appointment type']
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'urgent'],
    default: 'normal'
  },
  reason: {
    type: String,
    required: [true, 'Please provide reason for visit'],
    trim: true
  },
  specialInstructions: {
    type: String,
    trim: true
  },
  medicalNotes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  confirmationSent: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

appointmentSchema.index({ date: 1, time: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ doctor: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ createdAt: -1 });

const AppointmentModel: Model<AppointmentDocument> = mongoose.models.Appointment || mongoose.model<AppointmentDocument>('Appointment', appointmentSchema);

export default AppointmentModel;

