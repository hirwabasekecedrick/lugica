"use client";

import React from "react";

export default function LeadpagesLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Leadpages Brand Icon */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]"
        >
          {/* Main green overlapping rounded squares/rectangles */}
          <rect
            x="4"
            y="12"
            width="16"
            height="16"
            rx="4.5"
            fill="#22C55E"
          />
          <rect
            x="14"
            y="6"
            width="16"
            height="16"
            rx="4.5"
            fill="#16A34A"
          />
          <rect
            x="14"
            y="14"
            width="8"
            height="8"
            rx="2"
            fill="#4ADE80"
          />
        </svg>
      </div>

      {/* Brand Name */}
      <span className="text-white font-bold text-xl tracking-tight font-sans">
        Leadpages<span className="text-[10px] align-top text-gray-400 font-normal ml-0.5">®</span>
      </span>
    </div>
  );
}
