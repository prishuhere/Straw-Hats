import React from 'react';

interface LuffyStrawHatIconProps {
  className?: string;
  size?: number;
}

export const LuffyStrawHatIcon: React.FC<LuffyStrawHatIconProps> = ({
  className = '',
  size = 28,
}) => {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.72)}
      viewBox="0 0 100 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block align-middle transition-transform hover:scale-110 drop-shadow-md ${className}`}
      aria-label="Luffy's Straw Hat"
      role="img"
    >
      <defs>
        {/* Crown Straw Gradient */}
        <linearGradient id="crownStrawGrad" x1="50" y1="6" x2="50" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        {/* Brim Straw Gradient */}
        <linearGradient id="brimStrawGrad" x1="50" y1="36" x2="50" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>

        {/* Ribbon Red Gradient */}
        <linearGradient id="ribbonRedGrad" x1="50" y1="36" x2="50" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="40%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>

        {/* Shadow under brim */}
        <filter id="hatShadow" x="0" y="32" width="100" height="40" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#04180f" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* 1. Straw Hat Crown (Dome) */}
      <path
        d="M 28 42 C 27 22, 35 8, 50 8 C 65 8, 73 22, 72 42 Z"
        fill="url(#crownStrawGrad)"
        stroke="#ca8a04"
        strokeWidth="1.8"
      />

      {/* Crown Straw Weave Lines */}
      <path
        d="M 36 20 C 44 18, 56 18, 64 20"
        stroke="#fef08a"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M 32 30 C 42 27, 58 27, 68 30"
        stroke="#fef08a"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* 2. Iconic Red Ribbon Band */}
      <path
        d="M 27 42 C 34 38, 66 38, 73 42 C 73 47, 66 49, 50 49 C 34 49, 27 47, 27 42 Z"
        fill="url(#ribbonRedGrad)"
        stroke="#7f1d1d"
        strokeWidth="1.2"
      />

      {/* 3. Straw Hat Wide Curved Brim */}
      <ellipse
        cx="50"
        cy="52"
        rx="46"
        ry="14"
        fill="url(#brimStrawGrad)"
        stroke="#b45309"
        strokeWidth="2"
      />

      {/* Brim Highlight curve */}
      <path
        d="M 8 52 C 20 62, 80 62, 92 52"
        stroke="#fef08a"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Inner Brim shadow under ribbon */}
      <path
        d="M 26 48 C 36 53, 64 53, 74 48"
        stroke="#78350f"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
};
