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
      {/* Golden Glow / Star */}
      <circle cx="12" cy="6" r="4" fill="url(#starGlow)" opacity="0.3" />
      <path 
        d="M12 2L13.5 5.5H17L14.25 7.5L15.5 11L12 9L8.5 11L9.75 7.5L7 5.5H10.5L12 2Z" 
        fill="#e8c84b"
      />
      
      {/* Manger (Culla) */}
      <path 
        d="M4 14C4 14 5 19 12 19C19 19 20 14 20 14" 
        stroke="#8B4513" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M6 21L8 19M18 21L16 19" 
        stroke="#8B4513" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      
      {/* Straw/Hay */}
      <path d="M7 15L8 14M10 16L11 14M13 16L14 14M16 15L17 14" stroke="#E8C84B" strokeWidth="0.5" />

      {/* Baby Jesus */}
      <g>
        {/* Swaddling Clothes */}
        <ellipse cx="12" cy="15" rx="4" ry="2.5" fill="#fef5e8" />
        <path d="M9 15C9 15 10 16.5 12 16.5C14 16.5 15 15 15 15" stroke="#E0C9A8" strokeWidth="0.5" />
        
        {/* Head */}
        <circle cx="14" cy="14.5" r="1.5" fill="#FFE4C4" />
        
        {/* Halo / Soft Glow */}
        <circle cx="14" cy="14.5" r="2.5" stroke="#e8c84b" strokeWidth="0.2" opacity="0.5" />
      </g>

      <defs>
        <radialGradient id="starGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12 6) rotate(90) scale(4)">
          <stop stopColor="#e8c84b" />
          <stop offset="1" stopColor="#e8c84b" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export default MangerIcon;
