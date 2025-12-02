'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export default function StarRating({ rating, maxRating = 5, size = 'md', showValue = false }: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5 md:gap-1">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className={`${sizeClasses[size]} text-gray-300`} />
          <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400 absolute top-0 left-0 overflow-hidden`} style={{ width: '50%' }} />
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className={`${sizeClasses[size]} text-gray-300`} />
      ))}
      {showValue && (
        <span className={`${textSizeClasses[size]} text-gray-600 ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

