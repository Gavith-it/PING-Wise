'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { appointmentService, patientService, teamService } from '@/lib/services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Appointment, Patient, User } from '@/types';
import Autocomplete from '@/components/ui/autocomplete';

interface AppointmentModalProps {
  appointment?: Appointment | null;
  selectedDate?: Date;
  onClose: () => void;
  onSuccess: () => void;
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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);

  useEffect(() => {
    // Load data in background after modal opens
    loadFormData();
  }, []);

  useEffect(() => {
    if (appointment) {
      const patientId = typeof appointment.patient === 'string' ? appointment.patient : appointment.patient?.id || '';
      const doctorId = typeof appointment.doctor === 'string' ? appointment.doctor : appointment.doctor?.id || '';
      setFormData({
        patient: patientId,
        doctor: doctorId,
        date: format(new Date(appointment.date), 'yyyy-MM-dd'),
        time: appointment.time || '',
        type: appointment.type || '',
        reason: appointment.reason || '',
      });
      
      // Set selected patient and doctor if they exist
      if (typeof appointment.patient === 'object' && appointment.patient) {
        setSelectedPatient(appointment.patient as Patient);
      } else if (patientId) {
        const patient = patients.find(p => p.id === patientId);
        if (patient) setSelectedPatient(patient);
      }
      
      if (typeof appointment.doctor === 'object' && appointment.doctor) {
        setSelectedDoctor(appointment.doctor as User);
      } else if (doctorId) {
        const doctor = doctors.find(d => d.id === doctorId);
        if (doctor) setSelectedDoctor(doctor);
      }
    }
  }, [appointment, patients, doctors]);

  const loadFormData = async () => {
    try {
      setLoadingPatients(true);
      setLoadingDoctors(true);
      const [patientsRes, doctorsRes] = await Promise.all([
        patientService.getPatients({ limit: 100 }),
        teamService.getTeamMembers({ role: 'doctor' }),
      ]);
      setPatients(patientsRes.data || []);
      setDoctors(doctorsRes.data || []);
    } catch (error) {
      toast.error('Failed to load form data');
    } finally {
      setLoadingPatients(false);
      setLoadingDoctors(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.patient) {
      toast.error('Please select a patient');
      return;
    }
    if (!formData.doctor) {
      toast.error('Please select a doctor');
      return;
    }
    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }
    if (!formData.time) {
      toast.error('Please select a time');
      return;
    }
    if (!formData.type) {
      toast.error('Please select an appointment type');
      return;
    }
    if (!formData.reason) {
      toast.error('Please provide a reason for the visit');
      return;
    }

    setLoading(true);

    try {
      if (appointment) {
        await appointmentService.updateAppointment(appointment.id, formData);
        toast.success('Appointment updated successfully');
      } else {
        await appointmentService.createAppointment({
          ...formData,
          reason: formData.reason || 'General consultation',
        });
        toast.success('Appointment created successfully');
      }
      onSuccess();
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
      });
      
      // Check if it's an authentication error
      if (status === 401) {
        const authErrorMsg = errorMessage.toLowerCase();
        if (authErrorMsg.includes('token') || authErrorMsg.includes('access denied') || authErrorMsg.includes('unauthorized') || authErrorMsg.includes('no token')) {
          // Check if token exists
          if (!token) {
            toast.error('Please log in to continue.');
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }, 1500);
          } else {
            // Token exists but was rejected - might be expired or invalid
            toast.error('Your session has expired. Please log in again.');
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('token');
                // Also clear localStorage token if it exists (cleanup)
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
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {appointment ? 'Edit Appointment' : 'Schedule New Appointment'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient *
              </label>
              <Autocomplete
                options={patients.map(p => ({
                  ...p,
                  id: p.id,
                  label: `${p.name} (${p.age} years)`,
                }))}
                value={formData.patient}
                onChange={(value) => setFormData({ ...formData, patient: value })}
                onSelect={(option) => setSelectedPatient(option as Patient | null)}
                placeholder={loadingPatients ? 'Loading patients...' : 'Type to search patients...'}
                disabled={loadingPatients}
                loading={loadingPatients}
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
                  id: d.id,
                  label: `${d.name} - ${d.department || 'General'}`,
                }))}
                value={formData.doctor}
                onChange={(value) => setFormData({ ...formData, doctor: value })}
                onSelect={(option) => setSelectedDoctor(option as User | null)}
                placeholder={loadingDoctors ? 'Loading doctors...' : 'Type to search doctors...'}
                disabled={loadingDoctors}
                loading={loadingDoctors}
                required
                name="doctor"
                getOptionLabel={(option) => option.label}
                getOptionValue={(option) => option.id}
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
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Brief description of the reason for this appointment..."
              />
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
                {loading ? 'Saving...' : appointment ? 'Update Appointment' : 'Schedule Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

