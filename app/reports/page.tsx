'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { appointmentApi } from '@/lib/services/appointmentApi';
import { teamApi } from '@/lib/services/teamApi';
import toast from 'react-hot-toast';
import { CrmAppointment } from '@/lib/utils/appointmentAdapter';
import { CrmTeam } from '@/types/crmApi';

// Lazy load heavy chart components for better performance
const EngagementChart = dynamic(() => import('@/components/charts/EngagementChart'), {
  loading: () => <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>,
  ssr: false
});

const CampaignChart = dynamic(() => import('@/components/charts/CampaignChart'), {
  loading: () => <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>,
  ssr: false
});

const CustomerActivityTrendChart = dynamic(() => import('@/components/charts/CustomerActivityTrendChart'), {
  loading: () => <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>,
  ssr: false
});

const TeamMetricsChart = dynamic(() => import('@/components/charts/TeamMetricsChart'), {
  loading: () => <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>,
  ssr: false
});

interface TeamMetric {
  name: string;
  bookings: number;
  doctorId: string;
}

export default function ReportsPage() {
  const [teamMetrics, setTeamMetrics] = useState<TeamMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'annually'>('weekly');

  useEffect(() => {
    loadTeamMetrics();
  }, []);

  const loadTeamMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch all appointments and team members in parallel
      const [appointments, teams] = await Promise.all([
        appointmentApi.getAppointments(),
        teamApi.getTeams(),
      ]);

      // Filter for doctors only - check if name starts with "Dr." or role contains doctor-related terms
      const doctors = teams.filter(member => {
        const name = (member.name || '').toLowerCase();
        const role = (member.role || '').toLowerCase();
        return name.startsWith('dr.') || 
               role.includes('doctor') || 
               role.includes('physician') || 
               role.includes('cardiologist') ||
               role.includes('practitioner') ||
               role === 'dr';
      });

      // Count bookings per doctor
      const doctorBookingCounts: Record<string, number> = {};
      
      appointments.forEach((appointment: CrmAppointment) => {
        // Handle different appointment doctor formats
        let doctorId: string | null = null;
        if (typeof appointment.assigned_to === 'string') {
          doctorId = appointment.assigned_to;
        }

        if (doctorId) {
          doctorBookingCounts[doctorId] = (doctorBookingCounts[doctorId] || 0) + 1;
        }
      });

      // Create chart data with doctor names and booking counts
      const metricsData: TeamMetric[] = doctors.map(doctor => {
        const doctorId = doctor.id;
        const doctorName = doctor.name || 'Unknown Doctor';
        const bookingCount = doctorBookingCounts[doctorId] || 0;

        return {
          name: doctorName,
          bookings: bookingCount,
          doctorId: doctorId,
        };
      });

      // Sort by booking count (descending)
      metricsData.sort((a, b) => b.bookings - a.bookings);

      setTeamMetrics(metricsData);
    } catch (error) {
      toast.error('Failed to load team metrics');
      console.error('Load team metrics error:', error);
      setTeamMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PrivateRoute>
      <Layout>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
          <header className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-[32px] font-bold text-[#6366F1] dark:text-indigo-400 mb-2">Reports</h1>
                <p className="text-sm text-[#6B7280] dark:text-gray-400">Analytics and Insights For Your Business Performance</p>
              </div>
              <div className="flex bg-[#F3F4F6] dark:bg-gray-700 rounded-lg p-0.5 gap-0.5 flex-wrap">
                <button
                  onClick={() => setCurrentPeriod('weekly')}
                  className={`px-2 py-1 border-none rounded-md font-["Inter",sans-serif] text-xs font-medium transition-all duration-200 ${
                    currentPeriod === 'weekly'
                      ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                      : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setCurrentPeriod('monthly')}
                  className={`px-2 py-1 border-none rounded-md font-["Inter",sans-serif] text-xs font-medium transition-all duration-200 ${
                    currentPeriod === 'monthly'
                      ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                      : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setCurrentPeriod('quarterly')}
                  className={`px-2 py-1 border-none rounded-md font-["Inter",sans-serif] text-xs font-medium transition-all duration-200 ${
                    currentPeriod === 'quarterly'
                      ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                      : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
                  }`}
                >
                  Quarterly
                </button>
                <button
                  onClick={() => setCurrentPeriod('annually')}
                  className={`px-2 py-1 border-none rounded-md font-["Inter",sans-serif] text-xs font-medium transition-all duration-200 ${
                    currentPeriod === 'annually'
                      ? 'bg-white dark:bg-gray-600 text-[#6366F1] dark:text-indigo-400 shadow-sm'
                      : 'bg-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#6366F1] dark:hover:text-indigo-400'
                  }`}
                >
                  Annually
                </button>
              </div>
            </div>
          </header>

          {/* Engagement Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E6E8EC] dark:border-gray-700 p-4 md:p-6 mb-4 md:mb-6 shadow-sm hover:shadow-md transition-shadow animate-fadeIn">
            <EngagementChart currentPeriod={currentPeriod} />
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* Campaign Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E6E8EC] dark:border-gray-700 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <CampaignChart currentPeriod={currentPeriod} />
            </div>

            {/* Customer Activity Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E6E8EC] dark:border-gray-700 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <CustomerActivityTrendChart currentPeriod={currentPeriod} />
            </div>
          </div>

          {/* Team Metrics Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E6E8EC] dark:border-gray-700 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <TeamMetricsChart data={teamMetrics} loading={loading} currentPeriod={currentPeriod} />
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
}
