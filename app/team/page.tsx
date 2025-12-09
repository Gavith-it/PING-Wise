'use client';

import { useState, useEffect, useRef } from 'react';
import { Users, UserCheck, CalendarX, Building, Search, Filter, MoreVertical, Eye, Edit, Trash2, Calendar } from 'lucide-react';
import { teamService, appointmentService } from '@/lib/services/api';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { User } from '@/types';
import TeamModal from '@/components/modals/TeamModal';
import TeamMemberDetailsModal from '@/components/modals/TeamMemberDetailsModal';
import TeamFilterModal from '@/components/modals/TeamFilterModal';
import StarRating from '@/components/ui/star-rating';
import { useOnClickOutside } from 'usehooks-ts';

// Helper function to generate initials from name
const generateInitials = (name: string): string => {
  if (!name) return 'U';
  const names = name.trim().split(' ').filter(n => n.length > 0);
  if (names.length === 0) return 'U';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  // Take first letter of first name and first letter of last name
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Helper function to generate avatar color based on name (deterministic)
const generateAvatarColor = (name: string, index: number): string => {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500',
    'bg-orange-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500',
    'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500', 'bg-amber-500'
  ];
  // Use a hash of the name or index to get consistent color
  if (name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
  return colors[index % colors.length];
};

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [filters, setFilters] = useState({ status: 'all', department: 'all' });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [appointmentCounts, setAppointmentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadTeamMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, filters]);

  useEffect(() => {
    filterMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, teamMembers]);

  useEffect(() => {
    loadAppointmentCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamMembers]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters.department !== 'all') {
        params.department = filters.department;
      }
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await teamService.getTeamMembers(params);
      const members = response.data || [];
      
      // Ensure each member has initials and unique avatarColor
      // Always generate unique colors based on name/index to ensure each member is different
      const processedMembers = members.map((member: User, index: number) => {
        // Always generate initials if missing
        const memberInitials = member.initials || generateInitials(member.name);
        
        // Always generate unique avatar color based on name (deterministic but unique per name)
        // This ensures each member gets a distinct color, even if API returns same colors
        const memberAvatarColor = generateAvatarColor(member.name, index);
        
        return {
          ...member,
          initials: memberInitials,
          avatarColor: memberAvatarColor
        };
      });
      
      setTeamMembers(processedMembers);
      setFilteredMembers(processedMembers);
    } catch (error) {
      toast.error('Failed to load team members');
      console.error('Load team error:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filterMembers = () => {
    if (!searchQuery.trim()) {
      // Use already processed teamMembers (they already have initials and avatarColor)
      setFilteredMembers(teamMembers);
      return;
    }

    const query = searchQuery.toLowerCase();
    // Filter already processed members (they already have initials and avatarColor)
    const filtered = teamMembers.filter((member) =>
      member.name.toLowerCase().includes(query)
    );
    
    setFilteredMembers(filtered);
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

  const handleView = (member: User) => {
    setSelectedMember(member);
    setShowDetailsModal(true);
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
      await teamService.deleteTeamMember(id);
      toast.success('Team member deleted successfully');
      loadTeamMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete team member');
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
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Team</h2>
                <p className="text-sm md:text-base text-gray-600 mt-0.5 md:mt-1">Manage your team members</p>
              </div>
            </div>

            {/* Summary Cards */}
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
                value={departments.length}
                label="Departments"
                active={false}
                onClick={() => {}}
              />
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Search by staff name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 md:pl-11 pr-4 py-2 md:py-2.5 border border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
                />
              </div>
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 md:px-3 md:py-2 bg-white border border-gray-300 rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 md:w-4 md:h-4 text-gray-600" />
                <span className="hidden sm:inline text-sm text-gray-700">Filter</span>
              </button>
            </div>
          </div>

          {/* Team Members List */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">Team Members</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8 md:py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="bg-white rounded-xl md:rounded-2xl p-8 md:p-12 text-center">
                <p className="text-sm md:text-base text-gray-500">No team members found</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {filteredMembers.map((member, index) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    index={index}
                    getStatusColor={getStatusColor}
                    appointmentCount={appointmentCounts[member.id] || 0}
                    onView={() => handleView(member)}
                    onEdit={() => handleEdit(member)}
                    onDelete={() => handleDelete(member.id)}
                  />
                ))}
              </div>
            )}
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
              setShowDetailsModal(false);
              handleEdit(member);
            }}
            onDelete={(id) => {
              handleDelete(id);
              setShowDetailsModal(false);
            }}
            onSuccess={loadTeamMembers}
          />
        )}

        {showEditModal && selectedMember && (
          <TeamModal
            teamMember={selectedMember}
            onClose={() => {
              setShowEditModal(false);
              setSelectedMember(null);
            }}
            onSuccess={() => {
              loadTeamMembers();
              setShowEditModal(false);
              setSelectedMember(null);
            }}
          />
        )}
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
  const borderColorClasses = {
    blue: 'border-primary',
    green: 'border-green-500',
    orange: 'border-orange-500',
  };
  
  const textColorClasses = {
    blue: 'text-primary',
    green: 'text-green-600',
    orange: 'text-orange-600',
  };
  
  const iconBgClasses = {
    blue: 'bg-primary/10',
    green: 'bg-green-100',
    orange: 'bg-orange-100',
  };
  
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-lg md:rounded-xl p-3 md:p-5 shadow-sm border-2 text-left transition-all card-hover ${
        active
          ? `${borderColorClasses[color]} ${textColorClasses[color]} shadow-md`
          : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className={`w-10 h-10 md:w-12 md:h-12 ${active ? iconBgClasses[color] : 'bg-primary/10'} rounded-lg flex items-center justify-center`}>
          {/* Icon always stays primary color, doesn't change on click */}
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
        </div>
      </div>
      <p className={`text-xl md:text-3xl font-bold mb-0.5 md:mb-1 ${active ? textColorClasses[color] : 'text-gray-900'}`}>
        {value}
      </p>
      <p className="text-xs md:text-sm text-gray-600 font-medium">{label}</p>
    </button>
  );
}

function TeamMemberCard({ 
  member, 
  index,
  getStatusColor, 
  appointmentCount,
  onView,
  onEdit,
  onDelete,
}: {
  member: User;
  index: number;
  getStatusColor: (status: string) => string;
  appointmentCount: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(menuRef, () => setShowMenu(false));

  return (
    <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 md:gap-4">
        <div className="flex items-start space-x-2 md:space-x-4 flex-1 min-w-0">
          <div 
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white text-sm md:text-base font-semibold flex-shrink-0 ${
              member.avatarColor || generateAvatarColor(member.name, index)
            }`}
          >
            {member.initials || generateInitials(member.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
              <p className="font-semibold text-sm md:text-base text-gray-900 truncate">{member.name}</p>
              <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2.5 py-0.5 rounded-full border ${getStatusColor(member.status)} flex-shrink-0`}>
                {member.status === 'active' ? 'Active' : member.status === 'leave' ? 'On Leave' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-600 mb-1 truncate">
              {member.role} • {member.department || 'General'}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 truncate mb-1 md:mb-2">
              {member.email} • {member.phone || 'N/A'}
            </p>
            
            {/* Rating and Appointment Count */}
            <div className="flex items-center gap-3 md:gap-4 flex-wrap">
              {member.rating && (
                <div className="flex items-center gap-1">
                  <StarRating rating={member.rating} size="sm" />
                </div>
              )}
              <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500">
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                <span>{appointmentCount} Appointments</span>
              </div>
            </div>

            {/* Experience and Specialization */}
            {(member.experience || member.specialization) && (
              <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs text-gray-500 mt-1 flex-wrap">
                {member.experience && <span>Experience: {member.experience}</span>}
                {member.specialization && <span>Specialization: {member.specialization}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 md:w-48 bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-200 z-10 py-1">
              <button
                onClick={() => {
                  onView();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 text-left text-sm md:text-base text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
              <button
                onClick={() => {
                  onEdit();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 text-left text-sm md:text-base text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 text-left text-sm md:text-base text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
