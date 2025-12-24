import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { dashboardService } from '@/lib/services/api';
import { reportsApi, DailyReport } from '@/lib/services/reportsApi';
import { crmApi } from '@/lib/services/crmApi';
import { crmCustomersToPatients } from '@/lib/utils/crmAdapter';

// Dashboard cache
const dashboardCache: {
  stats: any;
  activity: any;
  dailyReport: DailyReport | null;
  timestamp: number;
} = {
  stats: null,
  activity: null,
  dailyReport: null,
  timestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface UseDashboardStatsReturn {
  stats: any;
  activity: any;
  dailyReport: DailyReport | null;
  loading: boolean;
  dataLoaded: boolean;
  loadDashboardData: (showLoadingSpinner?: boolean) => Promise<void>;
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const isLoadingRef = useRef(false);

  const loadDashboardData = useCallback(async (showLoadingSpinner = false) => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      
      if (showLoadingSpinner) {
        setLoading(true);
      }
      
      // Fetch dailyReport FIRST (real data) - this is the primary source for KPIs
      const dailyReportData = await reportsApi.getDailyReport().catch((error) => {
        console.warn('Failed to load daily report (non-critical):', error);
        return {};
      });
      
      // Then fetch stats in parallel
      const statsData = await dashboardService.getStats();

      const newStats = statsData.data;
      
      // Fetch patients directly from CRM API to get accurate counts by status
      // This ensures we have the correct data even if daily report doesn't return it
      let totalCustomers = 0;
      let activeCustomers = 0;
      let bookedCustomers = 0;
      let followupCustomers = 0;
      
      try {
        // Fetch all customers directly from CRM API (bypasses pagination)
        const allCrmCustomers = await crmApi.getCustomers();
        const allPatients = crmCustomersToPatients(allCrmCustomers || []);
        
        totalCustomers = allPatients.length;
        
        // Count patients by status
        allPatients.forEach((patient: any) => {
          const status = (patient.status || '').toLowerCase();
          if (status === 'active') {
            activeCustomers++;
          } else if (status === 'booked') {
            bookedCustomers++;
          } else if (status === 'follow-up' || status === 'followup') {
            followupCustomers++;
          }
        });
      } catch (error) {
        console.warn('Failed to fetch patients for activity data, using daily report:', error);
        // Fallback to daily report data if patient fetch fails
        const report = dailyReportData as DailyReport;
        totalCustomers = report?.totalCustomers || report?.total_customers || 0;
        activeCustomers = report?.activeCustomers || report?.active_customers || 0;
        bookedCustomers = report?.bookedCustomers || report?.booked_customers || 0;
        followupCustomers = report?.followupCustomers || report?.followup_customers || 0;
      }
      
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
      
      const newDailyReport = dailyReportData || {};

      // Update cache
      dashboardCache.stats = newStats;
      dashboardCache.activity = newActivity;
      dashboardCache.dailyReport = newDailyReport;
      dashboardCache.timestamp = Date.now();

      // Update state
      setDailyReport(newDailyReport);
      setStats(newStats);
      setActivity(newActivity);
      setDataLoaded(true);
    } catch (error: any) {
      // Handle 401 errors silently - PrivateRoute will redirect
      if (error?.response?.status !== 401) {
        console.error('Failed to load dashboard stats:', error);
      }
      setDataLoaded(true);
    } finally {
      isLoadingRef.current = false;
      if (showLoadingSpinner) {
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Initialize from cache on mount
  useEffect(() => {
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
      setDataLoaded(true);
      
      // Refresh in background without blocking UI
      if (!isLoadingRef.current) {
        loadDashboardData(false);
      }
    } else {
      // No cache or expired - load in background
      setLoading(true);
      setDataLoaded(false);
      loadDashboardData(false);
    }
  }, [loadDashboardData]);

  return {
    stats,
    activity,
    dailyReport,
    loading,
    dataLoaded,
    loadDashboardData,
  };
}
