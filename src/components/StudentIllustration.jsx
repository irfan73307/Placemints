import React from 'react';

/**
 * StudentIllustration Component
 * 
 * High-quality vector SVG illustration of a student working on a laptop.
 * Styled with purple hoodie aesthetic matching the Dashboard Hero reference design.
 */
export function StudentIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 450 350"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto ${className}`}
    >
      <defs>
        {/* Soft background glow */}
        <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
        </radialGradient>
        {/* Laptop Screen Gradient */}
        <linearGradient id="laptopScreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
        {/* Skin Tone Gradient */}
        <linearGradient id="skinTone" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFDBAC" />
          <stop offset="100%" stopColor="#F1C27D" />
        </linearGradient>
        {/* Hoodie Gradient */}
        <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3730A3" />
          <stop offset="50%" stopColor="#312E81" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
      </defs>

      {/* Background Soft Backdrop Circle */}
      <circle cx="260" cy="180" r="140" fill="url(#heroGlow)" />

      {/* Desk Base Shadow */}
      <ellipse cx="220" cy="330" rx="180" ry="12" fill="#1E1B4B" opacity="0.3" />

      {/* Body & Hoodie */}
      <g id="student-body">
        {/* Torso / Purple Hoodie */}
        <path
          d="M 130 340 Q 150 210 230 200 Q 280 200 320 250 L 350 340 Z"
          fill="url(#hoodieGrad)"
        />
        
        {/* Hoodie Collar & Drawstrings */}
        <path d="M 210 200 Q 230 230 250 200" fill="none" stroke="#6366F1" strokeWidth="4" strokeLinecap="round" />
        <path d="M 220 220 L 220 250" fill="none" stroke="#C7D2FE" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 240 220 L 240 255" fill="none" stroke="#C7D2FE" strokeWidth="2.5" strokeLinecap="round" />

        {/* Left Arm extended to Laptop Keyboard */}
        <path
          d="M 145 250 Q 180 270 235 275 L 260 278"
          fill="none"
          stroke="#312E81"
          strokeWidth="32"
          strokeLinecap="round"
        />

        {/* Right Arm resting near trackpad */}
        <path
          d="M 295 240 Q 280 270 240 280 L 210 282"
          fill="none"
          stroke="#2E248F"
          strokeWidth="30"
          strokeLinecap="round"
        />

        {/* Hands */}
        <ellipse cx="255" cy="278" rx="14" ry="10" fill="url(#skinTone)" />
        <ellipse cx="215" cy="282" rx="14" ry="10" fill="url(#skinTone)" />
      </g>

      {/* Head & Face Features */}
      <g id="student-head">
        {/* Neck */}
        <rect x="220" y="175" width="22" height="30" rx="8" fill="url(#skinTone)" />

        {/* Head Base */}
        <ellipse cx="232" cy="140" rx="38" ry="46" fill="url(#skinTone)" />

        {/* Ears */}
        <ellipse cx="192" cy="142" rx="7" ry="11" fill="url(#skinTone)" />
        <ellipse cx="272" cy="142" rx="7" ry="11" fill="url(#skinTone)" />

        {/* Dark Modern Hair */}
        <path
          d="M 190 135 C 185 95, 220 75, 250 80 C 275 85, 280 110, 275 130 C 265 105, 240 95, 215 105 C 200 112, 195 125, 190 135 Z"
          fill="#0F172A"
        />
        <path
          d="M 200 115 Q 235 85 268 110 Q 250 90 220 98 Z"
          fill="#1E293B"
        />

        {/* Eyebrows */}
        <path d="M 206 128 Q 216 124 224 128" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 240 128 Q 248 124 258 128" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Eyes (Friendly smile expression) */}
        <ellipse cx="215" cy="138" rx="4" ry="5" fill="#0F172A" />
        <ellipse cx="249" cy="138" rx="4" ry="5" fill="#0F172A" />
        <circle cx="216" cy="136" r="1.5" fill="#FFFFFF" />
        <circle cx="250" cy="136" r="1.5" fill="#FFFFFF" />

        {/* Nose */}
        <path d="M 232 138 L 230 148 L 235 149" fill="none" stroke="#E2A76F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Smile */}
        <path d="M 220 158 Q 232 168 244 158" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Modern Laptop on Desk */}
      <g id="laptop">
        {/* Open Screen Body */}
        <path
          d="M 110 270 L 140 170 L 260 170 L 230 270 Z"
          fill="url(#laptopScreen)"
          stroke="#475569"
          strokeWidth="3"
        />
        {/* Screen Display Glow */}
        <path
          d="M 118 265 L 144 176 L 252 176 L 226 265 Z"
          fill="#312E81"
          opacity="0.8"
        />
        {/* Code / UI Lines on Laptop Screen */}
        <line x1="150" y1="190" x2="210" y2="190" stroke="#818CF8" strokeWidth="3" strokeLinecap="round" />
        <line x1="145" y1="202" x2="230" y2="202" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
        <line x1="140" y1="214" x2="195" y2="214" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
        <line x1="135" y1="226" x2="215" y2="226" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
        <line x1="130" y1="238" x2="180" y2="238" stroke="#818CF8" strokeWidth="3" strokeLinecap="round" />

        {/* Laptop Logo Circle on Back Cover */}
        <circle cx="185" cy="220" r="10" fill="#6366F1" opacity="0.4" />

        {/* Laptop Keyboard Base */}
        <path
          d="M 80 282 L 240 282 L 265 270 L 105 270 Z"
          fill="#0F172A"
          stroke="#334155"
          strokeWidth="2"
        />
        <ellipse cx="170" cy="276" rx="60" ry="4" fill="#1E293B" />
        
        {/* Trackpad */}
        <polygon points="150,278 190,278 188,281 148,281" fill="#334155" />
      </g>
    </svg>
  );
}

export default StudentIllustration;
