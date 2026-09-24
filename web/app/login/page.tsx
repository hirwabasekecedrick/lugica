import React from "react";
import StarfieldBackground from "../components/StarfieldBackground";
import LoginCard from "../components/LoginCard";
import HeroPanel from "../components/HeroPanel";

export const metadata = {
  title: "Lugica Delivery Express | Real-Time Driver & Parcel Tracking",
  description: "Sign in to Lugica Delivery client portal to track your driver's real-time location, ETA, and live shipment updates.",
};

export default function LoginPage() {
  return (
    <main className="relative h-screen w-full bg-[#0b1324] text-white flex items-center justify-center p-3 sm:p-5 lg:p-6 overflow-hidden selection:bg-[#A0D585] selection:text-[#121e36]">
      {/* Animated Moving Starfield Canvas & Ambient Glows */}
      <StarfieldBackground />

      {/* Main Content Container - 50/50 split filling height */}
      <div className="relative z-10 w-full max-w-[1440px] h-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-stretch my-auto">
        {/* Left Side: Centered Client Login Form Card */}
        <div className="flex items-center justify-center h-full w-full">
          <LoginCard />
        </div>

        {/* Right Side: Full Height Hero Visual Panel (50% screen) */}
        <div className="hidden lg:flex w-full h-full items-center justify-center">
          <HeroPanel />
        </div>
      </div>
    </main>
  );
}

