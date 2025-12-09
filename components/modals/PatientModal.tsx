'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { patientService } from '@/lib/services/api';
import toast from 'react-hot-toast';
import { Patient } from '@/types';

interface PatientModalProps {
  patient?: Patient | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PatientModal({ patient, onClose, onSuccess }: PatientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    assignedDoctor: '',
    status: 'active',
    medicalNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        age: patient.age?.toString() || '',
        gender: patient.gender || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        assignedDoctor: typeof patient.assignedDoctor === 'string' ? patient.assignedDoctor : '',
        status: patient.status || 'active',
        medicalNotes: patient.medicalNotes || '',
      });
    }
  }, [patient]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }

    // Age validation
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum)) {
        newErrors.age = 'Age must be a valid number';
      } else if (ageNum < 1) {
        newErrors.age = 'Age must be at least 1';
      } else if (ageNum > 120) {
        newErrors.age = 'Age must be less than 120';
      }
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      // Remove spaces, dashes, parentheses for validation
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
      if (!/^\+?[1-9]\d{9,14}$/.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid phone number (10-15 digits)';
      }
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      } else if (formData.email.trim().length > 255) {
        newErrors.email = 'Email must be less than 255 characters';
      }
    }

    // Gender validation (optional but if provided must be valid)
    if (formData.gender && !['male', 'female', 'other'].includes(formData.gender)) {
      newErrors.gender = 'Please select a valid gender';
    }

    // Status validation
    if (formData.status && !['active', 'booked', 'follow-up', 'inactive'].includes(formData.status)) {
      newErrors.status = 'Please select a valid status';
    }

    // Address validation (optional but if provided check length)
    if (formData.address && formData.address.length > 500) {
      newErrors.address = 'Address must be less than 500 characters';
    }

    // Medical notes validation (optional but if provided check length)
    if (formData.medicalNotes && formData.medicalNotes.length > 2000) {
      newErrors.medicalNotes = 'Medical notes must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const patientData = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        age: typeof formData.age === 'string' ? parseInt(formData.age) : formData.age,
        gender: formData.gender as 'male' | 'female' | 'other' | '',
        status: formData.status as 'active' | 'booked' | 'follow-up' | 'inactive' | undefined,
      };
      
      if (patient) {
        await patientService.updatePatient(patient.id, patientData);
        toast.success('Patient updated successfully');
      } else {
        await patientService.createPatient(patientData);
        toast.success('Patient created successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {patient ? 'Edit Patient' : 'Add New Patient'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) {
                    setErrors({ ...errors, name: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter patient's full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => {
                    setFormData({ ...formData, age: e.target.value });
                    if (errors.age) {
                      setErrors({ ...errors, age: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.age ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Age"
                />
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => {
                    setFormData({ ...formData, gender: e.target.value });
                    if (errors.gender) {
                      setErrors({ ...errors, gender: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.gender ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) {
                    setErrors({ ...errors, phone: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) {
                    setErrors({ ...errors, email: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="patient@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (errors.address) {
                    setErrors({ ...errors, address: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                  errors.address ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter patient's address (optional)"
                maxLength={500}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
              {formData.address && (
                <p className="mt-1 text-xs text-gray-500">{formData.address.length}/500 characters</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => {
                  setFormData({ ...formData, status: e.target.value });
                  if (errors.status) {
                    setErrors({ ...errors, status: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.status ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
              >
                <option value="active">Active</option>
                <option value="booked">Booked</option>
                <option value="follow-up">Follow-up</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Notes
              </label>
              <textarea
                rows={3}
                value={formData.medicalNotes}
                onChange={(e) => {
                  setFormData({ ...formData, medicalNotes: e.target.value });
                  if (errors.medicalNotes) {
                    setErrors({ ...errors, medicalNotes: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                  errors.medicalNotes ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter medical notes (optional)"
                maxLength={2000}
              />
              {errors.medicalNotes && (
                <p className="mt-1 text-sm text-red-600">{errors.medicalNotes}</p>
              )}
              {formData.medicalNotes && (
                <p className="mt-1 text-xs text-gray-500">{formData.medicalNotes.length}/2000 characters</p>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {loading ? 'Saving...' : patient ? 'Update Patient' : 'Add Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

