'use client';

import { memo, useMemo } from 'react';
import { CalendarCheck, Users, Clock } from 'lucide-react';
import { DailyReport } from '@/lib/services/reportsApi';
import KPICard from './KPICard';
import { RupeeIcon } from './RupeeIcon';

interface KPICardsProps {
  stats: any;
  dailyReport: DailyReport | null;
}

function KPICards({ stats, dailyReport }: KPICardsProps) {
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
          label="Total Follow-Up"
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

  return kpiCards;
}

export default memo(KPICards);
