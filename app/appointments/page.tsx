'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, MessageSquare } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import AppointmentModal from '@/components/modals/AppointmentModal';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ToggleSwitch from '@/components/ui/toggle-switch';
import { Appointment } from '@/types';
import { useAppointments } from './hooks/useAppointments';
import { usePatientEnrichment } from './hooks/usePatientEnrichment';
import { useAppointmentFilters } from './hooks/useAppointmentFilters';
import { useUpcomingAppointments } from './hooks/useUpcomingAppointments';
import { useAppointmentEdit } from './hooks/useAppointmentEdit';
import CalendarView from './components/CalendarView';
import AppointmentSearchBar from './components/AppointmentSearchBar';
import AppointmentList from './components/AppointmentList';
import UpcomingAppointmentsList from './components/UpcomingAppointmentsList';

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [whatsappReminders, setWhatsappReminders] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Use patient enrichment hook
  const { enrichAppointmentsWithPatients } = usePatientEnrichment();

  // Use appointments hook
  const {
    appointments,
    allMonthAppointments,
    loading,
    handleAppointmentCreated,
    handleDeleteAppointment,
  } = useAppointments({
    selectedDate,
    currentMonth,
    enrichAppointmentsWithPatients,
  });

  // Filter appointments to only show today's appointments in the top section
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const todayAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
      return isSameDay(aptDate, today);
    });
  }, [appointments, today]);

  // Use filter hook for today's appointments
  const filteredAppointments = useAppointmentFilters(todayAppointments, searchTerm, statusFilter);

  // Use upcoming appointments hook - shows appointments for selected date (if not today) and other future dates
  const upcomingAppointments = useUpcomingAppointments(allMonthAppointments, appointments, selectedDate, today);

  // Use edit hook
  const {
    selectedAppointment,
    handleEdit,
    handleReschedule,
    clearSelected,
    setSelectedAppointment,
  } = useAppointmentEdit(enrichAppointmentsWithPatients);

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

  const handleAddClick = () => {
    setSelectedAppointment(null);
    setShowAddModal(true);
  };

  const handleEditClick = (appointment: Appointment) => {
    handleEdit(appointment, () => setShowAddModal(true));
  };

  const handleRescheduleClick = (appointment: Appointment) => {
    handleReschedule(appointment, () => setShowAddModal(true));
  };

  const handleAppointmentCreatedWithModal = async (updatedAppointment?: Appointment) => {
    setShowAddModal(false);
    clearSelected();
    await handleAppointmentCreated(updatedAppointment);
  };

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-3 md:space-y-6">
          <div className="mb-3 md:mb-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">Appointments</h2>
                <p className="text-xs md:text-base text-gray-600 dark:text-gray-400 mt-0.5">Manage and schedule appointments</p>
              </div>
            </div>
            
            <AppointmentSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              showFilterMenu={showFilterMenu}
              onFilterMenuToggle={() => setShowFilterMenu(!showFilterMenu)}
              onAddClick={handleAddClick}
              filterMenuRef={filterMenuRef}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-2 md:p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-3 md:mb-6">
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
              <MessageSquare className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600 dark:text-gray-400" />
              <span className="text-[10px] md:text-xs text-gray-700 dark:text-gray-300">WhatsApp Reminders</span>
            </div>
            <ToggleSwitch
              enabled={whatsappReminders}
              onChange={setWhatsappReminders}
              label="WhatsApp Reminders"
              size="sm"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">
                  Appointments for {format(today, 'MMMM d, yyyy')}
                </h3>
                <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} {statusFilter !== 'all' ? `(${statusFilter})` : ''}
                </p>
              </div>
            </div>

            <AppointmentList
              appointments={filteredAppointments}
              loading={loading}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              onEdit={handleEditClick}
              onDelete={handleDeleteAppointment}
              onAddClick={handleAddClick}
            />
          </div>

          {/* Pending Appointments Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-3 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-4 md:mb-6">
            <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
              Pending Appointments
            </h3>
            <UpcomingAppointmentsList
              upcomingAppointments={upcomingAppointments}
              onEdit={handleEditClick}
              onReschedule={handleRescheduleClick}
              onDelete={handleDeleteAppointment}
            />
          </div>

          {showAddModal && (
            <AppointmentModal
              appointment={selectedAppointment}
              selectedDate={selectedDate}
              onClose={() => {
                setShowAddModal(false);
                clearSelected();
              }}
              onSuccess={handleAppointmentCreatedWithModal}
            />
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
}
