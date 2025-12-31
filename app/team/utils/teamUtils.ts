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
 * Generate avatar color based on name (deterministic) - improved for better distribution
 */
export function generateAvatarColor(name: string, index?: number): string {
  // Valid Tailwind color classes - expanded palette for better variety
  const validColors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500',
    'bg-orange-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500',
    'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500', 'bg-amber-500',
    'bg-sky-500', 'bg-blue-600', 'bg-purple-600', 'bg-green-600',
    'bg-red-600', 'bg-orange-600', 'bg-indigo-600', 'bg-pink-600'
  ];
  
  // Use index if provided for consistent ordering
  if (index !== undefined) {
    return validColors[index % validColors.length];
  }
  
  // Generate consistent color based on name using better hash
  if (name) {
    // Use a better hash function that considers the entire name
    let hash = 0;
    const nameLower = name.trim().toLowerCase();
    for (let i = 0; i < nameLower.length; i++) {
      hash = ((hash << 5) - hash) + nameLower.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Use absolute value and modulo to get index
    const colorIndex = Math.abs(hash) % validColors.length;
    return validColors[colorIndex];
  }
  
  // Default color
  return 'bg-blue-500';
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
      return 'bg-red-100 text-red-700 border-red-200';
    case 'inactive':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}
