"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LugicaLogo from "./LugicaLogo";
import { useToast } from "./ToastProvider";
import { useLogin, useRegister } from "@/lib/api/hooks";
import { ApiError } from "@/lib/api/errors";

type Mode = "signin" | "signup";

/** Turn an API rejection into a sentence worth reading. */
function friendlyError(err: unknown, context: "login" | "register"): string {
  if (!(err instanceof ApiError)) return (err as Error).message;

  // The BFF's own 502 means the API could not be reached at all. Say so,
  // rather than blaming the user's credentials or asking them to retry.
  if (err.message === "API unreachable") {
    return "Cannot reach the Lugica API. Make sure it is running on port 8080.";
  }

  // Validation issues arrive as ["path: message", ...]; show the first.
  const fieldIssue = Object.entries(err.fieldErrors).find(([field]) => field !== "_form");
  if (fieldIssue) return fieldIssue[1];
  if (err.fieldErrors._form) return err.fieldErrors._form;

  if (err.status === 401) return "Invalid email or password.";
  if (err.status === 403) return "Your account is inactive. Contact an administrator.";
  if (err.message === "Email already registered") {
    return "That email is already registered. Try signing in instead.";
  }
  if (err.status === 429) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (err.status >= 500) {
    return `The server returned an error (${err.status}). ${err.message}`;
  }

  return err.message || (context === "login" ? "Sign-in failed." : "Sign-up failed.");
}

/**
 * Real authentication against the BFF.
 *
 * `POST /auth/register` returns only the created user and no tokens
 * (auth.service.ts:36), so signup registers and then logs in. The API rejects
 * passwords under 8 characters, which is mirrored here so the user is told
 * before a round trip.
 */
export default function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const toast = useToast();

  const login = useLogin();
  const register = useRegister();

  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const busy = login.isPending || register.isPending;

  function destination(role?: string | null): string {
    // Only allow same-origin paths, so ?next= cannot become an open redirect.
    if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
      return nextPath;
    }
// Each role gets the surface it actually works in. SHOP_MANAGER lands on the
    // store deliberately: there is no warehouse page it is allowed to see.
    if (role === "ADMIN") return "/inventory";
    if (role === "DRIVER") return "/driver";
    return "/shop";
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();

    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (data) => {
          toast.success("Welcome back", "You are signed in.");
          router.push(destination(data.role));
        },
        onError: (err) => {
          // A downed API is not the user's fault, so say what is wrong rather
          // than implying they mistyped something.
          if (err instanceof ApiError && err.message === "API unreachable") {
            toast.error("Server unreachable", friendlyError(err, "login"));
            return;
          }
          toast.error("Sign-in failed", friendlyError(err, "login"));
        },
      },
    );
  }

  function handleStepOne(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.warning("Name required", "Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      toast.warning("Phone required", "Please enter your telephone number.");
      return;
    }
    if (!email.trim()) {
      toast.warning("Email required", "Please enter your email address.");
      return;
    }

    setStep(2);
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.warning("Email required", "Please enter your email address.");
      return;
    }
    if (password.length < 8) {
      toast.warning("Password too short", "Use at least 8 characters.");
      return;
    }

    register.mutate(
      { email: email.trim(), password, name: name.trim(), phone: phone.trim() },
      {
        onSuccess: () => {
          // Register returns no tokens, so sign in immediately afterwards.
          toast.info("Account created", "Signing you in…");
          login.mutate(
            { email: email.trim(), password },
            {
              onSuccess: (data) => {
                toast.success("Account created", "You are now signed in.");
                router.push(destination(data.role));
              },
              onError: (err) => {
                toast.success("Account created", "But sign-in failed.");
                toast.error(
                  "Could not sign in automatically",
                  `${friendlyError(err, "login")} Please sign in manually.`,
                );
                setMode("signin");
              },
            },
          );
        },
        onError: (err) => {
          if (err instanceof ApiError && err.message === "API unreachable") {
            toast.error("Server unreachable", friendlyError(err, "register"));
            return;
          }
          toast.error("Sign-up failed", friendlyError(err, "register"));
        },
      },
    );
  }

  const inputClass =
    "w-full bg-surface border border-border focus:border-text-accent focus:ring-1 focus:ring-text-accent rounded-xl px-4 py-2.5 text-text text-sm placeholder-text-muted outline-none transition-all";
  const labelClass = "block text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5";

  return (
    <div className="relative w-full max-w-[440px] bg-surface/90 backdrop-blur-xl border border-border rounded-[28px] p-6 sm:p-8 shadow-2xl flex flex-col justify-between my-auto">
      <div className="flex flex-col justify-center my-auto">
        <div className="flex justify-center mb-4">
          <LugicaLogo />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight leading-[1.15] text-center mb-1">
          {mode === "signup" ? (
            <>
              Start tracking
              <br />
              your shipments.
            </>
          ) : (
            <>
              Track deliveries
              <br />
              in real-time.
            </>
          )}
        </h1>

        <p className="text-text-muted text-xs sm:text-sm text-center mb-4 font-normal">
          {mode === "signup"
            ? step === 1
              ? "Step 1 of 2: Personal Details"
              : "Step 2 of 2: Account Security"
            : "Sign in to track your live driver location"}
        </p>

        {mode === "signup" && (
          <div className="flex items-center gap-1.5 justify-center mb-4">
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 1 ? "w-8 bg-accent" : "w-2 bg-sunken"
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 2 ? "w-8 bg-accent" : "w-2 bg-sunken"
              }`}
            />
          </div>
        )}

        {mode === "signup" && step === 1 && (
          <form onSubmit={handleStepOne} className="space-y-3">
            <div>
              <label htmlFor="name" className={labelClass}>
                Full name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={inputClass}
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Telephone
              </label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250 78X XXX XXX"
                className={inputClass}
                autoComplete="tel"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className={labelClass}>
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@delivery.com"
                className={inputClass}
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-accent hover:bg-border text-on-accent font-bold text-xs rounded-xl transition-colors cursor-pointer mt-2"
            >
              Continue
            </button>
          </form>
        )}

        {mode === "signup" && step === 2 && (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="rounded-lg bg-surface/60 border border-border px-3 py-2 text-[11px] text-text-muted">
              Signing up as <span className="text-text font-semibold">{name}</span>
              <span className="block text-text-muted">{email}</span>
            </div>
            <div>
              <label htmlFor="signup-password" className={labelClass}>
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-surface hover:bg-sunken text-text font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 py-3 bg-accent hover:bg-border text-on-accent font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create account"}
              </button>
            </div>
          </form>
        )}

        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@delivery.com"
                className={inputClass}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 bg-accent hover:bg-border text-on-accent font-bold text-xs rounded-xl transition-colors cursor-pointer mt-2 disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setStep(1);
          }}
          className="mt-5 w-full text-center text-xs text-text-muted hover:text-text transition-colors cursor-pointer"
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
