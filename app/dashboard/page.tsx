'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, Users, Clock, DollarSign, CalendarPlus, UserPlus, ArrowRight } from 'lucide-react';
import { dashboardService } from '@/lib/services/api';
import { useAuth } from '@/contexts/AuthContext';
import CountUp from 'react-countup';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ActivityChart from '@/components/charts/ActivityChart';
import AppointmentModal from '@/components/modals/AppointmentModal';
import PatientModal from '@/components/modals/PatientModal';
import { useNotifications } from '@/contexts/NotificationContext';
import { Appointment } from '@/types';

interface KPICardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  change?: number;
  trend?: 'up' | 'down';
  isCurrency?: boolean;
  isComingSoon?: boolean;
}

function KPICard({ icon: Icon, value, label, change, trend, isCurrency, isComingSoon }: KPICardProps) {
  const isPositive = trend === 'up';
  const changeColor = isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
  const changeSymbol = isPositive ? '+' : '';
  const trendIcon = isPositive ? '↑' : '↓';

  let numericValue = 0;
  let suffix = '';
  let prefix = '';
  
  if (isCurrency && !isComingSoon) {
    numericValue = typeof value === 'number' ? value / 1000 : parseFloat(String(value)) / 1000 || 0;
    prefix = '$';
    suffix = 'K';
  } else if (!isComingSoon) {
    numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
  }

  return (
    <div className="bg-white rounded-lg p-3 md:p-6 shadow-sm border border-gray-100 card-hover">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg md:rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 md:w-7 md:h-7 text-primary" />
        </div>
        {change !== undefined && !isComingSoon && (
          <div className={`flex items-center space-x-1 text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full ${changeColor}`}>
            <span>{trendIcon}</span>
            <span>{changeSymbol}{change}%</span>
          </div>
        )}
      </div>
      <div className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
        {isComingSoon ? (
          <span className="text-base md:text-lg text-gray-500 font-medium">Coming Soon</span>
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
      <p className="text-xs md:text-sm text-gray-600 font-medium">{label}</p>
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
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
    <div className="w-full p-3 md:p-4 flex items-center justify-between text-left">
      <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
        <div className={`w-8 h-8 md:w-10 md:h-10 ${patient?.avatarColor || 'bg-primary'} rounded-full flex items-center justify-center text-white text-xs md:text-sm font-medium flex-shrink-0`}>
          {patient?.initials || 'P'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm md:text-base text-gray-900 truncate">{patient?.name || 'Unknown'}</p>
          <p className="text-xs md:text-sm text-gray-600 truncate">
            {appointment.time} • {doctor?.name || 'Doctor'} • {appointment.type || 'Consultation'}
          </p>
        </div>
      </div>
      <span className={`text-[10px] md:text-xs font-medium px-2 md:px-3 py-0.5 md:py-1 rounded-full border ${getStatusColor(appointment.status)} flex-shrink-0 ml-2`}>
        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
      </span>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, description, onClick, color = 'primary' }: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  color?: 'primary' | 'success';
}) {
  const colorConfig = {
    primary: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      hoverBg: 'hover:from-blue-600 hover:to-blue-700',
      iconBg: 'bg-white/20',
      text: 'text-white',
      shadow: 'shadow-lg shadow-blue-500/30',
      hoverShadow: 'hover:shadow-xl hover:shadow-blue-500/40',
    },
    success: {
      bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      hoverBg: 'hover:from-emerald-600 hover:to-emerald-700',
      iconBg: 'bg-white/20',
      text: 'text-white',
      shadow: 'shadow-lg shadow-emerald-500/30',
      hoverShadow: 'hover:shadow-xl hover:shadow-emerald-500/40',
    },
  };

  const config = colorConfig[color];

  return (
    <button
      onClick={onClick}
      className={`${config.bg} ${config.hoverBg} ${config.shadow} ${config.hoverShadow} rounded-lg md:rounded-xl p-1.5 md:p-2.5 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] group flex items-center justify-between w-full border-0 overflow-hidden`}
    >
      <div className="flex items-center space-x-1.5 md:space-x-2.5 flex-1 min-w-0">
        <div className={`w-7 h-7 md:w-9 md:h-9 ${config.iconBg} rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-all`}>
          <Icon className={`w-3 h-3 md:w-4 md:h-4 ${config.text}`} />
        </div>
        <div className="flex-1 min-w-0 text-left overflow-hidden">
          <p className={`font-bold text-[10px] md:text-xs ${config.text} truncate mb-0 leading-tight`}>{title}</p>
          <p className={`text-[9px] md:text-[10px] ${config.text} truncate hidden sm:block`}>{description}</p>
        </div>
      </div>
      <ArrowRight className={`w-3 h-3 md:w-4 md:h-4 ${config.text} opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0 ml-0.5 md:ml-0`} />
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activityData, appointmentsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getActivity(),
        dashboardService.getTodayAppointments(),
      ]);

      setStats(statsData.data);
      setActivity(activityData.data);
      setTodayAppointments(appointmentsData.data || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentSuccess = () => {
    setShowAppointmentModal(false);
    addNotification({
      type: 'appointment',
      title: 'New Appointment Scheduled',
      message: 'A new appointment has been successfully scheduled.',
    });
    loadDashboardData();
  };

  const handlePatientSuccess = () => {
    setShowPatientModal(false);
    addNotification({
      type: 'patient',
      title: 'New Patient Registered',
      message: 'A new patient has been successfully added to the system.',
    });
    loadDashboardData();
  };

  if (loading) {
    return (
      <PrivateRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Layout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-4 md:space-y-6">
          <div className="mb-3 md:mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
                Welcome back, {user?.name || 'Doctor'}! 👋
              </h2>
              <p className="text-sm md:text-base text-gray-600">Here&apos;s what&apos;s happening today</p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-2.5 md:w-auto md:min-w-[320px]">
              <QuickActionCard
                icon={CalendarPlus}
                title="Schedule Appointment"
                description="Create a new appointment"
                onClick={() => setShowAppointmentModal(true)}
                color="primary"
              />
              <QuickActionCard
                icon={UserPlus}
                title="Add Patient"
                description="Register a new patient"
                onClick={() => setShowPatientModal(true)}
                color="success"
              />
            </div>
          </div>

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
              icon={DollarSign}
              value={0}
              label="Revenue"
              isCurrency={false}
              isComingSoon={true}
            />
          </div>

          <button
            onClick={() => router.push('/reports')}
            className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 card-hover w-full text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900">Patient Activity</h3>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">Distribution overview</p>
              </div>
            </div>
            {activity && <ActivityChart data={activity} />}
          </button>

          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Today&apos;s Appointments</h3>
              <button
                onClick={() => router.push('/appointments')}
                className="text-xs md:text-sm text-primary hover:text-primary-dark font-medium"
              >
                View All
              </button>
            </div>
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-hidden max-h-[400px] overflow-y-auto">
              {todayAppointments.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {todayAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 md:p-8 text-center">
                  <CalendarCheck className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-2 md:mb-3" />
                  <p className="text-sm md:text-base text-gray-500 font-medium">No appointments scheduled for today</p>
                </div>
              )}
            </div>
          </div>

        </div>

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

