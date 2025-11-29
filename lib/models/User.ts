/**
 * User Model
 * 
 * Mongoose model for User (doctors, admins, staff)
 */

import mongoose, { Schema, Model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '@/types';

export interface UserDocument extends Omit<User, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'staff'],
    default: 'staff'
  },
  department: {
    type: String,
    trim: true
  },
  specialization: {
    type: String,
    trim: true
  },
  experience: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'leave', 'inactive'],
    default: 'active'
  },
  initials: {
    type: String,
    trim: true
  },
  avatarColor: {
    type: String,
    default: 'bg-blue-500'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate initials before saving
userSchema.pre('save', function(next) {
  if (this.name && !this.initials) {
    const names = this.name.split(' ');
    this.initials = names.map(n => n.charAt(0).toUpperCase()).join('');
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const UserModel: Model<UserDocument> = mongoose.models.User || mongoose.model<UserDocument>('User', userSchema);

export default UserModel;

