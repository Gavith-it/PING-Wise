'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { CalendarCheck, Users, Clock, CalendarPlus, UserPlus, Plus, ChevronRight, DollarSign } from 'lucide-react';

// Custom Rupee Icon Component to replace DollarSign
const RupeeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <text
      x="12"
      y="18"
      textAnchor="middle"
      fontSize="20"
      fontWeight="bold"
      fill="currentColor"
      fontFamily="Arial, sans-serif"
    >
      ₹
    </text>
  </svg>
);
import { dashboardService, patientService, teamService, walletService } from '@/lib/services/api';
import { useAuth } from '@/contexts/AuthContext';
import CountUp from 'react-countup';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { useNotifications } from '@/contexts/NotificationContext';
import { Appointment } from '@/types';
import { cn } from '@/lib/utils';

// Lazy load heavy components
const ActivityChart = dynamic(() => import('@/components/charts/ActivityChart'), {
  loading: () => <div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>,
  ssr: false
});

const AppointmentModal = dynamic(() => import('@/components/modals/AppointmentModal').then(mod => ({ default: mod.default })), {
  loading: () => null,
  ssr: false
});

const PatientModal = dynamic(() => import('@/components/modals/PatientModal'), {
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

// Preload function helper
const loadPreloadFunction = async () => {
  try {
    const mod = await import('@/components/modals/AppointmentModal');
    if (mod.preloadFormData) {
      await mod.preloadFormData();
    }
  } catch (error) {
    // Silently fail - preloading is optional
  }
};

interface KPICardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  change?: number;
  trend?: 'up' | 'down';
  isCurrency?: boolean;
  isComingSoon?: boolean;
}

const KPICard = memo(function KPICard({ icon: Icon, value, label, change, trend, isCurrency, isComingSoon }: KPICardProps) {
  const isPositive = trend === 'up';
  const changeColor = isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
  const changeSymbol = isPositive ? '+' : '';
  const trendIcon = isPositive ? '↑' : '↓';

  const { numericValue, prefix, suffix } = useMemo(() => {
    let numValue = 0;
    let pre = '';
    let suf = '';
    
    if (isCurrency && !isComingSoon) {
      numValue = typeof value === 'number' ? value / 1000 : parseFloat(String(value)) / 1000 || 0;
      pre = '₹';
      suf = 'K';
    } else if (!isComingSoon) {
      numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    }
    
    return { numericValue: numValue, prefix: pre, suffix: suf };
  }, [value, isCurrency, isComingSoon]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-2 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-1.5 md:mb-4">
        <div className="w-8 h-8 md:w-14 md:h-14 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg md:rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 md:w-7 md:h-7 text-primary" />
        </div>
        {change !== undefined && !isComingSoon && (
          <div className={`flex items-center space-x-1 text-[9px] md:text-xs font-semibold px-1 md:px-2.5 py-0.5 md:py-1 rounded-full ${changeColor}`}>
            <span>{trendIcon}</span>
            <span>{changeSymbol}{change}%</span>
          </div>
        )}
      </div>
      <div className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-2">
        {isComingSoon ? (
          <span className="text-sm md:text-lg text-gray-500 dark:text-gray-400 font-medium">Coming Soon</span>
        ) : isCurrency ? (
          <>
            {prefix}
            <CountUp
              start={0}
              end={numericValue}
              decimals={1}
              duration={2.5}
              separator=","
              delay={0.2}
            />
            {suffix}
          </>
        ) : (
          <CountUp
            start={0}
            end={numericValue}
            duration={2.5}
            separator=","
            delay={0.2}
          />
        )}
      </div>
      <p className="text-[10px] md:text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</p>
    </div>
  );
});

const AppointmentCard = memo(function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const patient = typeof appointment.patient === 'object' ? appointment.patient : null;
  const doctor = typeof appointment.doctor === 'object' ? appointment.doctor : null;
  
  const statusColor = useMemo(() => {
    switch (appointment.status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }, [appointment.status]);

  return (
    <div className="w-full p-3 md:p-4 flex items-center justify-between text-left">
      <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
        <div className={`w-8 h-8 md:w-10 md:h-10 ${patient?.avatarColor || 'bg-primary'} rounded-full flex items-center justify-center text-white text-xs md:text-sm font-medium flex-shrink-0`}>
          {patient?.initials || 'P'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm md:text-base text-gray-900 dark:text-white truncate">{patient?.name || 'Unknown'}</p>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
            {appointment.time} • {doctor?.name || 'Doctor'} • {appointment.type || 'Consultation'}
          </p>
        </div>
      </div>
      <span className={`text-[10px] md:text-xs font-medium px-2 md:px-3 py-0.5 md:py-1 rounded-full border ${statusColor} flex-shrink-0 ml-2`}>
        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
      </span>
    </div>
  );
});


// Cache for dashboard data to enable instant navigation
const dashboardCache: {
  stats: any;
  activity: any;
  todayAppointments: Appointment[];
  timestamp: number;
} = {
  stats: null,
  activity: null,
  todayAppointments: [],
  timestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, token } = useAuth();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState<any>(dashboardCache.stats);
  const [activity, setActivity] = useState<any>(dashboardCache.activity);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>(dashboardCache.todayAppointments);
  // Start with false loading - show page immediately, load data in background
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(!dashboardCache.stats); // Track if data is loading
  const [dataLoaded, setDataLoaded] = useState(!!dashboardCache.stats); // Track if data has been loaded at least once
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const loadDashboardData = useCallback(async (showLoadingSpinner = false) => {
    try {
      // Only show spinner if explicitly requested (for refresh actions)
      // Don't block UI on initial load
      if (showLoadingSpinner) {
        setDataLoading(true);
      }
      
      const [statsData, activityData, appointmentsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getActivity(),
        dashboardService.getTodayAppointments(),
      ]);

      const newStats = statsData.data;
      const newActivity = activityData.data;
      const newAppointments = appointmentsData.data || [];

      // Update cache
      dashboardCache.stats = newStats;
      dashboardCache.activity = newActivity;
      dashboardCache.todayAppointments = newAppointments;
      dashboardCache.timestamp = Date.now();

      // Update state - this will trigger re-render with real data
      setStats(newStats);
      setActivity(newActivity);
      setTodayAppointments(newAppointments);
      // Mark data as loaded (even if empty) so we show proper empty state
      setDataLoaded(true);
    } catch (error: any) {
      // Handle 401 errors silently - PrivateRoute will redirect
      if (error?.response?.status !== 401) {
        toast.error('Failed to load dashboard data');
        if (process.env.NODE_ENV === 'development') {
          console.error('Dashboard load error:', error);
        }
      }
      // Mark as loaded even on error so we don't show loading forever
      setDataLoaded(true);
    } finally {
      if (showLoadingSpinner) {
        setDataLoading(false);
      } else {
        // If not showing spinner, still mark loading as false after data arrives
        setDataLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Trust login state - if we have token and user, we're authenticated
    // Don't wait for authLoading if we just logged in (token exists = authenticated)
    // This allows instant dashboard display after login
    const hasToken = typeof window !== 'undefined' && sessionStorage.getItem('token');
    const isAuthenticatedNow = (token && user) || (hasToken && user);
    const shouldLoad = isAuthenticatedNow || (!authLoading && isAuthenticated && user);
    
    if (shouldLoad) {
      const cacheAge = Date.now() - dashboardCache.timestamp;
      const isCacheValid = dashboardCache.stats && cacheAge < CACHE_DURATION;
      
      // If we have valid cached data, use it immediately (instant display)
      if (isCacheValid) {
        setStats(dashboardCache.stats);
        setActivity(dashboardCache.activity);
        setTodayAppointments(dashboardCache.todayAppointments);
        setDataLoading(false);
        setDataLoaded(true); // Mark as loaded since we have cached data
        // Refresh in background without blocking UI
        loadDashboardData(false);
      } else {
        // No cache or expired - load in background without blocking UI
        // Show page structure immediately with skeleton, fill data as it arrives
        setDataLoading(true);
        setDataLoaded(false); // Not loaded yet
        loadDashboardData(false); // Don't show spinner, just load data in background
      }
      
      // Preload patients and doctors data for appointment modal (in background)
      loadPreloadFunction();
    }
  }, [authLoading, isAuthenticated, user, token, loadDashboardData]);

  // Fetch wallet balance only on Dashboard page
  useEffect(() => {
    const fetchWalletBalance = async () => {
      // Wait for user to be authenticated
      if (!user || !isAuthenticated) {
        return;
      }
      
      // Check if token exists in sessionStorage before making request
      if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('token');
        if (!token) {
          return;
        }
      }
      
      try {
        // Try to fetch from API, fallback to user object or default
        try {
          const response = await walletService.getBalance();
          setWalletBalance(response.data?.balance || 0);
        } catch (apiError: any) {
          // Silently handle auth errors (401) - user might not be fully authenticated yet
          // If API endpoint doesn't exist yet (404), silently use default
          const status = apiError?.response?.status;
          if (status === 401 || status === 404) {
            // Silent fail for auth errors and missing endpoints
            const balance = (user as any)?.walletBalance || 0;
            setWalletBalance(balance);
          } else {
            // Check user object or use default
            const balance = (user as any)?.walletBalance || 0;
            setWalletBalance(balance);
          }
        }
      } catch (error) {
        // Silent fail - wallet balance is optional
        setWalletBalance(0);
      }
    };

    if (!authLoading && isAuthenticated && user) {
      fetchWalletBalance();
    }
  }, [user, isAuthenticated, authLoading]);

  const handleAppointmentSuccess = useCallback(() => {
    setShowAppointmentModal(false);
    addNotification({
      type: 'appointment',
      title: 'New Appointment Scheduled',
      message: 'A new appointment has been successfully scheduled.',
    });
    loadDashboardData();
  }, [addNotification, loadDashboardData]);

  const handlePatientSuccess = useCallback(() => {
    setShowPatientModal(false);
    addNotification({
      type: 'patient',
      title: 'New Patient Registered',
      message: 'A new patient has been successfully added to the system.',
    });
    loadDashboardData();
  }, [addNotification, loadDashboardData]);

  // Memoize KPI cards to prevent unnecessary re-renders
  const kpiCards = useMemo(() => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
      <KPICard
        icon={CalendarCheck}
        value={stats?.totalBookings?.value || 0}
        label="Total Bookings"
        change={stats?.totalBookings?.change || 0}
        trend={stats?.totalBookings?.trend}
      />
      <KPICard
        icon={Users}
        value={stats?.totalPatients?.value || 0}
        label="Total Patients"
        change={stats?.totalPatients?.change || 0}
        trend={stats?.totalPatients?.trend}
      />
      <KPICard
        icon={Clock}
        value={stats?.followUps?.value || 0}
        label="Follow-ups"
        change={stats?.followUps?.change || 0}
        trend={stats?.followUps?.trend}
      />
      <KPICard
        icon={RupeeIcon}
        value={stats?.revenue?.value || 0}
        label="Revenue"
        change={stats?.revenue?.change || 0}
        trend={stats?.revenue?.trend}
        isCurrency={true}
      />
    </div>
  ), [stats]);

  // Memoize appointment cards list
  const appointmentCards = useMemo(() => (
    todayAppointments.map((appointment) => (
      <AppointmentCard
        key={appointment.id}
        appointment={appointment}
      />
    ))
  ), [todayAppointments]);

  // Never show full-page loading spinner - always show page structure
  // This ensures instant display like big apps (optimistic UI)
  // Data will load in background and fill in as it arrives

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
          {stats ? kpiCards : (
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
              {!dataLoaded && dataLoading ? (
                // Show skeleton only while initial data is loading
                <div className="p-4 md:p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : todayAppointments.length > 0 ? (
                // Show appointments if we have any
                <div className="divide-y divide-gray-100">
                  {appointmentCards}
                </div>
              ) : (
                // Show proper empty state once data has loaded (even if empty)
                <div className="p-6 md:p-8 text-center">
                  <CalendarCheck className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-2 md:mb-3" />
                  <p className="text-sm md:text-base text-gray-500 font-medium">No appointments scheduled for today</p>
                </div>
              )}
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
          <PatientModal
            onClose={() => setShowPatientModal(false)}
            onSuccess={handlePatientSuccess}
          />
        )}
      </Layout>
    </PrivateRoute>
  );
}

