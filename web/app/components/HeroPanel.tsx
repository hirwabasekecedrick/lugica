"use client";

import React from "react";
import Image from "next/image";

export default function HeroPanel() {
  return (
    <div className="relative w-full h-full max-h-[600px] rounded-[28px] overflow-hidden border border-[#23283a] shadow-2xl flex flex-col justify-end group">
      {/* Background Delivery Hero Image */}
      <Image
        src="/lugica_delivery_hero.png"
        alt="Track deliveries in real time with Lugica"
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
      />

      {/* Subtle Dark Vignette & Emerald Accent Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to top, rgba(12, 14, 20, 0.85) 0%, rgba(12, 14, 20, 0.25) 45%, transparent 100%),
            radial-gradient(circle at 90% 90%, rgba(34, 197, 94, 0.4) 0%, rgba(22, 163, 74, 0.15) 35%, transparent 65%)
          `
        }}
      />

      {/* Overlaid Typography at Bottom */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 text-right">
        <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] drop-shadow-lg uppercase font-sans">
          Track deliveries
          <br />
          in real time
        </h2>
      </div>
    </div>
  );
}
