/**
 * CRM Patient Modal
 * 
 * Wrapper around PatientModal that uses CRM API service
 */

'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { X } from 'lucide-react';
import { crmPatientService } from '@/lib/services/crmPatientService';
import toast from 'react-hot-toast';
import { Patient, CreatePatientRequest } from '@/types';
import { patientToCrmCustomer, crmCustomerToPatient } from '@/lib/utils/crmAdapter';
import { parseMedicalHistory } from '@/lib/utils/crmAdapter';
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
import { SimpleDatePicker } from '@/components/ui/simple-date-picker';
import { format } from 'date-fns';

interface CRMPatientModalProps {
  patient?: Patient | null;
  onClose: () => void;
  onSuccess: (updatedPatient?: Patient) => void;
}

export default function CRMPatientModal({ patient, onClose, onSuccess }: CRMPatientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    dateOfBirth: '',
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
      // Format dateOfBirth for date input (YYYY-MM-DD)
      let formattedDateOfBirth = '';
      if (patient.dateOfBirth) {
        try {
          const dobValue: Date | string = patient.dateOfBirth as Date | string;
          // If it's already a string in YYYY-MM-DD format, use it directly
          if (typeof dobValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dobValue.trim())) {
            formattedDateOfBirth = dobValue.trim().split('T')[0].split(' ')[0];
          } else {
            // Try to parse as Date
            let dob: Date;
            if (dobValue instanceof Date) {
              dob = dobValue;
            } else {
              dob = new Date(dobValue);
            }
            
            // Format the Date object to YYYY-MM-DD
            if (!isNaN(dob.getTime())) {
              // Get local date components to avoid timezone issues
              const year = dob.getFullYear();
              const month = String(dob.getMonth() + 1).padStart(2, '0');
              const day = String(dob.getDate()).padStart(2, '0');
              formattedDateOfBirth = `${year}-${month}-${day}`;
            }
          }
        } catch (error) {
          console.error('Error parsing dateOfBirth:', error, patient.dateOfBirth);
          formattedDateOfBirth = '';
        }
      }

      // Extract medical notes - handle both converted format and raw API format
      let medicalNotes = patient.medicalNotes || '';
      
      // If medicalNotes is empty but patient has raw medical_history (shouldn't happen, but safety check)
      if (!medicalNotes && (patient as any).medical_history) {
        medicalNotes = parseMedicalHistory((patient as any).medical_history);
      }
      
      setFormData({
        name: patient.name || '',
        age: patient.age?.toString() || '',
        gender: patient.gender || '',
        dateOfBirth: formattedDateOfBirth,
        phone: formatPhoneForDisplay(patient.phone || ''),
        email: patient.email || '',
        address: patient.address || '',
        assignedDoctor: typeof patient.assignedDoctor === 'string' ? patient.assignedDoctor : '',
        status: patient.status || 'active',
        medicalNotes: medicalNotes,
      });
    } else {
      // Reset form when no patient (adding new)
      setFormData({
        name: '',
        age: '',
        gender: '',
        dateOfBirth: '',
        phone: '',
        email: '',
        address: '',
        assignedDoctor: '',
        status: 'active',
        medicalNotes: '',
      });
    }
  }, [patient]);

  const validateForm = useCallback((): boolean => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Optimized field update handler - only updates specific field with input filtering
  const handleFieldChange = useCallback((field: keyof typeof formData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      let value = e.target.value;
      
      // Apply input filtering based on field type
      if (field === 'name') {
        value = handleNameInput(value); // Remove numbers from name
      } else if (field === 'phone') {
        value = handlePhoneInput(value); // Only digits, max 10
      } else if (field === 'age') {
        value = handleAgeInput(value); // Only digits, max 2
      }
      
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Validate field in real-time and set error
      let fieldError = '';
      if (field === 'name') {
        const validation = validateName(value);
        if (!validation.isValid) {
          fieldError = validation.error;
        }
      } else if (field === 'phone') {
        const validation = validatePhone(value);
        if (!validation.isValid && value.trim() !== '') {
          fieldError = validation.error;
        }
      } else if (field === 'age') {
        const validation = validateAge(value);
        if (!validation.isValid && value.trim() !== '') {
          fieldError = validation.error;
        }
      } else if (field === 'email') {
        const validation = validateEmail(value);
        if (!validation.isValid && value.trim() !== '') {
          fieldError = validation.error;
        }
      } else if (field === 'address') {
        const validation = validateAddress(value);
        if (!validation.isValid) {
          fieldError = validation.error;
        }
      }
      
      // Update errors
      setErrors(prev => {
        if (fieldError) {
          return { ...prev, [field]: fieldError };
        } else {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        }
      });
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const patientData: CreatePatientRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formatPhoneForApi(formData.phone.trim()),
        age: parseInt(formData.age),
        gender: formData.gender as 'male' | 'female' | 'other' | '',
        status: formData.status as 'active' | 'booked' | 'follow-up' | 'inactive',
        address: formData.address || undefined,
        assignedDoctor: formData.assignedDoctor || undefined,
        medicalNotes: formData.medicalNotes || undefined,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
      };
      
      if (patient) {
        const response = await crmPatientService.updatePatient(patient.id, patientData);
        toast.success('Patient updated successfully');
        onSuccess(response.data); // Pass updated patient data
      } else {
        const response = await crmPatientService.createPatient(patientData);
        toast.success('Patient created successfully');
        onSuccess(response.data); // Pass created patient data
      }
    } catch (error: any) {
      // Handle 401 Unauthorized specifically
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        // Close modal and redirect to login after a short delay
        setTimeout(() => {
          onClose();
          window.location.href = '/login';
        }, 2000);
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to save patient';
        toast.error(errorMessage);
        console.error('Error saving patient:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [formData, patient, validateForm, onClose, onSuccess]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {patient ? 'Edit Patient' : 'Add New Patient'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleFieldChange('name')}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                    errors.name ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
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
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Age *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={formData.age}
                    onChange={handleFieldChange('age')}
                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.age ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
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
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.age}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={handleFieldChange('gender')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth
              </label>
              <SimpleDatePicker
                date={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                onDateChange={(date) => {
                  const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
                  setFormData(prev => ({ ...prev, dateOfBirth: dateStr }));
                }}
                placeholder="Select date of birth"
                maxDate={new Date()}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                  +91
                </div>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={handleFieldChange('phone')}
                  className={`w-full pl-14 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                    errors.phone ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
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
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleFieldChange('email')}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                    errors.email ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
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
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.address}
                  onChange={handleFieldChange('address')}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                    errors.address ? 'border-red-500 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Street address (alphanumeric allowed)"
                  title={errors.address || 'Address can contain letters and numbers (alphanumeric).'}
                />
                {errors.address && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 group">
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
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={handleFieldChange('status')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={customerStatusToApiFormat(CustomerStatus.Active)}>{CustomerStatus.Active}</option>
                <option value={customerStatusToApiFormat(CustomerStatus.Booked)}>{CustomerStatus.Booked}</option>
                <option value={customerStatusToApiFormat(CustomerStatus.FollowUp)}>{CustomerStatus.FollowUp}</option>
                <option value={customerStatusToApiFormat(CustomerStatus.Inactive)}>{CustomerStatus.Inactive}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medical Notes
              </label>
              <textarea
                value={formData.medicalNotes}
                onChange={handleFieldChange('medicalNotes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Additional medical information..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : patient ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

