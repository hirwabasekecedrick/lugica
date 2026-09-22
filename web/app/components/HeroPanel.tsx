"use client";

import React from "react";
import Image from "next/image";

export default function HeroPanel() {
  return (
    <div className="relative w-full h-full max-h-[600px] rounded-[28px] overflow-hidden border border-[#2c426f] shadow-2xl flex flex-col justify-end group">
      {/* Background Hero Image - Real-time Delivery Courier & GPS Map */}
      <Image
        src="/lugica_delivery_hero.png"
        alt="Real-time delivery driver tracking map"
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
      />

      {/* Vignette & Colorhunt Palette Ambient Overlays: #263B6A, #6984A9, #A0D585 */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to top, rgba(19, 29, 51, 0.9) 0%, rgba(38, 59, 106, 0.3) 45%, transparent 100%),
            radial-gradient(circle at 90% 90%, rgba(160, 213, 133, 0.45) 0%, rgba(105, 132, 169, 0.2) 40%, transparent 70%)
          `
        }}
      />

      {/* Overlaid Typography at Bottom - Real-time Delivery context */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 text-right">
        <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] drop-shadow-lg uppercase font-sans">
          Track deliveries
          <br />
          <span className="text-[#EEFABD]">in real-time</span>
        </h2>
      </div>
    </div>
  );
}
