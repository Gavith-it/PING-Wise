'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { appointmentService, patientService, teamService } from '@/lib/services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Appointment, Patient, User } from '@/types';

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
        reason: '',
      });
    }
  }, [appointment]);

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
      toast.error(error.response?.data?.message || 'Failed to save appointment');
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
              <select
                required
                value={formData.patient}
                onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                disabled={loadingPatients}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">{loadingPatients ? 'Loading patients...' : 'Select Patient'}</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.age} years)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Doctor *
              </label>
              <select
                required
                value={formData.doctor}
                onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                disabled={loadingDoctors}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">{loadingDoctors ? 'Loading doctors...' : 'Select Doctor'}</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} - {d.department || 'General'}
                  </option>
                ))}
              </select>
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

