import React from "react";
import StarfieldBackground from "../components/StarfieldBackground";
import LoginCard from "../components/LoginCard";
import HeroPanel from "../components/HeroPanel";

export const metadata = {
  title: "Lugica Delivery | Real-Time Live Delivery Tracking",
  description: "Sign in to Lugica Delivery to track your couriers and shipments live on an interactive GPS map in real time.",
};

export default function LoginPage() {
  return (
    <main className="relative h-screen w-full max-h-screen bg-[#05060a] text-white flex items-center justify-center p-3 sm:p-5 lg:p-8 overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* Animated Moving Starfield Canvas & Ambient Glows */}
      <StarfieldBackground />

      {/* Main Content Container - Fits available screen height strictly */}
      <div className="relative z-10 w-full max-w-5xl h-full max-h-[620px] grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-stretch my-auto">
        {/* Left Side: Login Form Card */}
        <div className="flex items-center justify-center h-full">
          <LoginCard />
        </div>

        {/* Right Side: Hero Visual Panel */}
        <div className="hidden lg:block w-full h-full">
          <HeroPanel />
        </div>
      </div>
    </main>
  );
}
