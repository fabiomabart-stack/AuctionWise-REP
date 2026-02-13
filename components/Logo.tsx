
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* House Roof */}
        <path
          d="M10 45L50 10L90 45"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Bar Chart representing house walls and analysis */}
        <rect
          x="25"
          y="55"
          width="12"
          height="30"
          rx="2"
          fill="currentColor"
          className="text-blue-400"
        />
        <rect
          x="44"
          y="40"
          width="12"
          height="45"
          rx="2"
          fill="currentColor"
          className="text-blue-600"
        />
        <rect
          x="63"
          y="25"
          width="12"
          height="60"
          rx="2"
          fill="currentColor"
          className="text-blue-500"
        />
        
        {/* Analysis Circle / Wise Eye */}
        <circle
          cx="75"
          cy="75"
          r="12"
          stroke="currentColor"
          strokeWidth="4"
          className="text-slate-400"
        />
        <path
          d="M75 70V75L78 78"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-slate-400"
        />
      </svg>
    </div>
  );
};
