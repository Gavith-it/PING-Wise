'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Users, UserCheck, CalendarX, Building } from 'lucide-react';
import { teamApi } from '@/lib/services/teamApi';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { User } from '@/types';
import { useTeamMembers } from './hooks/useTeamMembers';
import { useTeamFilters } from './hooks/useTeamFilters';
import FilterCard from './components/FilterCard';
import TeamSearchBar from './components/TeamSearchBar';
import TeamList from './components/TeamList';

// Lazy load modals for better performance
const TeamModal = dynamic(() => import('@/components/modals/TeamModal'), {
  loading: () => null,
  ssr: false
});

const TeamMemberDetailsModal = dynamic(() => import('@/components/modals/TeamMemberDetailsModal'), {
  loading: () => null,
  ssr: false
});

const TeamFilterModal = dynamic(() => import('@/components/modals/TeamFilterModal'), {
  loading: () => null,
  ssr: false
});

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [filters, setFilters] = useState({ status: 'all', department: 'all' });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Use team members hook
  const {
    teamMembers,
    loading,
    loadTeamMembers,
    addTeamMemberToCache,
    updateTeamMemberInCache,
    removeTeamMemberFromCache,
  } = useTeamMembers({ filter, filters });

  // Fetch dashboard data from /teams/dashboard API
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await teamApi.getTeamDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading team dashboard:', error);
        // Set default values on error
        setDashboardData({
          totalMembers: 0,
          activeMembers: 0,
          onLeaveMembers: 0,
          departments: 0,
        });
      }
    };
    loadDashboard();
  }, []);

  // Use filter hook
  const filteredMembers = useTeamFilters(teamMembers, searchQuery, filters);

  const handleView = (member: User) => {
    setSelectedMember(member);
    setShowDetailsModal(true);
  };

  const handleAdd = () => {
    setSelectedMember(null);
    setShowEditModal(true);
  };

  const handleEdit = (member: User) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) {
      return;
    }

    try {
      await teamApi.deleteTeam(id);
      toast.success('Team member deleted successfully');
      // Optimistically remove from cache instead of refetching
      removeTeamMemberFromCache(id);
      // Refresh dashboard data to update KPI cards
      const data = await teamApi.getTeamDashboard().catch(() => ({}));
      setDashboardData(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete team member');
    }
  };

  const handleStatusToggle = async (memberId: string, newStatus: 'active' | 'OnLeave') => {
    try {
      // Find the member in the current list
      const member = teamMembers.find(m => m.id === memberId);
      if (!member) {
        toast.error('Team member not found');
        return;
      }

      // Import adapter to convert User to CrmTeamRequest
      const { userToCrmTeam } = await import('@/lib/utils/teamAdapter');
      
      // Create updated member with new status
      const updatedMember = { ...member, status: newStatus };
      
      // Convert to API format
      const apiData = userToCrmTeam(updatedMember);
      
      // Update via API
      await teamApi.updateTeam(memberId, apiData);
      
      // Update cache optimistically
      updateTeamMemberInCache(updatedMember);
      
      // Refresh dashboard data to update KPI cards
      const data = await teamApi.getTeamDashboard().catch(() => ({}));
      setDashboardData(data);
      
      toast.success(`Team member status updated to ${newStatus === 'OnLeave' ? 'On Leave' : 'Active'}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update team member status');
    }
  };

  const departments = Array.from(new Set(teamMembers.map(m => m.department).filter(Boolean))) as string[];

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-4 md:space-y-6">
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Team</h2>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-0.5 md:mt-1">Manage your team members</p>
              </div>
            </div>

            {/* Summary Cards - Use API data from /teams/dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
              <FilterCard
                icon={Users}
                value={dashboardData?.totalMembers || dashboardData?.total_members || 0}
                label="Total Team Members"
                active={false}
              />
              <FilterCard
                icon={UserCheck}
                value={dashboardData?.activeMembers || dashboardData?.active_members || 0}
                label="Active Today"
                active={false}
                color="green"
              />
              <FilterCard
                icon={CalendarX}
                value={dashboardData?.onLeaveMembers || dashboardData?.on_leave_members || 0}
                label="On Leave"
                active={false}
                color="red"
              />
              <FilterCard
                icon={Building}
                value={dashboardData?.departments || 0}
                label="Departments"
                active={false}
              />
            </div>

            {/* Search and Filter Bar */}
            <TeamSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onFilterClick={() => setShowFilterModal(true)}
              onAddClick={handleAdd}
            />
          </div>

          {/* Team Members List */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">Team Members</h3>
            <TeamList
              teamMembers={filteredMembers}
              loading={loading}
              onCardClick={handleView}
              onStatusToggle={handleStatusToggle}
            />
          </div>
        </div>

        {/* Modals */}
        <TeamFilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          filters={filters}
          onFilterChange={setFilters}
          departments={departments}
        />

        {showDetailsModal && selectedMember && (
          <TeamMemberDetailsModal
            teamMember={selectedMember}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedMember(null);
            }}
            onEdit={(member) => {
              // Set the member to edit and close details modal
              setSelectedMember(member);
              setShowDetailsModal(false);
              // Open edit modal (don't clear selectedMember)
              setShowEditModal(true);
            }}
            onDelete={(id) => {
              handleDelete(id);
              setShowDetailsModal(false);
            }}
            onSuccess={() => {
              // Manual refresh - prevent useEffect from triggering
              loadTeamMembers(true, true);
            }}
          />
        )}

        {showEditModal && (
          <TeamModal
            teamMember={selectedMember}
            onClose={() => {
              // If we were editing (selectedMember exists), go back to details modal
              if (selectedMember) {
                setShowEditModal(false);
                setShowDetailsModal(true);
              } else {
                // If adding new, close completely
                setShowEditModal(false);
                setSelectedMember(null);
              }
            }}
            onSuccess={async (createdOrUpdatedMember) => {
              // If we were editing (selectedMember exists), update and go back to details modal
              if (selectedMember && createdOrUpdatedMember) {
                setSelectedMember(createdOrUpdatedMember);
                setShowEditModal(false);
                setShowDetailsModal(true);
                // Update cache with the updated member
                updateTeamMemberInCache(createdOrUpdatedMember);
                // Refresh dashboard data to update KPI cards
                const data = await teamApi.getTeamDashboard().catch(() => ({}));
                setDashboardData(data);
              } else if (createdOrUpdatedMember) {
                // If adding new, add to cache and close
                addTeamMemberToCache(createdOrUpdatedMember);
                setShowEditModal(false);
                setSelectedMember(null);
                // Refresh dashboard data to update KPI cards
                const data = await teamApi.getTeamDashboard().catch(() => ({}));
                setDashboardData(data);
              } else {
                // Fallback: if we don't have the member data, refresh (shouldn't happen)
                loadTeamMembers(true, true);
                setShowEditModal(false);
                setSelectedMember(null);
                // Refresh dashboard data to update KPI cards
                const data = await teamApi.getTeamDashboard().catch(() => ({}));
                setDashboardData(data);
              }
            }}
          />
        )}
      </Layout>
    </PrivateRoute>
  );
}
