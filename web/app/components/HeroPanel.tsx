"use client";

import React from "react";
import Image from "next/image";

export default function HeroPanel() {
  return (
    <div className="relative w-full h-full min-h-[520px] lg:min-h-[580px] rounded-[28px] overflow-hidden border border-[#23283a] shadow-2xl flex flex-col justify-end group">
      {/* Background Hero Image */}
      <Image
        src="/leadpages_hero_vinyl.png"
        alt="Build pages that convert"
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
            linear-gradient(to top, rgba(12, 14, 20, 0.75) 0%, rgba(12, 14, 20, 0.2) 40%, transparent 100%),
            radial-gradient(circle at 90% 90%, rgba(34, 197, 94, 0.35) 0%, rgba(22, 163, 74, 0.15) 30%, transparent 60%)
          `
        }}
      />

      {/* Overlaid Typography at Bottom */}
      <div className="relative z-10 p-8 sm:p-10 text-right">
        <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] drop-shadow-lg uppercase font-sans">
          Build pages
          <br />
          that convert
        </h2>
      </div>
    </div>
  );
}
