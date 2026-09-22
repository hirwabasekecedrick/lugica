import React from "react";
import StarfieldBackground from "../components/StarfieldBackground";
import LoginCard from "../components/LoginCard";
import HeroPanel from "../components/HeroPanel";

export const metadata = {
  title: "Leadpages Login | Build pages that convert",
  description: "Sign in to Leadpages to build high-converting landing pages and lead generation campaigns.",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full bg-[#05060a] text-white flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* Animated Moving Starfield Canvas & Ambient Glows */}
      <StarfieldBackground />

      {/* Main Content Container - 2 Column Layout matching reference */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
        {/* Left Side: Login Form Card */}
        <div className="flex items-center justify-center">
          <LoginCard />
        </div>

        {/* Right Side: Hero Visual Panel */}
        <div className="hidden lg:block w-full">
          <HeroPanel />
        </div>
      </div>
    </main>
  );
}
