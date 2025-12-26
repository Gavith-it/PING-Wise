'use client';

import { useState } from 'react';
import { Users, UserCheck, CalendarX, Building } from 'lucide-react';
import { teamApi } from '@/lib/services/teamApi';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { User } from '@/types';
import TeamModal from '@/components/modals/TeamModal';
import TeamMemberDetailsModal from '@/components/modals/TeamMemberDetailsModal';
import TeamFilterModal from '@/components/modals/TeamFilterModal';
import { useTeamMembers } from './hooks/useTeamMembers';
import { useTeamFilters } from './hooks/useTeamFilters';
import FilterCard from './components/FilterCard';
import TeamSearchBar from './components/TeamSearchBar';
import TeamList from './components/TeamList';

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [filters, setFilters] = useState({ status: 'all', department: 'all' });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Use team members hook
  const {
    teamMembers,
    loading,
    loadTeamMembers,
    addTeamMemberToCache,
    updateTeamMemberInCache,
    removeTeamMemberFromCache,
  } = useTeamMembers({ filter, filters });

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
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete team member');
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

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
              <FilterCard
                icon={Users}
                value={teamMembers.length}
                label="Total Team Members"
                active={false}
              />
              <FilterCard
                icon={UserCheck}
                value={teamMembers.filter(m => m.status === 'active').length}
                label="Active Today"
                active={false}
                color="green"
              />
              <FilterCard
                icon={CalendarX}
                value={teamMembers.filter(m => m.status === 'leave').length}
                label="On Leave"
                active={false}
                color="orange"
              />
              <FilterCard
                icon={Building}
                value={departments.length}
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
            onSuccess={(createdOrUpdatedMember) => {
              // If we were editing (selectedMember exists), update and go back to details modal
              if (selectedMember && createdOrUpdatedMember) {
                setSelectedMember(createdOrUpdatedMember);
                setShowEditModal(false);
                setShowDetailsModal(true);
                // Update cache with the updated member
                updateTeamMemberInCache(createdOrUpdatedMember);
              } else if (createdOrUpdatedMember) {
                // If adding new, add to cache and close
                addTeamMemberToCache(createdOrUpdatedMember);
                setShowEditModal(false);
                setSelectedMember(null);
              } else {
                // Fallback: if we don't have the member data, refresh (shouldn't happen)
                loadTeamMembers(true, true);
                setShowEditModal(false);
                setSelectedMember(null);
              }
            }}
          />
        )}
      </Layout>
    </PrivateRoute>
  );
}
