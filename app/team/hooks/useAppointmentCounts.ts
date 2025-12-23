import { useState, useEffect } from 'react';
import { appointmentService } from '@/lib/services/api';
import { User } from '@/types';

// Loads appointment counts for team members
export function useAppointmentCounts(teamMembers: User[]) {
  const [appointmentCounts, setAppointmentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadAppointmentCounts = async () => {
      const counts: Record<string, number> = {};
      for (const member of teamMembers) {
        try {
          const response = await appointmentService.getAppointments({ doctor: member.id });
          counts[member.id] = response.count || 0;
        } catch (error) {
          counts[member.id] = 0;
        }
      }
      setAppointmentCounts(counts);
    };

    if (teamMembers.length > 0) {
      loadAppointmentCounts();
    }
  }, [teamMembers]);

  return appointmentCounts;
}
