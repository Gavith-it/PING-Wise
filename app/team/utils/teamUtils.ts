/**
 * Utility functions for team management
 */

/**
 * Generate initials from name
 */
export function generateInitials(name: string): string {
  if (!name) return 'U';
  const names = name.trim().split(' ').filter(n => n.length > 0);
  if (names.length === 0) return 'U';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  // Take first letter of first name and first letter of last name
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generate avatar color based on name (deterministic)
 */
export function generateAvatarColor(name: string, index: number): string {
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
}

/**
 * Get status color classes
 */
export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'leave':
    case 'onleave':
    case 'on leave': // Handle both UI format (OnLeave) and API format (onleave)
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'inactive':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}
