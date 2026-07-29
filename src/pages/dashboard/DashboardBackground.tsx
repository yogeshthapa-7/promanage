'use client';

interface BackgroundProps {
  className?: string;
}

export default function DashboardBackground({ className = '' }: BackgroundProps) {
  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}>
      <div className="absolute inset-0 bg-[#EEF2F8]">
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
        >
          <defs>
            {/* Clay Inset & Drop Lighting Filter for Smooth 3D Depth */}
            <filter id="clay-topography-filter" x="-20%" y="-20%" width="140%" height="140%">
              {/* Soft Ambient Base Shadow */}
              <feDropShadow dx="-14" dy="18" stdDeviation="16" floodColor="#9AAEC4" floodOpacity="0.38" />
              {/* Top-Left Soft Highlight */}
              <feDropShadow dx="10" dy="-10" stdDeviation="12" floodColor="#FFFFFF" floodOpacity="0.95" />
            </filter>

            {/* Deeper Cavity Filter for Nested Liquid Layers */}
            <filter id="clay-cavity-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="-20" dy="24" stdDeviation="20" floodColor="#8D9FB7" floodOpacity="0.4" />
              <feDropShadow dx="12" dy="-12" stdDeviation="14" floodColor="#FFFFFF" floodOpacity="0.9" />
            </filter>

            {/* Soft Ambient Color Gradients */}
            <linearGradient id="clay-surface" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FAFBFD" />
              <stop offset="40%" stopColor="#EEF3F9" />
              <stop offset="100%" stopColor="#E2E8F2" />
            </linearGradient>

            <linearGradient id="clay-surface-deep" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F5F8FC" />
              <stop offset="100%" stopColor="#D9E2EF" />
            </linearGradient>

            {/* Lavender Soft Glow for Background Mood */}
            <radialGradient id="soft-lavender-glow" cx="15%" cy="25%" r="50%">
              <stop offset="0%" stopColor="rgba(196, 181, 253, 0.35)" />
              <stop offset="100%" stopColor="rgba(196, 181, 253, 0)" />
            </radialGradient>
          </defs>

          {/* Background Ambient Tint */}
          <rect width="100%" height="100%" fill="url(#soft-lavender-glow)" />

          {/* LAYER 1: Deep Background Clay Level */}
          <g filter="url(#clay-cavity-filter)">
            {/* Top Right Liquid Hill */}
            <path
              d="M 750 -50 C 900 60, 1050 20, 1200 120 C 1350 220, 1380 380, 1500 480 L 1500 -50 Z"
              fill="url(#clay-surface-deep)"
            />
            {/* Bottom Left Flowing Contour */}
            <path
              d="M -50 380 C 120 420, 240 540, 180 720 C 120 860, 40 900, -50 950 Z"
              fill="url(#clay-surface-deep)"
            />
          </g>

          {/* LAYER 2: Mid-Level Topographic Ridge Curves */}
          <g filter="url(#clay-topography-filter)">
            {/* Top Left Outer Liquid Ring */}
            <path
              d="M -50 -50 C 180 10, 320 180, 220 360 C 140 480, 20 500, -50 560 Z"
              fill="url(#clay-surface)"
            />
            {/* Right Side Frame Wrap */}
            <path
              d="M 1500 220 C 1320 280, 1220 420, 1300 620 C 1380 780, 1420 820, 1500 950 Z"
              fill="url(#clay-surface)"
            />
            {/* Bottom Valley Ridge */}
            <path
              d="M 280 950 C 400 820, 680 780, 880 860 C 1020 920, 1220 870, 1350 950 Z"
              fill="url(#clay-surface)"
            />
          </g>

          {/* LAYER 3: Concentric Smooth Sculpted Organic Cutouts */}
          <g filter="url(#clay-topography-filter)">
            {/* Top Left Inner Sculpted Hole */}
            <path
              d="M 40 40 C 110 60, 160 140, 110 220 C 60 290, -10 270, -30 200 C -50 130, -10 20, 40 40 Z"
              fill="#EBF0F7"
            />
            {/* Bottom Left Concentric Cavity */}
            <path
              d="M 20 540 C 90 560, 120 640, 80 710 C 40 780, -20 760, -40 700 C -60 630, -30 520, 20 540 Z"
              fill="#E8EEF6"
            />
            {/* Right Edge Inner Liquid Cutout */}
            <path
              d="M 1400 400 C 1330 460, 1320 560, 1380 620 C 1430 670, 1480 640, 1500 580 Z"
              fill="#EAF0F8"
            />
          </g>
        </svg>

        {/* Diffuse Lighting Highlight Overlay */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"
          style={{
            background: 'radial-gradient(circle at 20% 15%, rgba(255, 255, 255, 0.9) 0%, transparent 60%)',
          }}
        />
      </div>
    </div>
  );
}