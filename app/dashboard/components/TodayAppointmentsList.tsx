'use client';

import { memo, useMemo } from 'react';
import { CalendarCheck } from 'lucide-react';
import { Appointment } from '@/types';
import TodayAppointmentCard from './TodayAppointmentCard';

interface TodayAppointmentsListProps {
  appointments: Appointment[];
  loading: boolean;
  dataLoaded: boolean;
}

function TodayAppointmentsList({ appointments, loading, dataLoaded }: TodayAppointmentsListProps) {
  const appointmentCards = useMemo(() => (
    appointments.map((appointment) => (
      <TodayAppointmentCard
        key={appointment.id}
        appointment={appointment}
      />
    ))
  ), [appointments]);

  if (!dataLoaded && loading) {
    // Show skeleton only while initial data is loading
    return (
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
    );
  }

  if (appointments.length > 0) {
    // Show appointments if we have any - with spacing between cards, no background container
    return (
      <div className="space-y-3">
        {appointmentCards}
      </div>
    );
  }

  // Show proper empty state once data has loaded (even if empty)
  return (
    <div className="p-6 md:p-8 text-center">
      <CalendarCheck className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-2 md:mb-3" />
      <p className="text-sm md:text-base text-gray-500 font-medium">No appointments scheduled for today</p>
    </div>
  );
}

export default memo(TodayAppointmentsList);
