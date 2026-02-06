'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { CalendarPlus, UserPlus, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { addPatientToFormCache } from '@/components/modals/AppointmentModal';
import { addPatientToPatientsCache } from '@/app/crm/hooks/usePatients';
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
  const [appointmentActivity, setAppointmentActivity] = useState<any>(null);
  const [appointmentActivityLoading, setAppointmentActivityLoading] = useState(false);

  // Handle client-side mounting to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate appointment status counts from daily report data (use data from useDashboardStats hook to avoid duplicate API calls)
  useEffect(() => {
    if (!isMounted || !dailyReport) return;
    
    try {
      setAppointmentActivityLoading(true);
      
      // Use daily report data from useDashboardStats hook (already fetched, no duplicate API call)
      const confirmed = (dailyReport as any)?.confirmedAppointments || (dailyReport as any)?.confirmed_appointments || 0;
      const completed = (dailyReport as any)?.completedAppointments || (dailyReport as any)?.completed_appointments || 0;
      const cancelled = (dailyReport as any)?.cancelledAppointments || (dailyReport as any)?.cancelled_appointments || 0;
      const pending = (dailyReport as any)?.pendingAppointments || (dailyReport as any)?.pending_appointments || 0;
      const total = (dailyReport as any)?.totalAppointments || (dailyReport as any)?.total_appointments || 0;
      
      setAppointmentActivity({
        total,
        confirmed: {
          count: confirmed,
          percentage: total > 0 ? Math.round((confirmed / total) * 100) : 0,
        },
        completed: {
          count: completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
        cancelled: {
          count: cancelled,
          percentage: total > 0 ? Math.round((cancelled / total) * 100) : 0,
        },
        pending: {
          count: pending,
          percentage: total > 0 ? Math.round((pending / total) * 100) : 0,
        },
      });
    } catch (error) {
      console.error('Failed to calculate appointment activity:', error);
      // Set default values on error
      setAppointmentActivity({
        total: 0,
        confirmed: { count: 0, percentage: 0 },
        completed: { count: 0, percentage: 0 },
        cancelled: { count: 0, percentage: 0 },
        pending: { count: 0, percentage: 0 },
      });
    } finally {
      setAppointmentActivityLoading(false);
    }
  }, [isMounted, dailyReport]); // Recalculate when dailyReport changes

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
    // Add new patient to caches so it appears immediately in appointment dropdown and CRM list
    const id = createdPatient?.id ?? (createdPatient as any)?.customer_id;
    if (id != null && id !== '') {
      const normalized = { ...createdPatient, id: String(id) };
      addPatientToFormCache(normalized);
      addPatientToPatientsCache(normalized);
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
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Here&apos;s what&apos;s happening today
              </p>
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

          <div className="w-full">
            <div className="mb-2 md:mb-3">
              <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">Appointment overview</h3>
            </div>
            {appointmentActivityLoading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : appointmentActivity ? (
              <ActivityChart data={appointmentActivity} />
            ) : (
              <div className="h-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>

          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Upcoming Appointment</h3>
              <button
                onClick={() => router.push('/appointments')}
                className="text-xs md:text-sm text-primary hover:text-primary-dark font-medium"
              >
                View All
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
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
                'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
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
