'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Plus, Search, Edit, X, ChevronLeft, ChevronRight, Filter, MessageSquare } from 'lucide-react';
import { appointmentService, patientService, teamService } from '@/lib/services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth } from 'date-fns';
import toast from 'react-hot-toast';
import AppointmentModal, { preloadFormData } from '@/components/modals/AppointmentModal';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { Appointment } from '@/types';

// Cache for appointments data to enable instant navigation
const appointmentsCache: {
  appointments: Record<string, Appointment[]>;
  timestamp: number;
} = {
  appointments: {},
  timestamp: 0,
};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allMonthAppointments, setAllMonthAppointments] = useState<Appointment[]>([]); // For calendar dots
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [whatsappReminders, setWhatsappReminders] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load appointments for selected date
  useEffect(() => {
    loadAppointmentsForDate();
    // Preload patients and doctors data for appointment modal (in background)
    preloadFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);


  // Load all appointments for current month (for calendar dots)
  useEffect(() => {
    loadMonthAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  // Filter appointments based on search and status
  useEffect(() => {
    let filtered = [...appointments];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(apt => {
        const patient = typeof apt.patient === 'object' ? apt.patient : null;
        const patientName = patient?.name || '';
        return patientName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter]);

  const loadAppointmentsForDate = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await appointmentService.getAppointments({ date: dateStr });
      let newAppointments = response.data || [];
      
      // Add mock data if no appointments exist (for demonstration)
      if (newAppointments.length === 0 && isSameDay(selectedDate, new Date())) {
        const today = new Date();
        newAppointments = [
          {
            id: 'mock1',
            patient: { id: '1', name: 'Sarah Miller', phone: '+1 (555) 123-4567', initials: 'SM', avatarColor: 'bg-blue-500' } as any,
            doctor: { id: '1', name: 'Dr. John Davis' } as any,
            date: today,
            time: '10:00',
            status: 'confirmed',
            type: 'Consultation',
          },
          {
            id: 'mock2',
            patient: { id: '2', name: 'James Davis', phone: '+1 (555) 234-5678', initials: 'JD', avatarColor: 'bg-purple-500' } as any,
            doctor: { id: '2', name: 'Dr. Sarah Wilson' } as any,
            date: today,
            time: '14:30',
            status: 'pending',
            type: 'Follow-up',
          },
        ];
      }
      
      // Update cache
      appointmentsCache.appointments[dateStr] = newAppointments;
      appointmentsCache.timestamp = Date.now();
      
      setAppointments(newAppointments);
    } catch (error) {
      toast.error('Failed to load appointments');
      console.error('Load appointments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthAppointments = async () => {
    try {
      // Load appointments for the entire month
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      // Load appointments for all days in the month (in batches to avoid too many requests)
      const allAppts: Appointment[] = [];
      const batchSize = 7; // Load a week at a time
      
      for (let i = 0; i < monthDays.length; i += batchSize) {
        const batch = monthDays.slice(i, i + batchSize);
        const promises = batch.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          return appointmentService.getAppointments({ date: dateStr }).catch(() => ({ data: [] }));
        });
        
        const results = await Promise.all(promises);
        results.forEach(result => {
          if (result.data) {
            allAppts.push(...result.data);
          }
        });
      }
      
      // Add mock data for demonstration if no appointments exist
      if (allAppts.length === 0) {
        const today = new Date();
        const mockDates = [
          new Date(today.getFullYear(), today.getMonth(), 15),
          new Date(today.getFullYear(), today.getMonth(), 16),
          new Date(today.getFullYear(), today.getMonth(), 17),
          new Date(today.getFullYear(), today.getMonth(), 18),
          new Date(today.getFullYear(), today.getMonth(), 22),
          new Date(today.getFullYear(), today.getMonth(), 23),
          new Date(today.getFullYear(), today.getMonth(), 24),
        ];
        
        const mockAppts: Appointment[] = [
          {
            id: 'mock1',
            patient: { id: '1', name: 'Sarah Miller', phone: '+1 (555) 123-4567', initials: 'SM', avatarColor: 'bg-blue-500' } as any,
            doctor: { id: '1', name: 'Dr. John Davis' } as any,
            date: mockDates[0],
            time: '10:00',
            status: 'confirmed',
            type: 'Consultation',
          },
          {
            id: 'mock2',
            patient: { id: '2', name: 'James Davis', phone: '+1 (555) 234-5678', initials: 'JD', avatarColor: 'bg-purple-500' } as any,
            doctor: { id: '2', name: 'Dr. Sarah Wilson' } as any,
            date: mockDates[0],
            time: '14:30',
            status: 'pending',
            type: 'Follow-up',
          },
          {
            id: 'mock3',
            patient: { id: '3', name: 'Emma Wilson', phone: '+1 (555) 345-6789', initials: 'EW', avatarColor: 'bg-green-500' } as any,
            doctor: { id: '3', name: 'Dr. Michael Brown' } as any,
            date: mockDates[1],
            time: '09:15',
            status: 'confirmed',
            type: 'Checkup',
          },
          {
            id: 'mock4',
            patient: { id: '4', name: 'Michael Johnson', phone: '+1 (555) 456-7890', initials: 'MJ', avatarColor: 'bg-red-500' } as any,
            doctor: { id: '1', name: 'Dr. John Davis' } as any,
            date: mockDates[2],
            time: '11:30',
            status: 'completed',
            type: 'Surgery',
          },
          {
            id: 'mock5',
            patient: { id: '5', name: 'Lisa Anderson', phone: '+1 (555) 567-8901', initials: 'LA', avatarColor: 'bg-yellow-500' } as any,
            doctor: { id: '2', name: 'Dr. Sarah Wilson' } as any,
            date: mockDates[3],
            time: '15:00',
            status: 'cancelled',
            type: 'Consultation',
          },
        ];
        allAppts.push(...mockAppts);
      }
      
      // Remove duplicates based on appointment ID
      const uniqueAppts = allAppts.filter((apt, index, self) =>
        index === self.findIndex((a) => a.id === apt.id)
      );
      
      setAllMonthAppointments(uniqueAppts);
    } catch (error) {
      // Silently fail - calendar dots are optional
      console.error('Load month appointments error:', error);
    }
  };

  const handleAppointmentCreated = () => {
    setShowAddModal(false);
    setSelectedAppointment(null);
    loadAppointmentsForDate();
    loadMonthAppointments(); // Refresh calendar dots
  };

  const maskPhoneNumber = (phone?: string) => {
    if (!phone) return 'N/A';
    if (phone.length <= 4) return phone;
    const visible = phone.slice(-4);
    const masked = '*'.repeat(phone.length - 4);
    return `${masked}${visible}`;
  };

  const formatTime = (time: string) => {
    // Convert 24-hour format to 12-hour format if needed
    if (time.includes('AM') || time.includes('PM')) {
      return time;
    }
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 % 12 || 12;
    const period = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${period}`;
  };

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-3 md:space-y-6">
          <div className="mb-3 md:mb-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-gray-900">Appointments</h2>
                <p className="text-xs md:text-base text-gray-600 mt-0.5">Manage and schedule appointments</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6">
              <div className="flex-1 md:flex-none md:flex-1 relative">
                <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 md:pl-10 pr-2 md:pr-4 py-1.5 md:py-2.5 bg-white rounded-lg md:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs md:text-sm"
                />
              </div>
              <div className="relative flex-shrink-0" ref={filterMenuRef}>
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="p-2 md:p-3 bg-white border border-gray-200 rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors h-[36px] md:h-auto"
                  title="Filter"
                >
                  <Filter className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" />
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        statusFilter === 'all' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('confirmed');
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        statusFilter === 'confirmed' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                      }`}
                    >
                      Confirmed
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('pending');
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        statusFilter === 'pending' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('cancelled');
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        statusFilter === 'cancelled' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                      }`}
                    >
                      Cancelled
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedAppointment(null);
                  setShowAddModal(true);
                }}
                className="bg-primary text-white px-3 md:px-6 py-1.5 md:py-2.5 rounded-lg md:rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center shadow-md hover:shadow-lg text-xs md:text-sm flex-shrink-0 h-[36px] md:h-auto whitespace-nowrap"
              >
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg md:rounded-xl p-2 md:p-4 shadow-sm border border-gray-100 mb-3 md:mb-6">
            <CalendarView
              selectedDate={selectedDate}
              currentMonth={currentMonth}
              onDateSelect={setSelectedDate}
              onMonthChange={setCurrentMonth}
              appointments={allMonthAppointments}
              selectedDateAppointments={appointments}
            />
          </div>

          {/* WhatsApp Toggle */}
          <div className="flex justify-end items-center space-x-1.5 md:space-x-2 mb-3 md:mb-4">
            <div className="flex items-center space-x-1 md:space-x-1.5">
              <MessageSquare className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600" />
              <span className="text-[10px] md:text-xs text-gray-700">WhatsApp Reminders</span>
            </div>
            <button
              onClick={() => setWhatsappReminders(!whatsappReminders)}
              type="button"
              role="switch"
              aria-checked={whatsappReminders}
              className={`relative inline-flex h-5 w-9 md:h-6 md:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                whatsappReminders ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 md:h-5 md:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  whatsappReminders ? 'translate-x-4 md:translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm border border-gray-100 mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <h3 className="text-sm md:text-lg font-semibold text-gray-900">
                  Appointments for {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                <p className="text-[10px] md:text-sm text-gray-500 mt-0.5">
                  {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} {statusFilter !== 'all' ? `(${statusFilter})` : ''}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-6 md:py-8">
                <Calendar className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-2 md:mb-3" />
                <p className="text-xs md:text-sm text-gray-500 font-medium mb-1">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No appointments found matching your criteria'
                    : 'No appointments scheduled for this date'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <>
                    <p className="text-[10px] md:text-xs text-gray-400 mb-2 md:mb-3">Schedule an appointment to get started</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-primary text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-medium hover:bg-primary-dark transition-colors shadow-sm"
                    >
                      Schedule Appointment
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 md:space-y-2">
                {filteredAppointments.map((appointment) => (
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
                          loadAppointmentsForDate();
                          loadMonthAppointments();
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

          {/* Upcoming Appointments Section */}
          <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm border border-gray-100 mb-4 md:mb-6">
            <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              Upcoming Appointments
            </h3>
            <div className="space-y-2 md:space-y-3">
              {getUpcomingAppointments().map((appointment) => (
                <UpcomingAppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onEdit={() => {
                    setSelectedAppointment(appointment);
                    setShowAddModal(true);
                  }}
                  onReschedule={() => {
                    setSelectedAppointment(appointment);
                    setShowAddModal(true);
                  }}
                  onDelete={async () => {
                    if (window.confirm('Cancel this appointment?')) {
                      try {
                        await appointmentService.cancelAppointment(appointment.id);
                        toast.success('Appointment cancelled');
                        loadAppointmentsForDate();
                        loadMonthAppointments();
                      } catch (error) {
                        toast.error('Failed to cancel appointment');
                      }
                    }
                  }}
                />
              ))}
            </div>
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

// Helper function to format time
function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Helper function to get upcoming appointments with mock data
function getUpcomingAppointments(): Appointment[] {
  const today = new Date();
  const mockUpcoming: Appointment[] = [
    {
      id: 'upcoming1',
      patient: { id: '1', name: 'Sarah Miller', phone: '+1 (555) 123-4567', initials: 'SM', avatarColor: 'bg-blue-500' } as any,
      doctor: { id: '1', name: 'Dr. John Davis' } as any,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      time: '10:00',
      status: 'confirmed',
      type: 'Consultation',
    },
    {
      id: 'upcoming2',
      patient: { id: '2', name: 'James Davis', phone: '+1 (555) 234-5678', initials: 'JD', avatarColor: 'bg-purple-500' } as any,
      doctor: { id: '2', name: 'Dr. Sarah Wilson' } as any,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      time: '14:30',
      status: 'pending',
      type: 'Follow-up',
    },
    {
      id: 'upcoming3',
      patient: { id: '3', name: 'Emma Wilson', phone: '+1 (555) 345-6789', initials: 'EW', avatarColor: 'bg-green-500' } as any,
      doctor: { id: '3', name: 'Dr. Michael Brown' } as any,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
      time: '09:15',
      status: 'confirmed',
      type: 'Checkup',
    },
    {
      id: 'upcoming4',
      patient: { id: '4', name: 'Michael Johnson', phone: '+1 (555) 456-7890', initials: 'MJ', avatarColor: 'bg-red-500' } as any,
      doctor: { id: '1', name: 'Dr. Lisa Anderson' } as any,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
      time: '11:30',
      status: 'completed',
      type: 'Surgery',
    },
    {
      id: 'upcoming5',
      patient: { id: '5', name: 'Anna Lee', phone: '+1 (555) 567-8901', initials: 'AL', avatarColor: 'bg-orange-500' } as any,
      doctor: { id: '2', name: 'Dr. Sarah Wilson' } as any,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4),
      time: '15:00',
      status: 'cancelled',
      type: 'Consultation',
    },
  ];
  return mockUpcoming;
}

// Upcoming Appointment Card Component
function UpcomingAppointmentCard({ appointment, onEdit, onReschedule, onDelete }: {
  appointment: Appointment;
  onEdit: () => void;
  onReschedule: () => void;
  onDelete: () => void;
}) {
  const patient = appointment.patient as any;
  const doctor = appointment.doctor as any;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg md:rounded-xl p-2.5 md:p-4 border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 md:space-x-3 flex-1 min-w-0">
          <div className={`w-8 h-8 md:w-10 md:h-10 ${patient?.avatarColor || 'bg-primary'} rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-semibold flex-shrink-0`}>
            {patient?.initials || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs md:text-sm text-gray-900 mb-0.5 md:mb-1">{patient?.name || 'Unknown'}</p>
            <p className="text-[10px] md:text-xs text-gray-600 mb-0.5">
              {format(new Date(appointment.date), 'MMMM d, yyyy')} • {formatTime(appointment.time)}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600">
              {doctor?.name || 'Unknown Doctor'} • {appointment.type || 'Consultation'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1 md:space-y-2 flex-shrink-0 ml-2">
          <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full border ${getStatusColor(appointment.status)}`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Edit"
            >
              <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReschedule();
              }}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Reschedule"
            >
              <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Cancel"
            >
              <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ selectedDate, currentMonth, onDateSelect, onMonthChange, appointments, selectedDateAppointments }: {
  selectedDate: Date;
  currentMonth: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (month: Date) => void;
  appointments: Appointment[];
  selectedDateAppointments?: Appointment[];
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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
        return 'bg-orange-500';
      case 'completed':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusDots = (dayAppointments: Appointment[]) => {
    const statusCounts: Record<string, number> = {};
    dayAppointments.forEach(apt => {
      statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
    });
    return statusCounts;
  };

  const nextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <button
          onClick={prevMonth}
          className="p-1 md:p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" />
        </button>
        <h3 className="font-semibold text-sm md:text-lg text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1 md:p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-2 md:mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-[10px] md:text-xs font-medium text-gray-500 py-0.5 md:py-1">
            {day}
          </div>
        ))}
        {calendarDays.map(day => {
          const dayAppointments = getAppointmentsForDate(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const statusDots = getStatusDots(dayAppointments);

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                onDateSelect(day);
                if (!isSameMonth(day, currentMonth)) {
                  onMonthChange(day);
                }
              }}
              className={`text-center py-1 md:py-1.5 rounded-md md:rounded-lg transition-colors text-[10px] md:text-xs relative ${
                !isCurrentMonth
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                  ? 'bg-primary text-white shadow-md font-semibold'
                  : isCurrentDay
                  ? 'bg-green-100 text-primary font-semibold hover:bg-green-200'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="text-xs md:text-sm">{format(day, 'd')}</div>
              {dayAppointments.length > 0 && isCurrentMonth && (
                <div className="flex justify-center space-x-0.5 mt-0.5 md:mt-1">
                  {Object.entries(statusDots).slice(0, 4).map(([status, count]) => (
                    <div
                      key={status}
                      className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${getStatusColor(status)}`}
                      title={`${count} ${status} appointment${count > 1 ? 's' : ''}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 pt-2 md:pt-3 border-t border-gray-200">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500"></div>
          <span className="text-[10px] md:text-xs text-gray-600">Confirmed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-orange-500"></div>
          <span className="text-[10px] md:text-xs text-gray-600">Pending</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-500"></div>
          <span className="text-[10px] md:text-xs text-gray-600">Completed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500"></div>
          <span className="text-[10px] md:text-xs text-gray-600">Cancelled</span>
        </div>
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
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'border-l-green-500';
      case 'pending':
        return 'border-l-yellow-500';
      case 'completed':
        return 'border-l-blue-500';
      case 'cancelled':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const maskPhoneNumber = (phone?: string) => {
    if (!phone) return 'N/A';
    if (phone.length <= 4) return phone;
    const visible = phone.slice(-4);
    const masked = '*'.repeat(Math.max(0, phone.length - 4));
    return `${masked}${visible}`;
  };

  const formatTime = (time: string) => {
    if (time.includes('AM') || time.includes('PM')) {
      return time;
    }
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 % 12 || 12;
    const period = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${period}`;
  };

  return (
    <div className={`bg-white rounded-lg md:rounded-xl p-2.5 md:p-4 border-l-4 ${getStatusBorderColor(appointment.status)} border border-gray-200 hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 md:space-x-3 flex-1 min-w-0">
          <div className={`w-8 h-8 md:w-10 md:h-10 ${patient?.avatarColor || 'bg-primary'} rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-semibold flex-shrink-0`}>
            {patient?.initials || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 md:space-x-2 mb-0.5 md:mb-1 flex-wrap">
              <p className="font-semibold text-xs md:text-sm text-gray-900">{patient?.name || 'Unknown'}</p>
              <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full border ${getStatusColor(appointment.status)} flex-shrink-0`}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-gray-600 mb-0.5">
              {appointment.type || 'Consultation'}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600 mb-0.5">
              {maskPhoneNumber(patient?.phone)}
            </p>
            <p className="text-[10px] md:text-xs text-gray-600">
              {formatTime(appointment.time)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0 ml-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 md:p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 md:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cancel"
          >
            <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
