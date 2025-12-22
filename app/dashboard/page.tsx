'use client';

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
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
import { reportsApi, DailyReport } from '@/lib/services/reportsApi';
import { crmAppointmentService } from '@/lib/services/appointmentService';
import { crmPatientService } from '@/lib/services/crmPatientService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Patient } from '@/types';
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
  dailyReport: DailyReport | null;
  timestamp: number;
} = {
  stats: null,
  activity: null,
  todayAppointments: [],
  dailyReport: null,
  timestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, token } = useAuth();
  const { addNotification } = useNotifications();
  
  // Initialize state consistently for SSR (always start with null/empty to avoid hydration mismatch)
  const [stats, setStats] = useState<any>(null);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [activity, setActivity] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  // Start with false loading - show page immediately, load data in background
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true); // Start with true, will be set to false after hydration
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded at least once
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false); // Track if component is mounted (client-side only)
  
  // Prevent duplicate API calls
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const isLoadingPatientsRef = useRef(false);
  
  // Handle client-side mounting to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    
    // After mounting, check cache and initialize state from cache if available
    const cacheAge = Date.now() - dashboardCache.timestamp;
    const isCacheValid = dashboardCache.dailyReport && cacheAge < CACHE_DURATION;
    
    if (isCacheValid) {
      // Use cached data immediately for instant display
      const cachedReport = dashboardCache.dailyReport as DailyReport;
      setDailyReport(cachedReport);
      setStats(dashboardCache.stats);
      
      // Recalculate activity from cached dailyReport to ensure consistency
      const totalCustomers = cachedReport?.totalCustomers || cachedReport?.total_customers || 0;
      const activeCustomers = cachedReport?.activeCustomers || cachedReport?.active_customers || 0;
      const bookedCustomers = cachedReport?.bookedCustomers || cachedReport?.booked_customers || 0;
      const followupCustomers = cachedReport?.followupCustomers || cachedReport?.followup_customers || 0;
      
      const cachedActivity = {
        total: totalCustomers,
        active: {
          count: activeCustomers,
          percentage: totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0
        },
        booked: {
          count: bookedCustomers,
          percentage: totalCustomers > 0 ? Math.round((bookedCustomers / totalCustomers) * 100) : 0
        },
        followUp: {
          count: followupCustomers,
          percentage: totalCustomers > 0 ? Math.round((followupCustomers / totalCustomers) * 100) : 0
        }
      };
      
      setActivity(cachedActivity);
      setTodayAppointments(dashboardCache.todayAppointments);
      setDataLoading(false);
      setDataLoaded(true);
    } else {
      setDataLoading(false);
    }
  }, []);

  const loadDashboardData = useCallback(async (showLoadingSpinner = false) => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return; // Already loading, skip duplicate call
    }
    
    try {
      isLoadingRef.current = true;
      
      // Only show spinner if explicitly requested (for refresh actions)
      // Don't block UI on initial load
      if (showLoadingSpinner) {
        setDataLoading(true);
      }
      
      // Get today's date in yyyy-MM-dd format for filtering
      const todayDateStr = format(new Date(), 'yyyy-MM-dd');
      
      // Fetch dailyReport FIRST (real data) - this is the primary source for KPIs
      const dailyReportData = await reportsApi.getDailyReport().catch((error) => {
        console.warn('Failed to load daily report (non-critical):', error);
        return {};
      });
      
      // Then fetch other data in parallel (no need for activity API - use dailyReport data)
      const [statsData, appointmentsData] = await Promise.all([
        dashboardService.getStats(),
        // Use real backend appointments API instead of mock data
        crmAppointmentService.getAppointments({ date: todayDateStr }).catch((error) => {
          console.warn('Failed to load today appointments (non-critical):', error);
          return { success: true, data: [] };
        }),
      ]);

      const newStats = statsData.data;
      
      // Map dailyReport data to activity chart format (real backend data)
      // Type guard to ensure dailyReportData is DailyReport
      const report = dailyReportData as DailyReport;
      const totalCustomers = report?.totalCustomers || report?.total_customers || 0;
      const activeCustomers = report?.activeCustomers || report?.active_customers || 0;
      const bookedCustomers = report?.bookedCustomers || report?.booked_customers || 0;
      const followupCustomers = report?.followupCustomers || report?.followup_customers || 0;
      
      // Calculate activity data from real backend data
      const newActivity = {
        total: totalCustomers,
        active: {
          count: activeCustomers,
          percentage: totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0
        },
        booked: {
          count: bookedCustomers,
          percentage: totalCustomers > 0 ? Math.round((bookedCustomers / totalCustomers) * 100) : 0
        },
        followUp: {
          count: followupCustomers,
          percentage: totalCustomers > 0 ? Math.round((followupCustomers / totalCustomers) * 100) : 0
        }
      };
      // Filter appointments for today only (backend may return appointments for the date)
      let allAppointments = appointmentsData.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Filter appointments that are scheduled for today
      let filteredAppointments = allAppointments.filter((apt: Appointment) => {
        const aptDate = apt.date instanceof Date ? apt.date : new Date(apt.date);
        return aptDate >= today && aptDate < tomorrow;
      });
      
      // Enrich appointments with patient data (so patient names show correctly)
      if (filteredAppointments.length > 0 && !isLoadingPatientsRef.current) {
        try {
          isLoadingPatientsRef.current = true;
          
          // Get all unique patient IDs from appointments
          const patientIds = filteredAppointments
            .map(apt => {
              if (typeof apt.patient === 'string') return apt.patient;
              if (typeof apt.patient === 'object' && apt.patient?.id) return apt.patient.id;
              return null;
            })
            .filter((id): id is string => id !== null);
          
          if (patientIds.length > 0) {
            // Fetch patient data (only once, prevent duplicate calls)
            const patientsResponse = await crmPatientService.getPatients({ limit: 100 });
            const patients: Patient[] = patientsResponse.data || [];
            
            // Create a map of patient ID to patient object
            const patientMap = new Map<string, Patient>();
            patients.forEach(patient => {
              if (patient.id) {
                patientMap.set(patient.id, patient);
              }
            });
            
            // Enrich appointments with patient data
            filteredAppointments = filteredAppointments.map(apt => {
              const patientId = typeof apt.patient === 'string' ? apt.patient : apt.patient?.id;
              if (patientId && patientMap.has(patientId)) {
                return { ...apt, patient: patientMap.get(patientId)! };
              }
              return apt;
            });
          }
          
          isLoadingPatientsRef.current = false;
        } catch (error) {
          console.warn('Failed to enrich appointments with patient data (non-critical):', error);
          isLoadingPatientsRef.current = false;
          // Continue without enrichment - appointments will still show but without patient names
        }
      }
      
      const newAppointments = filteredAppointments;
      const newDailyReport = dailyReportData || {};

      // Update cache (store dailyReport for instant display on next visit)
      dashboardCache.stats = newStats;
      dashboardCache.activity = newActivity;
      dashboardCache.todayAppointments = newAppointments;
      dashboardCache.dailyReport = newDailyReport; // Store dailyReport in cache
      dashboardCache.timestamp = Date.now();

      // Update state - this will trigger re-render with real data
      // IMPORTANT: Update dailyReport FIRST so KPIs show real data immediately
      setDailyReport(newDailyReport);
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
      isLoadingRef.current = false; // Reset loading flag
      if (showLoadingSpinner) {
        setDataLoading(false);
      } else {
        // If not showing spinner, still mark loading as false after data arrives
        setDataLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Only run on client-side after mounting to avoid hydration issues
    if (!isMounted) {
      return;
    }
    
    // Prevent duplicate calls (React Strict Mode can trigger useEffect twice)
    if (hasLoadedRef.current) {
      return; // Already loaded, skip duplicate call
    }
    
    // Trust login state - if we have token and user, we're authenticated
    // Don't wait for authLoading if we just logged in (token exists = authenticated)
    // This allows instant dashboard display after login
    const hasToken = typeof window !== 'undefined' && sessionStorage.getItem('token');
    const isAuthenticatedNow = (token && user) || (hasToken && user);
    const shouldLoad = isAuthenticatedNow || (!authLoading && isAuthenticated && user);
    
    if (shouldLoad) {
      hasLoadedRef.current = true; // Mark as loaded to prevent duplicate calls
      
      const cacheAge = Date.now() - dashboardCache.timestamp;
      // Check cache validity using dailyReport (primary source for real data)
      const isCacheValid = dashboardCache.dailyReport && cacheAge < CACHE_DURATION;
      
      // If we have valid cached data, use it immediately (instant display)
      if (isCacheValid) {
        // Use cached dailyReport FIRST (real data) for instant display
        const cachedReport = dashboardCache.dailyReport as DailyReport;
        setDailyReport(cachedReport);
        setStats(dashboardCache.stats);
        
        // Recalculate activity from cached dailyReport to ensure consistency
        const totalCustomers = cachedReport?.totalCustomers || cachedReport?.total_customers || 0;
        const activeCustomers = cachedReport?.activeCustomers || cachedReport?.active_customers || 0;
        const bookedCustomers = cachedReport?.bookedCustomers || cachedReport?.booked_customers || 0;
        const followupCustomers = cachedReport?.followupCustomers || cachedReport?.followup_customers || 0;
        
        const cachedActivity = {
          total: totalCustomers,
          active: {
            count: activeCustomers,
            percentage: totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0
          },
          booked: {
            count: bookedCustomers,
            percentage: totalCustomers > 0 ? Math.round((bookedCustomers / totalCustomers) * 100) : 0
          },
          followUp: {
            count: followupCustomers,
            percentage: totalCustomers > 0 ? Math.round((followupCustomers / totalCustomers) * 100) : 0
          }
        };
        
        setActivity(cachedActivity);
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
  }, [isMounted, authLoading, isAuthenticated, user, token, loadDashboardData]);

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
  // Use real data from dailyReport API when available, fallback to stats
  const kpiCards = useMemo(() => {
    // Map daily report data to KPI values (use real backend data)
    const totalBookings = dailyReport?.totalAppointments || dailyReport?.total_appointments || stats?.totalBookings?.value || 0;
    const totalPatients = dailyReport?.totalCustomers || dailyReport?.total_patients || stats?.totalPatients?.value || 0;
    const followUps = dailyReport?.followupCustomers || dailyReport?.followup_customers || stats?.followUps?.value || 0;
    
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <KPICard
          icon={CalendarCheck}
          value={totalBookings}
          label="Total Bookings"
          change={undefined}
          trend={undefined}
        />
        <KPICard
          icon={Users}
          value={totalPatients}
          label="Total Patients"
          change={undefined}
          trend={undefined}
        />
        <KPICard
          icon={Clock}
          value={followUps}
          label="Follow-ups"
          change={undefined}
          trend={undefined}
        />
        <KPICard
          icon={RupeeIcon}
          value={0}
          label="Revenue"
          change={undefined}
          trend={undefined}
          isCurrency={true}
          isComingSoon={true}
        />
      </div>
    );
  }, [stats, dailyReport]);

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

