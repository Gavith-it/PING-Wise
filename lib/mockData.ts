/**
 * Mock Data Service
 * 
 * Provides mock data for development when MongoDB is not available.
 */

import { Patient, Appointment, User, Campaign, DashboardStats, ActivityData } from '@/types';

// Mock Patients Data
export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Sarah Miller',
    age: 34,
    phone: '+1 (555) 123-4567',
    email: 'sarah.m@email.com',
    status: 'active',
    lastVisit: new Date('2024-01-10'),
    nextAppointment: new Date('2024-01-15'),
    assignedDoctor: '1',
    initials: 'SM',
    avatarColor: 'bg-blue-500',
    gender: 'female',
    address: '123 Main St',
    medicalNotes: 'Regular checkup patient',
    createdBy: '1',
    createdAt: new Date('2023-12-01')
  },
  {
    id: '2',
    name: 'James Davis',
    age: 45,
    phone: '+1 (555) 234-5678',
    email: 'james.d@email.com',
    status: 'booked',
    lastVisit: new Date('2024-01-08'),
    nextAppointment: new Date('2024-01-15'),
    assignedDoctor: '2',
    initials: 'JD',
    avatarColor: 'bg-indigo-500',
    gender: 'male',
    address: '456 Oak Ave',
    medicalNotes: 'Follow-up required',
    createdBy: '1',
    createdAt: new Date('2023-11-15')
  },
  {
    id: '3',
    name: 'Emma Wilson',
    age: 28,
    phone: '+1 (555) 345-6789',
    email: 'emma.w@email.com',
    status: 'active',
    lastVisit: new Date('2024-01-12'),
    nextAppointment: new Date('2024-01-16'),
    assignedDoctor: '3',
    initials: 'EW',
    avatarColor: 'bg-purple-500',
    gender: 'female',
    address: '789 Pine Rd',
    medicalNotes: 'New patient',
    createdBy: '1',
    createdAt: new Date('2024-01-01')
  },
];

// Mock Team Members
export const mockTeamMembers: User[] = [
  {
    id: '1',
    name: 'Dr. John Davis',
    email: 'john@clinic.com',
    role: 'doctor',
    department: 'Internal Medicine',
    status: 'Active',
    phone: '+1 (555) 100-0001',
    experience: '15 years',
    specialization: 'General Medicine',
    initials: 'JD',
    avatarColor: 'bg-blue-500'
  },
  {
    id: '2',
    name: 'Dr. Sarah Wilson',
    email: 'sarah@clinic.com',
    role: 'doctor',
    department: 'Cardiology',
    status: 'Active',
    phone: '+1 (555) 100-0002',
    experience: '12 years',
    specialization: 'Cardiologist',
    initials: 'SW',
    avatarColor: 'bg-purple-500'
  },
  {
    id: '3',
    name: 'Dr. Michael Brown',
    email: 'michael@clinic.com',
    role: 'doctor',
    department: 'General Medicine',
    status: 'Active',
    phone: '+1 (555) 100-0003',
    experience: '8 years',
    specialization: 'Family Medicine',
    initials: 'MB',
    avatarColor: 'bg-green-500'
  },
];

// Mock Appointments Data
export const mockAppointments: Appointment[] = [
  {
    id: '1',
    patient: '1',
    doctor: '1',
    date: new Date('2024-01-15'),
    time: '10:00',
    status: 'Confirmed',
    type: 'Consultation'
  },
  {
    id: '2',
    patient: '2',
    doctor: '2',
    date: new Date('2024-01-15'),
    time: '14:30',
    status: 'Pending',
    type: 'Follow-up'
  },
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalBookings: { value: 142, change: 7, trend: 'up' },
  totalPatients: { value: 1247, change: 8, trend: 'up' },
  followUps: { value: 23, change: -5, trend: 'down' },
  revenue: { value: 24500, change: 12, trend: 'up' },
  todayAppointments: { value: 3 },
  activeCampaigns: { value: 2 }
};

// Mock Activity Data
export const mockActivityData: ActivityData = {
  total: 1247,
  active: { count: 561, percentage: 45 },
  booked: { count: 374, percentage: 30 },
  inactive: { count: 312, percentage: 25 }
};

// Mock Campaigns
export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Holiday Health Checkup',
    message: 'Happy Holidays! Special festive health packages available.',
    recipients: [],
    recipientCount: 247,
    status: 'delivered',
    createdBy: '1',
    createdAt: new Date('2024-01-10')
  },
  {
    id: '2',
    name: 'Vaccination Reminder',
    message: 'Don\'t forget your annual flu shot!',
    recipients: [],
    recipientCount: 156,
    status: 'scheduled',
    createdBy: '1',
    createdAt: new Date('2024-01-12')
  },
];

// Simulate API delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

