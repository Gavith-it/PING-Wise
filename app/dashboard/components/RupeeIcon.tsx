'use client';

interface RupeeIconProps {
  className?: string;
}

export function RupeeIcon({ className }: RupeeIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="12"
        y="18"
        textAnchor="middle"
        fontSize="20"
        fontWeight="bold"
        fill="currentColor"
        fontFamily="Arial, sans-serif"
      >
        ₹
      </text>
    </svg>
  );
}
