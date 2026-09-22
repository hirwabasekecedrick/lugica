"use client";

import React from "react";

export default function LugicaLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Lugica Express Delivery Icon */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(160,213,133,0.45)]"
        >
          {/* Outer delivery route node */}
          <rect
            x="4"
            y="12"
            width="16"
            height="16"
            rx="4.5"
            fill="#A0D585"
          />
          <rect
            x="14"
            y="6"
            width="16"
            height="16"
            rx="4.5"
            fill="#6984A9"
          />
          {/* Inner GPS marker point */}
          <circle
            cx="18"
            cy="18"
            r="4"
            fill="#EEFABD"
          />
        </svg>
      </div>

      {/* Brand Name with Delivery Tag */}
      <div className="flex flex-col leading-none">
        <span className="text-white font-bold text-xl tracking-tight font-sans flex items-center gap-1">
          Lugica<span className="text-[10px] align-top text-[#A0D585] font-semibold">®</span>
        </span>
        <span className="text-[9px] uppercase tracking-widest text-[#6984A9] font-bold mt-0.5">
          Delivery Express
        </span>
      </div>
    </div>
  );
}
