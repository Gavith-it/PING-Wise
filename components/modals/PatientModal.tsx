'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { patientService } from '@/lib/services/api';
import toast from 'react-hot-toast';
import { Patient } from '@/types';
import {
  validateName,
  validatePhone,
  validateAge,
  validateEmail,
  validateAddress,
  handleNameInput,
  handlePhoneInput,
  handleAgeInput,
  formatPhoneForDisplay,
  formatPhoneForApi,
} from '@/lib/utils/formValidation';
import { CustomerStatus, normalizeCustomerStatus, customerStatusToApiFormat } from '@/lib/constants/status';

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
        phone: formatPhoneForDisplay(patient.phone || ''),
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

    // Validate name - only letters, no numbers
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }

    // Validate age - only digits, max 2 digits
    const ageValidation = validateAge(formData.age);
    if (!ageValidation.isValid) {
      newErrors.age = ageValidation.error;
    }

    // Validate phone - only digits, max 10 digits
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error;
    }

    // Validate email - alphanumeric allowed
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }

    // Validate address - alphanumeric allowed (optional)
    const addressValidation = validateAddress(formData.address);
    if (!addressValidation.isValid) {
      newErrors.address = addressValidation.error;
    }

    // Gender validation (optional but if provided must be valid)
    if (formData.gender && !['male', 'female', 'other'].includes(formData.gender)) {
      newErrors.gender = 'Please select a valid gender';
    }

    // Status validation
    if (formData.status && !['active', 'booked', 'follow-up', 'inactive'].includes(formData.status)) {
      newErrors.status = 'Please select a valid status';
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
        phone: formatPhoneForApi(formData.phone.trim()),
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
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const filteredValue = handleNameInput(e.target.value);
                    setFormData({ ...formData, name: filteredValue });
                    // Validate in real-time
                    const validation = validateName(filteredValue);
                    if (!validation.isValid) {
                      setErrors({ ...errors, name: validation.error });
                    } else {
                      const newErrors = { ...errors };
                      delete newErrors.name;
                      setErrors(newErrors);
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter patient's full name (letters only)"
                  title={errors.name || 'Name can only contain letters, spaces, hyphens, and apostrophes. Numbers are not allowed.'}
                />
                {errors.name && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 group">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center cursor-help">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-red-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {errors.name}
                    </div>
                  </div>
                )}
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={formData.age}
                    onChange={(e) => {
                      const filteredValue = handleAgeInput(e.target.value);
                      setFormData({ ...formData, age: filteredValue });
                      // Validate in real-time
                      const validation = validateAge(filteredValue);
                      if (!validation.isValid && filteredValue.trim() !== '') {
                        setErrors({ ...errors, age: validation.error });
                      } else {
                        const newErrors = { ...errors };
                        delete newErrors.age;
                        setErrors(newErrors);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.age ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Age (1-99)"
                    maxLength={2}
                    title={errors.age || 'Age must be 1-99 (maximum 2 digits). Letters are not allowed.'}
                  />
                  {errors.age && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 group">
                      <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center cursor-help">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-red-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {errors.age}
                      </div>
                    </div>
                  )}
                </div>
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
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  91
                </div>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(e) => {
                    const filteredValue = handlePhoneInput(e.target.value);
                    setFormData({ ...formData, phone: filteredValue });
                    // Validate in real-time
                    const validation = validatePhone(filteredValue);
                    if (!validation.isValid && filteredValue.trim() !== '') {
                      setErrors({ ...errors, phone: validation.error });
                    } else {
                      const newErrors = { ...errors };
                      delete newErrors.phone;
                      setErrors(newErrors);
                    }
                  }}
                  className={`w-full pl-12 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10 digits (numbers only)"
                  maxLength={10}
                  title={errors.phone || 'Phone number must be exactly 10 digits. Letters are not allowed.'}
                />
                {errors.phone && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 group">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center cursor-help">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-red-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {errors.phone}
                    </div>
                  </div>
                )}
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    // Validate in real-time
                    const validation = validateEmail(e.target.value);
                    if (!validation.isValid && e.target.value.trim() !== '') {
                      setErrors({ ...errors, email: validation.error });
                    } else {
                      const newErrors = { ...errors };
                      delete newErrors.email;
                      setErrors(newErrors);
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="patient@example.com"
                  title={errors.email || 'Email can contain letters and numbers (alphanumeric).'}
                />
                {errors.email && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 group">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center cursor-help">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-red-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {errors.email}
                    </div>
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    // Validate in real-time
                    const validation = validateAddress(e.target.value);
                    if (!validation.isValid) {
                      setErrors({ ...errors, address: validation.error });
                    } else {
                      const newErrors = { ...errors };
                      delete newErrors.address;
                      setErrors(newErrors);
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                    errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter patient's address (optional, alphanumeric allowed)"
                  maxLength={500}
                  title={errors.address || 'Address can contain letters and numbers (alphanumeric).'}
                />
                {errors.address && (
                  <div className="absolute right-2 top-2 group">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center cursor-help">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-red-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {errors.address}
                    </div>
                  </div>
                )}
              </div>
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
                  errors.status ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              >
                <option value={customerStatusToApiFormat(CustomerStatus.Active)}>{CustomerStatus.Active}</option>
                <option value={customerStatusToApiFormat(CustomerStatus.Booked)}>{CustomerStatus.Booked}</option>
                <option value={customerStatusToApiFormat(CustomerStatus.FollowUp)}>{CustomerStatus.FollowUp}</option>
                <option value={customerStatusToApiFormat(CustomerStatus.Inactive)}>{CustomerStatus.Inactive}</option>
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

