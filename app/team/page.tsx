'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, CalendarX, Building } from 'lucide-react';
import { teamService } from '@/lib/services/api';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { User } from '@/types';

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTeamMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const params: any = filter !== 'all' ? { status: filter } : {};
      const response = await teamService.getTeamMembers(params);
      setTeamMembers(response.data || []);
    } catch (error) {
      toast.error('Failed to load team members');
      console.error('Load team error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'leave':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-4 md:space-y-6">
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Team</h2>
                <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">Manage your team members</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
              <FilterCard
                icon={Users}
                value={teamMembers.length}
                label="Total Team Members"
                active={filter === 'all'}
                onClick={() => setFilter('all')}
              />
              <FilterCard
                icon={UserCheck}
                value={teamMembers.filter(m => m.status === 'active').length}
                label="Active Today"
                active={filter === 'active'}
                onClick={() => setFilter('active')}
                color="green"
              />
              <FilterCard
                icon={CalendarX}
                value={teamMembers.filter(m => m.status === 'leave').length}
                label="On Leave"
                active={filter === 'leave'}
                onClick={() => setFilter('leave')}
                color="orange"
              />
              <FilterCard
                icon={Building}
                value={new Set(teamMembers.map(m => m.department).filter(Boolean)).size}
                label="Departments"
                active={false}
                onClick={() => {}}
              />
            </div>
          </div>

          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">Team Members</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8 md:py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="bg-white rounded-xl md:rounded-2xl p-8 md:p-12 text-center">
                <p className="text-sm md:text-base text-gray-500">No team members found</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {teamMembers.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
}

function FilterCard({ icon: Icon, value, label, active, onClick, color = 'blue' }: {
  icon: React.ElementType;
  value: number;
  label: string;
  active: boolean;
  onClick: () => void;
  color?: 'blue' | 'green' | 'orange';
}) {
  const colorClasses = {
    blue: 'border-primary text-primary',
    green: 'border-green-500 text-green-600',
    orange: 'border-orange-500 text-orange-600',
  };

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-lg md:rounded-xl p-3 md:p-5 shadow-sm border-2 text-left transition-all card-hover ${
        active
          ? `${colorClasses[color]} shadow-md`
          : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className={`w-10 h-10 md:w-12 md:h-12 ${active ? colorClasses[color].replace('text-', 'bg-').replace('-600', '-100') : 'bg-primary/10'} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${active ? colorClasses[color] : 'text-primary'}`} />
        </div>
      </div>
      <p className={`text-xl md:text-3xl font-bold mb-0.5 md:mb-1 ${active ? colorClasses[color] : 'text-gray-900'}`}>
        {value}
      </p>
      <p className="text-xs md:text-sm text-gray-600 font-medium">{label}</p>
    </button>
  );
}

function TeamMemberCard({ member, getStatusColor }: {
  member: User;
  getStatusColor: (status: string) => string;
}) {
  return (
    <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 md:space-x-4 flex-1 min-w-0">
          <div className={`w-10 h-10 md:w-12 md:h-12 ${member.avatarColor || 'bg-primary'} rounded-full flex items-center justify-center text-white text-sm md:text-base font-semibold flex-shrink-0`}>
            {member.initials || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 md:space-x-2 mb-0.5 md:mb-1 flex-wrap">
              <p className="font-semibold text-sm md:text-base text-gray-900 truncate">{member.name}</p>
              <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2.5 py-0.5 rounded-full border ${getStatusColor(member.status)} flex-shrink-0`}>
                {member.status === 'active' ? 'Active' : 'On Leave'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1 truncate">
              {member.role} • {member.department || 'General'}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 truncate mb-1 md:mb-2">
              {member.email} • {member.phone || 'N/A'}
            </p>
            <div className="flex items-center space-x-2 md:space-x-4 text-[10px] md:text-xs text-gray-500 flex-wrap">
              <span>Experience: {member.experience || 'N/A'}</span>
              <span>Specialization: {member.specialization || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
