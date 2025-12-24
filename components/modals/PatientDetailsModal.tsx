'use client';

import { X, Phone, Mail, Edit } from 'lucide-react';
import { Patient } from '@/types';

interface PatientDetailsModalProps {
  patient: Patient;
  onClose: () => void;
  onEdit: () => void;
}

export default function PatientDetailsModal({ patient, onClose, onEdit }: PatientDetailsModalProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'booked':
        return 'bg-blue-100 text-blue-700';
      case 'follow-up':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Patient Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className={`w-16 h-16 ${patient.avatarColor || 'bg-primary'} rounded-full flex items-center justify-center text-white text-xl font-medium mx-auto mb-3 shadow-md`}>
              {patient.initials || 'P'}
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{patient.name}</h4>
            <p className="text-gray-600 dark:text-gray-400">{patient.age} years old</p>
            <span className={`inline-block text-sm px-3 py-1 rounded-full ${getStatusColor(patient.status)} mt-2`}>
              {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{patient.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{patient.email}</span>
              </div>
              {patient.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                  <p className="text-gray-700 dark:text-gray-300">{patient.address}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h5>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                  <p className="text-gray-900 dark:text-white capitalize">
                    {patient.gender || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                  <p className="text-gray-900 dark:text-white">
                    {patient.dateOfBirth 
                      ? new Date(patient.dateOfBirth).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Medical Information</h5>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Visit</label>
                  <p className="text-gray-900 dark:text-white">
                    {patient.lastVisit 
                      ? new Date(patient.lastVisit).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Appointment</label>
                  <p className="text-gray-900 dark:text-white">
                    {patient.nextAppointment 
                      ? new Date(patient.nextAppointment).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {patient.medicalNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Medical Notes</label>
                  <p className="text-gray-900 dark:text-white">{patient.medicalNotes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onEdit}
              className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Patient</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

