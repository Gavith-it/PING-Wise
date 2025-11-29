'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Edit, X } from 'lucide-react';
import { appointmentService } from '@/lib/services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import toast from 'react-hot-toast';
import AppointmentModal from '@/components/modals/AppointmentModal';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { Appointment } from '@/types';

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await appointmentService.getAppointments({ date: dateStr });
      setAppointments(response.data || []);
    } catch (error) {
      toast.error('Failed to load appointments');
      console.error('Load appointments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentCreated = () => {
    setShowAddModal(false);
    setSelectedAppointment(null);
    loadAppointments();
  };

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-4 md:space-y-6">
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Appointments</h2>
                <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">Manage and schedule appointments</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 bg-white rounded-lg md:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
                />
              </div>
              <button
                onClick={() => {
                  setSelectedAppointment(null);
                  setShowAddModal(true);
                }}
                className="bg-primary text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2 shadow-md hover:shadow-lg text-sm md:text-base"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                <span>New Appointment</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm border border-gray-100 mb-4 md:mb-6">
            <CalendarView
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              appointments={appointments}
            />
          </div>

          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Appointments for {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">
                  {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Calendar className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-gray-500 font-medium mb-1 md:mb-2">No appointments scheduled for this date</p>
                <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4">Schedule an appointment to get started</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm"
                >
                  Schedule Appointment
                </button>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={() => {
                      setSelectedAppointment(appointment);
                      setShowAddModal(true);
                    }}
                    onDelete={async () => {
                      if (window.confirm('Cancel this appointment?')) {
                        try {
                          await appointmentService.cancelAppointment(appointment.id);
                          toast.success('Appointment cancelled');
                          loadAppointments();
                        } catch (error) {
                          toast.error('Failed to cancel appointment');
                        }
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {showAddModal && (
            <AppointmentModal
              appointment={selectedAppointment}
              selectedDate={selectedDate}
              onClose={() => {
                setShowAddModal(false);
                setSelectedAppointment(null);
              }}
              onSuccess={handleAppointmentCreated}
            />
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
}

function CalendarView({ selectedDate, onDateSelect, appointments }: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  appointments: Appointment[];
}) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.date), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-2 md:mb-3">
        {format(selectedDate, 'MMMM yyyy')}
      </h3>
      <div className="grid grid-cols-7 gap-0.5 md:gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs md:text-sm font-medium text-gray-500 py-1 md:py-2">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dayAppointments = getAppointmentsForDate(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`text-center py-1 md:py-2 rounded-md md:rounded-lg transition-colors text-xs md:text-sm ${
                isSelected
                  ? 'bg-primary text-white shadow-md'
                  : isCurrentDay
                  ? 'bg-green-100 text-primary font-semibold'
                  : 'hover:bg-green-50 text-gray-700'
              }`}
            >
              <div>{format(day, 'd')}</div>
              {dayAppointments.length > 0 && (
                <div className="flex justify-center space-x-0.5 md:space-x-1 mt-0.5 md:mt-1">
                  {dayAppointments.slice(0, 3).map((apt, idx) => (
                    <div
                      key={idx}
                      className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${getStatusColor(apt.status)}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentCard({ appointment, onEdit, onDelete }: {
  appointment: Appointment;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const patient = typeof appointment.patient === 'object' ? appointment.patient : null;
  const doctor = typeof appointment.doctor === 'object' ? appointment.doctor : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 border border-gray-200 hover:border-primary hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 md:space-x-4 flex-1 min-w-0">
          <div className={`w-10 h-10 md:w-12 md:h-12 ${patient?.avatarColor || 'bg-primary'} rounded-full flex items-center justify-center text-white text-xs md:text-sm font-semibold flex-shrink-0`}>
            {patient?.initials || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 md:space-x-2 mb-0.5 md:mb-1 flex-wrap">
              <p className="font-semibold text-sm md:text-base text-gray-900 truncate">{patient?.name || 'Unknown'}</p>
              <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2.5 py-0.5 rounded-full border ${getStatusColor(appointment.status)} flex-shrink-0`}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1 truncate">
              {appointment.time} • {doctor?.name || 'Unknown Doctor'}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 truncate">{appointment.type}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 md:p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 md:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
