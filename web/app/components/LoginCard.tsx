"use client";

import React, { useState } from "react";
import LugicaLogo from "./LugicaLogo";

export default function LoginCard() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSocialClick = (provider: string) => {
    showToast(`Authenticating with ${provider} delivery portal...`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast("Please enter a valid client email address.");
      return;
    }
    showToast(isSignUp ? `Creating tracking account for ${email}...` : `Connecting to live tracking as ${email}...`);
  };

  return (
    <div className="relative w-full max-w-[440px] h-full max-h-[600px] bg-[#131d33]/90 backdrop-blur-xl border border-[#2c426f] rounded-[28px] p-6 sm:p-8 shadow-2xl flex flex-col justify-between transition-all">
      {/* Toast alert */}
      {toastMessage && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1f3054] text-[#EEFABD] text-xs px-4 py-2 rounded-full border border-[#A0D585]/50 shadow-lg flex items-center gap-2 animate-bounce z-50 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-[#A0D585] animate-ping" />
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col justify-center my-auto">
        {/* Top Logo */}
        <div className="flex justify-center mb-6">
          <LugicaLogo />
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-[1.15] text-center mb-1.5">
          {isSignUp ? "Start tracking\nyour shipments." : "Track deliveries\nin real-time."}
        </h1>

        {/* Subtitle */}
        <p className="text-[#a4b6cf] text-xs sm:text-sm text-center mb-6 font-normal">
          {isSignUp ? "Create your client tracking account" : "Sign in to track your live driver location"}
        </p>

        {!showEmailForm ? (
          /* OAuth & Email Options */
          <div className="space-y-3">
            {/* Google button */}
            <button
              onClick={() => handleSocialClick("Google")}
              type="button"
              className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-[#182645] hover:bg-[#21335b] text-white font-medium text-sm rounded-xl border border-[#2c426f] hover:border-[#6984A9] transition-all duration-200 cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              {/* Google SVG Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* GitHub button */}
            <button
              onClick={() => handleSocialClick("GitHub")}
              type="button"
              className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-[#182645] hover:bg-[#21335b] text-white font-medium text-sm rounded-xl border border-[#2c426f] hover:border-[#6984A9] transition-all duration-200 cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              {/* GitHub SVG Icon */}
              <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#2a3e68] w-full" />
              <span className="bg-[#131d33] px-3 text-xs text-[#6984A9] font-medium absolute">
                or
              </span>
            </div>

            {/* Email button */}
            <button
              onClick={() => setShowEmailForm(true)}
              type="button"
              className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-[#182645] hover:bg-[#21335b] text-white font-medium text-sm rounded-xl border border-[#2c426f] hover:border-[#6984A9] transition-all duration-200 cursor-pointer group shadow-sm active:scale-[0.99]"
            >
              {/* Mail SVG Icon */}
              <svg className="w-5 h-5 text-[#A0D585]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Continue with email</span>
            </button>
          </div>
        ) : (
          /* Email Input Form */
          <form onSubmit={handleSubmit} className="space-y-3.5 animate-fadeIn">
            <div>
              <label className="block text-xs font-medium text-[#a4b6cf] mb-1">Client / Business Email</label>
              <input
                type="email"
                required
                placeholder="client@delivery.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#182645] border border-[#2c426f] focus:border-[#A0D585] focus:ring-1 focus:ring-[#A0D585] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#6984A9] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a4b6cf] mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#182645] border border-[#2c426f] focus:border-[#A0D585] focus:ring-1 focus:ring-[#A0D585] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#6984A9] outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#A0D585] hover:bg-[#EEFABD] text-[#121e36] font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#263B6A]/50 active:scale-[0.99] cursor-pointer mt-1"
            >
              {isSignUp ? "Create Tracking Account" : "Access Live Tracking Portal"}
            </button>

            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="w-full text-center text-xs text-[#6984A9] hover:text-[#EEFABD] py-1 transition-colors"
            >
              ← Back to sign-in options
            </button>
          </form>
        )}
      </div>

      {/* Footer link */}
      <div className="pt-3 text-center border-t border-[#2a3e68]/50">
        <p className="text-xs text-[#a4b6cf]">
          {isSignUp ? "Already registered? " : "Don't have a tracking account? "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#A0D585] font-semibold underline hover:text-[#EEFABD] transition-colors cursor-pointer"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
