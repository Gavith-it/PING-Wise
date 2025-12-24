'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { crmAppointmentService } from '@/lib/services/appointmentService';
import { crmPatientService } from '@/lib/services/crmPatientService';
import { teamApi } from '@/lib/services/teamApi';
import { crmTeamsToUsers } from '@/lib/utils/teamAdapter';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Appointment, Patient, User } from '@/types';
import Autocomplete from '@/components/ui/autocomplete';

interface AppointmentModalProps {
  appointment?: Appointment | null;
  selectedDate?: Date;
  onClose: () => void;
  onSuccess: (updatedAppointment?: Appointment) => void;
}

// Shared cache for patients and doctors data to avoid loading delay
// This cache is shared across the entire application to prevent duplicate API calls
export const formDataCache: {
  patients: Patient[];
  doctors: User[];
  timestamp: number;
} = {
  patients: [],
  doctors: [],
  timestamp: 0,
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes - longer cache for better performance
const STALE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes - use stale cache in edit mode

// Track if preload is in progress to prevent duplicate calls
// Export this so other modules can check if preload is in progress
export let preloadInProgress = false;

// Export function to preload and cache form data
export async function preloadFormData() {
  // Prevent duplicate preload calls
  if (preloadInProgress) {
    return;
  }

  const cacheAge = Date.now() - formDataCache.timestamp;
  const isCacheValid = formDataCache.patients.length > 0 && 
                      formDataCache.doctors.length > 0 && 
                      cacheAge < CACHE_DURATION;
  
  // Only preload if cache is invalid (don't preload if cache is still fresh)
  if (!isCacheValid) {
    try {
      preloadInProgress = true;
      const [patientsRes, teamsData] = await Promise.all([
        crmPatientService.getPatients({ limit: 50 }), // Use CRM patient service to match CRM page
        teamApi.getTeams(), // Use real team API to get all teams
      ]);
      formDataCache.patients = patientsRes.data || [];
      
      // Convert CrmTeam to User and filter for doctors
      const allUsers = crmTeamsToUsers(teamsData);
      // Filter for doctors (role can be 'doctor', 'Doctor', 'physician', etc.)
      const doctors = allUsers.filter(user => {
        const role = (user.role || '').toLowerCase();
        return role === 'doctor' || role === 'physician' || role === 'dr';
      });
      
      formDataCache.doctors = doctors;
      formDataCache.timestamp = Date.now();
    } catch (error) {
      // Silently fail - cache will be loaded when modal opens
      console.warn('Failed to preload form data:', error);
    } finally {
      preloadInProgress = false;
    }
  }
}

export default function AppointmentModal({ appointment, selectedDate, onClose, onSuccess }: AppointmentModalProps) {
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    time: '',
    type: '',
    reason: '',
  });
  // Initialize with cached data if available (use stale cache in edit mode)
  const [patients, setPatients] = useState<Patient[]>(() => {
    const cacheAge = Date.now() - formDataCache.timestamp;
    const isEditMode = !!appointment;
    // In edit mode, use stale cache (up to 30 min), in create mode only use fresh cache (15 min)
    const maxAge = isEditMode ? STALE_CACHE_DURATION : CACHE_DURATION;
    if (formDataCache.patients.length > 0 && cacheAge < maxAge) {
      return formDataCache.patients;
    }
    return [];
  });
  
  const [doctors, setDoctors] = useState<User[]>(() => {
    const cacheAge = Date.now() - formDataCache.timestamp;
    const isEditMode = !!appointment;
    // In edit mode, use stale cache (up to 30 min), in create mode only use fresh cache (15 min)
    const maxAge = isEditMode ? STALE_CACHE_DURATION : CACHE_DURATION;
    if (formDataCache.doctors.length > 0 && cacheAge < maxAge) {
      return formDataCache.doctors;
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const hasLoadedRef = useRef(false); // Track if data has been loaded to prevent duplicate calls
  const isSubmittingRef = useRef(false); // Prevent duplicate form submissions
  const hasCalledSuccessRef = useRef(false); // Prevent duplicate onSuccess calls
  const appointmentDoctorIdRef = useRef<string>(''); // Store appointment's doctor ID for matching

  const loadFormData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoadingPatients(true);
        setLoadingDoctors(true);
      }
      // Load with pagination - start with 50 instead of 100 for better performance
      // Use CRM patient service to ensure IDs match with CRM page
      const [patientsRes, teamsData] = await Promise.all([
        crmPatientService.getPatients({ limit: 50 }),
        teamApi.getTeams(), // Use real team API to get all teams
      ]);
      const newPatients = patientsRes.data || [];
      
      // Convert CrmTeam to User and filter for doctors
      const allUsers = crmTeamsToUsers(teamsData);
      // Filter for doctors (role can be 'doctor', 'Doctor', 'physician', etc.)
      const newDoctors = allUsers.filter(user => {
        const role = (user.role || '').toLowerCase();
        return role === 'doctor' || role === 'physician' || role === 'dr';
      });
      
      // Update cache
      formDataCache.patients = newPatients;
      formDataCache.doctors = newDoctors;
      formDataCache.timestamp = Date.now();
      
      // Update state
      setPatients(newPatients);
      setDoctors(newDoctors);
    } catch (error) {
      toast.error('Failed to load form data');
    } finally {
      if (showLoading) {
        setLoadingPatients(false);
        setLoadingDoctors(false);
      }
    }
  }, []);

  useEffect(() => {
    // Reset success flag when modal opens/closes or appointment changes
    hasCalledSuccessRef.current = false;
    // Reset hasLoadedRef when appointment changes (allows reload when switching between edit/create)
    hasLoadedRef.current = false;
  }, [appointment]);

  useEffect(() => {
    // Prevent duplicate calls (React strict mode can trigger useEffect twice)
    if (hasLoadedRef.current) {
      return;
    }

    // Check cache first
    const cacheAge = Date.now() - formDataCache.timestamp;
    const isCacheValid = formDataCache.patients.length > 0 && 
                        formDataCache.doctors.length > 0 && 
                        cacheAge < CACHE_DURATION;
    const isStaleCacheValid = formDataCache.patients.length > 0 && 
                             formDataCache.doctors.length > 0 && 
                             cacheAge < STALE_CACHE_DURATION;
    
    // In edit mode, use stale cache if available (don't show loading)
    // In create mode, only use fresh cache or show loading
    const isEditMode = !!appointment;
    
    if (isCacheValid) {
      // Fresh cache - use immediately
      setPatients(formDataCache.patients);
      setDoctors(formDataCache.doctors);
      hasLoadedRef.current = true;
      // Refresh in background only if cache is older than 2 minutes (silent refresh)
      if (cacheAge > 2 * 60 * 1000) {
        loadFormData(false).catch(() => {});
      }
    } else if (isEditMode && isStaleCacheValid) {
      // Edit mode with stale cache - use it without loading spinner
      // This prevents unnecessary API calls when just viewing/editing
      setPatients(formDataCache.patients);
      setDoctors(formDataCache.doctors);
      hasLoadedRef.current = true;
      // Refresh in background silently (no loading state)
      loadFormData(false).catch(() => {});
    } else if (isEditMode && formDataCache.patients.length > 0 && formDataCache.doctors.length > 0) {
      // Edit mode with very old cache - still use it, refresh in background
      // Better UX than showing loading spinner
      setPatients(formDataCache.patients);
      setDoctors(formDataCache.doctors);
      hasLoadedRef.current = true;
      // Refresh in background silently
      loadFormData(false).catch(() => {});
    } else {
      // No cache or creating new appointment - load with loading spinner
      hasLoadedRef.current = true;
      loadFormData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment]);

  useEffect(() => {
    if (appointment) {
      const patientId = typeof appointment.patient === 'string' ? appointment.patient : appointment.patient?.id || '';
      const doctorId = typeof appointment.doctor === 'string' ? appointment.doctor : appointment.doctor?.id || '';
      
      // Store doctor ID for later matching
      appointmentDoctorIdRef.current = doctorId;
      
      setFormData({
        patient: patientId,
        doctor: doctorId,
        date: format(new Date(appointment.date), 'yyyy-MM-dd'),
        time: appointment.time || '',
        type: appointment.type || '',
        reason: appointment.reason || '',
      });
      
      // Set selected patient and doctor if they exist
      // Handle patient selection
      if (typeof appointment.patient === 'object' && appointment.patient) {
        setSelectedPatient(appointment.patient as Patient);
      } else if (patientId && patients.length > 0) {
        // Only try to find patient if patients list is loaded
        const patient = patients.find(p => {
          const pId = String(p.id || '');
          const aptId = String(patientId || '');
          return pId === aptId || p.id === patientId;
        });
        if (patient) {
          setSelectedPatient(patient);
          // Ensure formData has the correct patient ID
          setFormData(prev => ({ ...prev, patient: String(patient.id) }));
        }
      }
      
      // Handle doctor selection
      if (typeof appointment.doctor === 'object' && appointment.doctor) {
        // If doctor is already an object, use it directly
        const doctorObj = appointment.doctor as User;
        setSelectedDoctor(doctorObj);
        // Ensure formData has the correct doctor ID
        if (doctorObj.id) {
          const doctorIdStr = String(doctorObj.id);
          setFormData(prev => ({ ...prev, doctor: doctorIdStr }));
          appointmentDoctorIdRef.current = doctorIdStr;
        }
      } else if (doctorId) {
        // Try to find doctor in the list
        if (doctors.length > 0) {
          // Try multiple ID matching strategies in case of format differences
          const doctor = doctors.find(d => {
            const dId = String(d.id || '');
            const aptId = String(doctorId || '');
            // Try exact match, case-insensitive match, and direct comparison
            return dId === aptId || 
                   dId.toLowerCase() === aptId.toLowerCase() ||
                   d.id === doctorId ||
                   String(d.id) === String(doctorId);
          });
          
          if (doctor) {
            setSelectedDoctor(doctor);
            // Ensure formData has the correct doctor ID (use the doctor's actual ID format)
            const doctorIdStr = String(doctor.id);
            setFormData(prev => ({ ...prev, doctor: doctorIdStr }));
            appointmentDoctorIdRef.current = doctorIdStr;
          } else {
            // If doctor not found, log for debugging
            console.warn('Doctor not found in list:', { 
              appointmentDoctorId: doctorId, 
              doctorsCount: doctors.length, 
              doctorIds: doctors.map(d => ({ id: d.id, name: d.name, idType: typeof d.id }))
            });
          }
        }
        // If doctors list is not loaded yet, the doctorId is already in formData
        // The useEffect will re-run when doctors are loaded
      }
    } else {
      // Reset when no appointment (create mode)
      setSelectedPatient(null);
      setSelectedDoctor(null);
      appointmentDoctorIdRef.current = '';
    }
  }, [appointment, patients, doctors]);

  // Separate useEffect to retry finding doctor when doctors list loads
  useEffect(() => {
    // Only run if we have an appointment and a doctor ID to match, but no selected doctor yet
    if (appointment && appointmentDoctorIdRef.current && !selectedDoctor && doctors.length > 0) {
      const doctorId = appointmentDoctorIdRef.current;
      
      // Try to find the doctor with improved matching
      const doctor = doctors.find(d => {
        const dId = String(d.id || '');
        const aptId = String(doctorId || '');
        return dId === aptId || 
               dId.toLowerCase() === aptId.toLowerCase() ||
               d.id === doctorId ||
               String(d.id) === String(doctorId);
      });
      
      if (doctor) {
        setSelectedDoctor(doctor);
        const doctorIdStr = String(doctor.id);
        setFormData(prev => ({ ...prev, doctor: doctorIdStr }));
        appointmentDoctorIdRef.current = doctorIdStr;
      }
    }
  }, [appointment, doctors, selectedDoctor]);

  // Optimized field update handler
  const handleFieldChange = useCallback((field: keyof typeof formData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
    };
  }, []);

  // Optimized handlers for Autocomplete components
  const handlePatientChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, patient: value }));
  }, []);

  const handlePatientSelect = useCallback((option: any) => {
    const patient = option as Patient | null;
    setSelectedPatient(patient);
    // Ensure formData.patient is set to the patient ID
    if (patient && patient.id) {
      setFormData(prev => ({ ...prev, patient: patient.id }));
    }
  }, []);

  const handleDoctorChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, doctor: value }));
  }, []);

  const handleDoctorSelect = useCallback((option: any) => {
    const doctor = option as User | null;
    setSelectedDoctor(doctor);
    // Ensure formData.doctor is set to the doctor ID
    if (doctor && doctor.id) {
      setFormData(prev => ({ ...prev, doctor: String(doctor.id) }));
    } else if (!doctor) {
      setFormData(prev => ({ ...prev, doctor: '' }));
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmittingRef.current) {
      return;
    }
    
    // Validate required fields with detailed error messages
    if (!formData.patient || formData.patient.trim() === '') {
      toast.error('Please select a patient');
      return;
    }
    
    if (!formData.doctor || formData.doctor.trim() === '') {
      toast.error('Please select a doctor');
      return;
    }
    
    if (!formData.date || formData.date.trim() === '') {
      toast.error('Please select a date');
      return;
    }
    
    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error('Please select a date that is today or in the future');
      return;
    }
    
    if (!formData.time || formData.time.trim() === '') {
      toast.error('Please select a time');
      return;
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.time)) {
      toast.error('Please select a valid time');
      return;
    }
    
    // Validate appointment date and time combination is in the future
    const appointmentDateTime = new Date(`${formData.date}T${formData.time}`);
    if (appointmentDateTime <= new Date()) {
      toast.error('Please select a date and time in the future');
      return;
    }
    
    if (!formData.type || formData.type.trim() === '') {
      toast.error('Please select an appointment type');
      return;
    }
    
    if (!formData.reason || formData.reason.trim() === '') {
      toast.error('Please provide a reason for the visit');
      return;
    }
    
    // Validate reason has minimum length
    if (formData.reason.trim().length < 3) {
      toast.error('Reason for visit must be at least 3 characters long');
      return;
    }
    
    if (formData.reason.trim().length > 500) {
      toast.error('Reason for visit must be less than 500 characters');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      // Verify token exists before making the request
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to continue.');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }, 1500);
        setLoading(false);
        return;
      }

      // Ensure we have valid patient and doctor IDs
      const patientId = selectedPatient?.id || formData.patient;
      const doctorId = selectedDoctor?.id || formData.doctor;

      if (!patientId || patientId.trim() === '') {
        toast.error('Please select a valid patient');
        setLoading(false);
        return;
      }

      if (!doctorId || doctorId.trim() === '') {
        toast.error('Please select a valid doctor');
        setLoading(false);
        return;
      }

      // Prepare appointment data with proper IDs
      const appointmentData = {
        ...formData,
        patient: patientId, // Ensure we use the patient ID
        doctor: doctorId, // Ensure we use the doctor ID
        reason: formData.reason || 'General consultation',
      };

      let responseData: Appointment | undefined;
      if (appointment) {
        const response = await crmAppointmentService.updateAppointment(appointment.id, appointmentData);
        toast.success('Appointment updated successfully');
        responseData = response.data;
      } else {
        const response = await crmAppointmentService.createAppointment(appointmentData);
        toast.success('Appointment created successfully');
        responseData = response.data;
      }
      
      // Call onSuccess only once - parent will handle closing the modal
      if (!hasCalledSuccessRef.current) {
        hasCalledSuccessRef.current = true;
        onSuccess(responseData);
      }
    } catch (error: any) {
      // Handle different types of errors
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save appointment';
      const status = error.response?.status;
      const token = sessionStorage.getItem('token');
      
      console.error('Appointment save error:', {
        status,
        message: errorMessage,
        hasToken: !!token,
        tokenLength: token?.length || 0,
        url: error.config?.url,
        requestHeaders: error.config?.headers,
        authHeader: error.config?.headers?.Authorization || error.config?.headers?.authorization
      });
      
      // Check if it's an authentication error
      if (status === 401) {
        const authErrorMsg = errorMessage.toLowerCase();
        if (authErrorMsg.includes('token') || authErrorMsg.includes('access denied') || authErrorMsg.includes('unauthorized') || authErrorMsg.includes('no token')) {
          // Check if token exists in sessionStorage
          if (!token) {
            // No token - user needs to log in
            toast.error('Please log in to continue.');
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }, 1500);
          } else {
            // Token exists but was rejected - might be expired or invalid
            // Try to refresh the token or re-authenticate
            toast.error('Your session has expired. Please log in again.');
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('token');
                localStorage.removeItem('token');
                window.location.href = '/login';
              }
            }, 2000);
          }
        } else {
          // It's a validation error, show the message
          toast.error(errorMessage);
        }
      } else if (status === 400) {
        // Validation error
        toast.error(errorMessage);
      } else {
        // Other errors (500, etc.)
        toast.error(errorMessage || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [formData, appointment, selectedPatient, selectedDoctor, onSuccess]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {appointment ? 'Edit Appointment' : 'Schedule New Appointment'}
            </h3>
            <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Patient *
              </label>
              <Autocomplete
                options={patients.map(p => ({
                  ...p,
                  id: p.id,
                  label: `${p.name} (${p.age} years)`,
                }))}
                value={formData.patient}
                onChange={handlePatientChange}
                onSelect={handlePatientSelect}
                placeholder="Type to search patients..."
                disabled={false}
                loading={false}
                required
                name="patient"
                getOptionLabel={(option) => option.label}
                getOptionValue={(option) => option.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Doctor *
              </label>
              <Autocomplete
                options={doctors.map(d => ({
                  ...d,
                  id: String(d.id), // Ensure ID is always a string for consistent matching
                  label: `${d.name} - ${d.department || 'General'}`,
                }))}
                value={formData.doctor ? String(formData.doctor) : ''}
                onChange={handleDoctorChange}
                onSelect={handleDoctorSelect}
                placeholder="Type to search doctors..."
                disabled={false}
                loading={loadingDoctors}
                required
                name="doctor"
                getOptionLabel={(option) => option.label}
                getOptionValue={(option) => String(option.id)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={handleFieldChange('date')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={handleFieldChange('time')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Type</option>
                <option value="Consultation">Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Checkup">Regular Checkup</option>
                <option value="Surgery">Surgery</option>
                <option value="Lab Results">Lab Results Review</option>
                <option value="Vaccination">Vaccination</option>
                <option value="Physical Therapy">Physical Therapy</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit *
              </label>
              <textarea
                required
                rows={3}
                value={formData.reason}
                onChange={handleFieldChange('reason')}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Brief description of the reason for this appointment..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {loading ? 'Saving...' : appointment ? 'Update Appointment' : 'Schedule Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

