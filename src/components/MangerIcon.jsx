import React from 'react';

const MangerIcon = ({ size = 64, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Radiant Background Glow */}
      <circle cx="12" cy="14" r="8" fill="url(#haloGlow)" opacity="0.4" />

      {/* Star of Bethlehem */}
      <path 
        d="M12 2L13.2 6.5L18 7.5L13.2 8.5L12 13L10.8 8.5L6 7.5L10.8 6.5L12 2Z" 
        fill="#e8c84b"
      >
        <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
      </path>

      {/* Wooden Manger (Stable & Clear) */}
      <path 
        d="M4 14C4 14 5 19.5 12 19.5C19 19.5 20 14 20 14H4Z" 
        fill="#5d3a1a" 
      />
      <path 
        d="M6 19.5L4 22M18 19.5L20 22" 
        stroke="#5d3a1a" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />

      {/* Straw / Hay (More visible) */}
      <g stroke="#e8c84b" strokeWidth="0.8" strokeLinecap="round" opacity="0.9">
        <path d="M7 14L6 11.5M9 14.5L8.5 11M11 15L11 12M13 15L14 12M15 14.5L16.5 11.5M18 14L19.5 12.5" />
      </g>

      {/* Swaddled Baby Jesus (Highly Iconic) */}
      <g>
        {/* Swaddling Clothes (White/Cream Wrap) */}
        <path 
          d="M8.5 15C8.5 13.5 10 12.5 12 12.5C14 12.5 15.5 13.5 15.5 15C15.5 16.5 14 17.5 12 17.5C10 17.5 8.5 16.5 8.5 15Z" 
          fill="#FFFFFF" 
          stroke="#f0e0d0"
          strokeWidth="0.2"
        />
        <path d="M10 13.5C11 14 13 14 14 13.5M9.5 15.5C11 16.5 13 16.5 14.5 15.5" stroke="#e0d0c0" strokeWidth="0.4" opacity="0.5" />
        
        {/* Face (Centered and clearer) */}
        <circle cx="13.2" cy="14.5" r="2.2" fill="#ffd1ba" />
        
        {/* Sleeping Eyes (Tiny dots) */}
        <circle cx="12.5" cy="14.5" r="0.3" fill="#5d3a1a" opacity="0.4" />
        <circle cx="13.9" cy="14.5" r="0.3" fill="#5d3a1a" opacity="0.4" />
        
        {/* Iconic Halo (Golden Ring) */}
        <circle 
          cx="13.2" 
          cy="14.5" 
          r="3.5" 
          stroke="#e8c84b" 
          strokeWidth="0.5" 
          strokeDasharray="1 1"
        />
      </g>

      <defs>
        <radialGradient id="haloGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(13.2 14.5) rotate(90) scale(7)">
          <stop stopColor="#e8c84b" stopOpacity="0.8" />
          <stop offset="1" stopColor="#e8c84b" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export default MangerIcon;
