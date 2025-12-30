'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, MessageSquare } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import AppointmentModal from '@/components/modals/AppointmentModal';
import FollowUpConfirmationModal from './components/FollowUpConfirmationModal';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ToggleSwitch from '@/components/ui/toggle-switch';
import { Appointment, CreateAppointmentRequest } from '@/types';
import { useAppointments } from './hooks/useAppointments';
import { usePatientEnrichment } from './hooks/usePatientEnrichment';
import { useAppointmentFilters } from './hooks/useAppointmentFilters';
import { useUpcomingAppointments } from './hooks/useUpcomingAppointments';
import { useAppointmentEdit } from './hooks/useAppointmentEdit';
import CalendarView from './components/CalendarView';
import AppointmentSearchBar from './components/AppointmentSearchBar';
import AppointmentList from './components/AppointmentList';
import UpcomingAppointmentsList from './components/UpcomingAppointmentsList';
import { crmPatientService } from '@/lib/services/crmPatientService';
import { crmAppointmentService } from '@/lib/services/appointmentService';
import toast from 'react-hot-toast';
import { invalidatePatientsCache } from '@/app/crm/hooks/usePatients';

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [whatsappReminders, setWhatsappReminders] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedFollowUpAppointment, setSelectedFollowUpAppointment] = useState<Appointment | null>(null);
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

  // Get today's date for comparison
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Filter appointments to show appointments for the selected date (not just today)
  const selectedDateAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
      return isSameDay(aptDate, selectedDate);
    });
  }, [appointments, selectedDate]);

  // Keep all appointments (including completed) - they will show with "completed" status
  // Use filter hook for selected date appointments (including completed)
  const filteredAppointments = useAppointmentFilters(selectedDateAppointments, searchTerm, statusFilter);

  // Use upcoming appointments hook - shows appointments for dates other than selected date
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
    // Always pass the appointment data to ensure it's added to the list
    await handleAppointmentCreated(updatedAppointment);
  };

  const handleFollowUpClick = (appointment: Appointment) => {
    setSelectedFollowUpAppointment(appointment);
    setShowFollowUpModal(true);
  };

  const handleFollowUpYes = async () => {
    if (!selectedFollowUpAppointment) return;

    try {
      const patient = typeof selectedFollowUpAppointment.patient === 'object' 
        ? selectedFollowUpAppointment.patient 
        : null;
      
      if (!patient || !patient.id) {
        toast.error('Patient information not available');
        setShowFollowUpModal(false);
        setSelectedFollowUpAppointment(null);
        return;
      }

      // Update customer status to FollowUp using PATCH method
      // API: PATCH /customers/{id} with body: { status: "FollowUp" }
      const { crmApi } = await import('@/lib/services/crmApi');
      await crmApi.patchCustomer(patient.id, { status: 'FollowUp' });
      
      // Update appointment status to completed using PUT method
      // API: PUT /appointments/{id} - requires full body, but only status will change
      // Convert appointment to CreateAppointmentRequest format
      const patientId = typeof selectedFollowUpAppointment.patient === 'object' 
        ? selectedFollowUpAppointment.patient.id 
        : selectedFollowUpAppointment.patient;
      const doctorId = typeof selectedFollowUpAppointment.doctor === 'object' 
        ? selectedFollowUpAppointment.doctor.id 
        : selectedFollowUpAppointment.doctor;
      
      const appointmentDate = selectedFollowUpAppointment.date instanceof Date 
        ? selectedFollowUpAppointment.date 
        : new Date(selectedFollowUpAppointment.date);
      const dateStr = format(appointmentDate, 'yyyy-MM-dd');
      
      const fullAppointmentData: Partial<CreateAppointmentRequest> = {
        patient: patientId,
        doctor: doctorId || '',
        date: dateStr,
        time: selectedFollowUpAppointment.time,
        status: 'completed', // Only change the status, all other fields remain the same
        type: selectedFollowUpAppointment.type,
        notes: selectedFollowUpAppointment.notes,
        reason: selectedFollowUpAppointment.reason,
      };
      await crmAppointmentService.updateAppointment(selectedFollowUpAppointment.id, fullAppointmentData);
      
      // Invalidate patients cache so CRM page shows updated status
      invalidatePatientsCache();
      
      toast.success('Patient marked for follow-up and appointment completed');
      setShowFollowUpModal(false);
      setSelectedFollowUpAppointment(null);
      
      // Refresh appointments to reflect any changes
      await handleAppointmentCreated();
    } catch (error: any) {
      console.error('Error updating patient status:', error);
      toast.error(error.response?.data?.message || 'Failed to update patient status');
    }
  };

  const handleFollowUpNo = async () => {
    if (!selectedFollowUpAppointment) return;

    try {
      const patient = typeof selectedFollowUpAppointment.patient === 'object' 
        ? selectedFollowUpAppointment.patient 
        : null;
      
      if (!patient || !patient.id) {
        toast.error('Patient information not available');
        setShowFollowUpModal(false);
        setSelectedFollowUpAppointment(null);
        return;
      }

      // Update customer status to Active using PATCH method
      // API: PATCH /customers/{id} with body: { status: "Active" }
      const { crmApi } = await import('@/lib/services/crmApi');
      await crmApi.patchCustomer(patient.id, { status: 'Active' });
      
      // Update appointment status to completed using PUT method
      // API: PUT /appointments/{id} - requires full body, but only status will change
      // Convert appointment to CreateAppointmentRequest format
      const patientId = typeof selectedFollowUpAppointment.patient === 'object' 
        ? selectedFollowUpAppointment.patient.id 
        : selectedFollowUpAppointment.patient;
      const doctorId = typeof selectedFollowUpAppointment.doctor === 'object' 
        ? selectedFollowUpAppointment.doctor.id 
        : selectedFollowUpAppointment.doctor;
      
      const appointmentDate = selectedFollowUpAppointment.date instanceof Date 
        ? selectedFollowUpAppointment.date 
        : new Date(selectedFollowUpAppointment.date);
      const dateStr = format(appointmentDate, 'yyyy-MM-dd');
      
      const fullAppointmentData: Partial<CreateAppointmentRequest> = {
        patient: patientId,
        doctor: doctorId || '',
        date: dateStr,
        time: selectedFollowUpAppointment.time,
        status: 'completed', // Only change the status, all other fields remain the same
        type: selectedFollowUpAppointment.type,
        notes: selectedFollowUpAppointment.notes,
        reason: selectedFollowUpAppointment.reason,
      };
      await crmAppointmentService.updateAppointment(selectedFollowUpAppointment.id, fullAppointmentData);
      
      // Invalidate patients cache so CRM page shows updated status
      invalidatePatientsCache();
      
      toast.success('Patient status updated to Active and appointment completed');
      setShowFollowUpModal(false);
      setSelectedFollowUpAppointment(null);
      
      // Refresh appointments to reflect any changes
      await handleAppointmentCreated();
    } catch (error: any) {
      console.error('Error updating patient status:', error);
      toast.error(error.response?.data?.message || 'Failed to update patient status');
    }
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
                  Appointments for {format(selectedDate, 'MMMM d, yyyy')}
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
              onFollowUp={handleFollowUpClick}
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

          {showFollowUpModal && selectedFollowUpAppointment && (
            <FollowUpConfirmationModal
              patientName={
                typeof selectedFollowUpAppointment.patient === 'object' 
                  ? selectedFollowUpAppointment.patient?.name || 'Unknown'
                  : 'Unknown'
              }
              onYes={handleFollowUpYes}
              onNo={handleFollowUpNo}
              onClose={() => {
                setShowFollowUpModal(false);
                setSelectedFollowUpAppointment(null);
              }}
            />
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
}
