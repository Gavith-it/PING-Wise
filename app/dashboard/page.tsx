'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChevronRight, CalendarPlus, UserPlus, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { cn } from '@/lib/utils';
import { useDashboardStats } from './hooks/useDashboardStats';
import { useTodayAppointments } from './hooks/useTodayAppointments';
import { useWalletBalance } from './hooks/useWalletBalance';
import KPICards from './components/KPICards';
import TodayAppointmentsList from './components/TodayAppointmentsList';
import { loadPreloadFunction } from './utils/preloadUtils';

// Lazy load heavy components
const ActivityChart = dynamic(() => import('@/components/charts/ActivityChart'), {
  loading: () => <div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>,
  ssr: false
});

const AppointmentModal = dynamic(() => import('@/components/modals/AppointmentModal').then(mod => ({ default: mod.default })), {
  loading: () => null,
  ssr: false
});

const CRMPatientModal = dynamic(() => import('@/components/modals/CRMPatientModal'), {
  loading: () => null,
  ssr: false
});

const FloatingButton = dynamic(() => import('@/components/ui/floating-button').then(mod => ({ default: mod.FloatingButton })), {
  loading: () => null,
  ssr: false
});

const FloatingButtonItem = dynamic(() => import('@/components/ui/floating-button').then(mod => ({ default: mod.FloatingButtonItem })), {
  loading: () => null,
  ssr: false
});

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, token } = useAuth();
  const { addNotification } = useNotifications();
  
  const [isMounted, setIsMounted] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  
  const {
    stats,
    activity,
    dailyReport,
    loading: statsLoading,
    dataLoaded: statsDataLoaded,
    loadDashboardData,
  } = useDashboardStats();

  const {
    appointments: todayAppointments,
    loading: appointmentsLoading,
    dataLoaded: appointmentsDataLoaded,
    loadAppointments,
  } = useTodayAppointments();

  const walletBalance = useWalletBalance();

  // Handle client-side mounting to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (!isMounted) {
      return;
    }
    
    // Trust login state - if we have token and user, we're authenticated
    const hasToken = typeof window !== 'undefined' && sessionStorage.getItem('token');
    const isAuthenticatedNow = (token && user) || (hasToken && user);
    const shouldLoad = isAuthenticatedNow || (!authLoading && isAuthenticated && user);
    
    if (shouldLoad) {
      // Preload patients and doctors data for appointment modal (in background)
      loadPreloadFunction();
    }
  }, [isMounted, authLoading, isAuthenticated, user, token]);

  const handleAppointmentSuccess = useCallback(async (createdAppointment?: any) => {
    setShowAppointmentModal(false);
    addNotification({
      type: 'appointment',
      title: 'New Appointment Scheduled',
      message: 'A new appointment has been successfully scheduled.',
    });
    
    // Invalidate appointments cache so appointments page shows the new appointment
    if (typeof window !== 'undefined') {
      try {
        const { invalidateAppointmentsCache } = await import('@/app/appointments/hooks/useAppointments');
        if (invalidateAppointmentsCache) {
          invalidateAppointmentsCache();
        }
      } catch (error) {
        console.error('Error invalidating appointments cache:', error);
      }
    }
    
    loadDashboardData();
    loadAppointments();
  }, [addNotification, loadDashboardData, loadAppointments]);

  const handlePatientSuccess = useCallback((createdPatient?: any) => {
    setShowPatientModal(false);
    addNotification({
      type: 'patient',
      title: 'New Patient Registered',
      message: 'A new patient has been successfully added to the system.',
    });
    
    // Invalidate CRM cache so the new patient appears in CRM page immediately
    if (typeof window !== 'undefined') {
      // Import and call invalidatePatientsCache to refresh CRM page cache
      import('@/app/crm/hooks/usePatients').then((module) => {
        if (module.invalidatePatientsCache) {
          module.invalidatePatientsCache();
        }
      });
    }
    
    loadDashboardData();
    loadAppointments();
  }, [addNotification, loadDashboardData, loadAppointments]);

  // Memoize loading states
  const dataLoading = statsLoading || appointmentsLoading;
  const dataLoaded = statsDataLoaded && appointmentsDataLoaded;

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-4 md:space-y-6">
          <div className="mb-3 md:mb-4">
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
                Welcome back, {user?.name || 'Doctor'}! 👋
              </h2>
            </div>
          </div>

          {/* Show KPI cards - use cached data or show skeleton if loading */}
          {stats ? (
            <KPICards stats={stats} dailyReport={dailyReport} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl px-4 py-3 md:px-6 md:py-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => router.push('/reports')}
            className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl px-4 py-3 md:px-6 md:py-4 shadow-sm border border-gray-100 dark:border-gray-700 card-hover w-full text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">Patient Activity</h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">Distribution overview</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
            {activity ? <ActivityChart data={activity} /> : (
              <div className="h-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </button>

          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Today&apos;s Appointments</h3>
              <button
                onClick={() => router.push('/appointments')}
                className="text-xs md:text-sm text-primary hover:text-primary-dark font-medium"
              >
                View All
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden max-h-[400px] overflow-y-auto">
              <TodayAppointmentsList
                appointments={todayAppointments}
                loading={appointmentsLoading}
                dataLoaded={appointmentsDataLoaded}
              />
            </div>
          </div>
        </div>

        {/* Floating Action Button - Draggable */}
        <FloatingButton
          className="fixed bottom-14 right-4 md:bottom-6 md:right-6 z-50"
          draggable={true}
          storageKey="dashboard-floating-button-position"
          triggerContent={
            <button className="flex items-center justify-center h-11 w-11 md:h-12 md:w-12 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-shadow z-10">
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          }>
          <FloatingButtonItem key="add-patient">
            <button
              onClick={() => setShowPatientModal(true)}
              className={cn(
                'h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition-shadow',
                'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
              )}
              title="Add Patient">
              <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </FloatingButtonItem>
          <FloatingButtonItem key="schedule-appointment">
            <button
              onClick={() => setShowAppointmentModal(true)}
              className={cn(
                'h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition-shadow',
                'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
              )}
              title="Schedule Appointment">
              <CalendarPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </FloatingButtonItem>
        </FloatingButton>

        {/* Modals */}
        {showAppointmentModal && (
          <AppointmentModal
            onClose={() => setShowAppointmentModal(false)}
            onSuccess={handleAppointmentSuccess}
          />
        )}

        {showPatientModal && (
          <CRMPatientModal
            onClose={() => setShowPatientModal(false)}
            onSuccess={handlePatientSuccess}
          />
        )}
      </Layout>
    </PrivateRoute>
  );
}
