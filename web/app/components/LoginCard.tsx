"use client";

import React, { useState } from "react";
import LugicaLogo from "./LugicaLogo";

export default function LoginCard() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpStep, setSignUpStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [telephone, setTelephone] = useState("");
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

  const handleToggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setSignUpStep(1);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast("Please enter your full name.");
      return;
    }
    if (!telephone.trim()) {
      showToast("Please enter your telephone number.");
      return;
    }
    setSignUpStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUp) {
      if (!email) {
        showToast("Please enter a valid client email address.");
        return;
      }
      showToast(`Connecting to live tracking as ${email}...`);
      return;
    }

    // Sign up step 2 submission
    if (!email) {
      showToast("Please enter a valid client email address.");
      return;
    }
    if (!password) {
      showToast("Please enter a password.");
      return;
    }
    showToast(`Creating tracking account for ${fullName} (${email})...`);
  };

  return (
    <div className="relative w-full max-w-[440px] h-full max-h-[600px] bg-[#131d33]/90 backdrop-blur-xl border border-[#2c426f] rounded-[28px] p-6 sm:p-8 shadow-2xl flex flex-col justify-between transition-all">

      {toastMessage && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1f3054] text-[#EEFABD] text-xs px-4 py-2 rounded-full border border-[#A0D585]/50 shadow-lg flex items-center gap-2 animate-bounce z-50 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-[#A0D585] animate-ping" />
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col justify-center my-auto">

        <div className="flex justify-center mb-4">
          <LugicaLogo />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-[1.15] text-center mb-1">
          {isSignUp ? "Start tracking\nyour shipments." : "Track deliveries\nin real-time."}
        </h1>

        <p className="text-[#a4b6cf] text-xs sm:text-sm text-center mb-4 font-normal">
          {isSignUp
            ? signUpStep === 1
              ? "Step 1 of 2: Personal Details"
              : "Step 2 of 2: Account Security"
            : "Sign in to track your live driver location"}
        </p>

        {isSignUp && (
          <div className="flex items-center gap-1.5 justify-center mb-4">
            <span className={`h-1.5 rounded-full transition-all duration-300 ${signUpStep === 1 ? "w-8 bg-[#A0D585]" : "w-2 bg-[#2c426f]"}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${signUpStep === 2 ? "w-8 bg-[#A0D585]" : "w-2 bg-[#2c426f]"}`} />
          </div>
        )}

        {/* Form rendering depending on login / signup step */}
        {isSignUp && signUpStep === 1 ? (
          <form onSubmit={handleNextStep} autoComplete="off" autoCorrect="off" autoCapitalize="off" className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#a4b6cf] mb-1">Full Name</label>
              <input
                type="text"
                required
                autoComplete="name"
                spellCheck={false}
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#182645] border border-[#2c426f] focus:border-[#A0D585] focus:ring-1 focus:ring-[#A0D585] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#6984A9] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a4b6cf] mb-1">Telephone Number</label>
              <input
                type="tel"
                required
                autoComplete="tel"
                spellCheck={false}
                placeholder="+1 (555) 000-0000"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full bg-[#182645] border border-[#2c426f] focus:border-[#A0D585] focus:ring-1 focus:ring-[#A0D585] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#6984A9] outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#A0D585] hover:bg-[#EEFABD] text-[#121e36] font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#263B6A]/50 active:scale-[0.99] cursor-pointer mt-1"
            >
              Next
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" autoCorrect="off" autoCapitalize="off" className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#a4b6cf] mb-1">Client / Business Email</label>
              <input
                type="email"
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
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
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#182645] border border-[#2c426f] focus:border-[#A0D585] focus:ring-1 focus:ring-[#A0D585] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#6984A9] outline-none transition-all"
              />
            </div>

            {isSignUp ? (
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setSignUpStep(1)}
                  className="py-3 px-4 bg-[#182645] hover:bg-[#21335b] border border-[#2c426f] text-white font-medium text-sm rounded-xl transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-[#A0D585] hover:bg-[#EEFABD] text-[#121e36] font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#263B6A]/50 active:scale-[0.99] cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#A0D585] hover:bg-[#EEFABD] text-[#121e36] font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#263B6A]/50 active:scale-[0.99] cursor-pointer mt-1"
              >
                Sign in
              </button>
            )}
          </form>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[#2a3e68] w-full" />
          <span className="bg-[#131d33] px-3 text-xs text-[#6984A9] font-medium absolute">
            or
          </span>
        </div>

        {/* Continue with Google button placed below form */}
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
      </div>

      {/* Footer link */}
      <div className="pt-3 text-center border-t border-[#2a3e68]/50">
        <p className="text-xs text-[#a4b6cf]">
          {isSignUp ? "Already registered? " : "Don't have a tracking account? "}
          <button
            type="button"
            onClick={handleToggleSignUp}
            className="text-[#A0D585] font-semibold underline hover:text-[#EEFABD] transition-colors cursor-pointer"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}

