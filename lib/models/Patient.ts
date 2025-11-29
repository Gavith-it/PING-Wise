/**
 * Patient Model
 * 
 * Mongoose model for Patient
 */

import mongoose, { Schema, Model, Document } from 'mongoose';
import { Patient } from '@/types';

export interface PatientDocument extends Omit<Patient, 'id' | 'createdBy'>, Document {
  _id: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

const patientSchema = new Schema<PatientDocument>({
  name: {
    type: String,
    required: [true, 'Please provide patient name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  age: {
    type: Number,
    required: [true, 'Please provide patient age'],
    min: [1, 'Age must be at least 1'],
    max: [120, 'Age cannot exceed 120']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email address'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  address: {
    type: String,
    trim: true
  },
  assignedDoctor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'booked', 'follow-up', 'inactive'],
    default: 'active'
  },
  medicalNotes: {
    type: String,
    trim: true
  },
  lastVisit: {
    type: Date,
    default: null
  },
  nextAppointment: {
    type: Date,
    default: null
  },
  initials: {
    type: String,
    trim: true
  },
  avatarColor: {
    type: String,
    default: 'bg-blue-500'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate initials before saving
patientSchema.pre('save', function(next) {
  if (this.name && !this.initials) {
    const names = this.name.split(' ');
    this.initials = names.map(n => n.charAt(0).toUpperCase()).join('');
  }
  
  if (!this.avatarColor) {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500',
      'bg-orange-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'
    ];
    this.avatarColor = colors[Math.floor(Math.random() * colors.length)];
  }
  
  next();
});

// Indexes for faster searches
patientSchema.index({ name: 'text', email: 'text', phone: 'text' });
patientSchema.index({ status: 1 });
patientSchema.index({ assignedDoctor: 1 });
patientSchema.index({ createdAt: -1 });

const PatientModel: Model<PatientDocument> = mongoose.models.Patient || mongoose.model<PatientDocument>('Patient', patientSchema);

export default PatientModel;

