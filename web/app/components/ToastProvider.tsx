"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Toast notifications.
 *
 * Deliberately dependency-free rather than pulling in a library: the app needs
 * four variants and a fixed-position stack, which is a few dozen lines. Mounted
 * once in the root layout, so any surface can raise a toast without prop
 * drilling.
 */

export type ToastVariant = "success" | "error" | "info" | "warning";

export type Toast = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  /** ms; 0 keeps the toast until dismissed. */
  duration: number;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => number;
  success: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  warning: (title: string, description?: string) => number;
  info: (title: string, description?: string) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;
/** Errors linger longer, since they usually need reading. */
const ERROR_DURATION = 7000;
/** Cap the stack so a burst of errors cannot fill the screen. */
const MAX_VISIBLE = 4;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    // Animate out, then drop from state.
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "info", duration }: ToastInput): number => {
      const id = nextId.current++;
      const ms = duration ?? (variant === "error" ? ERROR_DURATION : DEFAULT_DURATION);

      setToasts((prev) => [...prev, { id, title, description, variant, duration: ms }].slice(-MAX_VISIBLE));

      if (ms > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), ms),
        );
      }

      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      success: (title, description) => toast({ title, description, variant: "success" }),
      error: (title, description) => toast({ title, description, variant: "error" }),
      warning: (title, description) => toast({ title, description, variant: "warning" }),
      info: (title, description) => toast({ title, description, variant: "info" }),
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return context;
}

const VARIANTS: Record<
  ToastVariant,
  { ring: string; icon: string; bar: string; iconPath: ReactNode }
> = {
  success: {
    ring: "border-[#A0D585]/40",
    icon: "bg-[#A0D585]/15 text-[#A0D585]",
    bar: "bg-[#A0D585]",
    iconPath: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    ),
  },
  error: {
    ring: "border-rose-400/40",
    icon: "bg-rose-500/15 text-rose-300",
    bar: "bg-rose-500",
    iconPath: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </>
    ),
  },
  warning: {
    ring: "border-amber-400/40",
    icon: "bg-amber-400/15 text-amber-300",
    bar: "bg-amber-400",
    iconPath: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </>
    ),
  },
  info: {
    ring: "border-[#6984A9]/40",
    icon: "bg-[#6984A9]/15 text-[#EEFABD]",
    bar: "bg-[#6984A9]",
    iconPath: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    // Above drawers (z-50) so a toast is never hidden behind one.
    <div
      role="region"
      aria-label="Notifications"
      className="fixed z-[100] top-4 right-4 left-4 sm:left-auto sm:w-[380px] flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((t) => {
        const variant = VARIANTS[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 rounded-xl border ${variant.ring} bg-[#131e36]/95 backdrop-blur-xl shadow-2xl shadow-black/40 py-3 pl-3.5 pr-10 animate-slideDown`}
          >
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${variant.icon}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {variant.iconPath}
              </svg>
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13px] font-semibold text-white leading-snug">{t.title}</p>
              {t.description && (
                <p className="text-[11px] text-[#6984A9] leading-relaxed mt-0.5 break-words">
                  {t.description}
                </p>
              )}
            </div>

            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="absolute top-2.5 right-2.5 p-1 rounded-md text-[#6984A9] hover:text-white hover:bg-[#263B6A]/60 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Progress bar doubles as the "time left" cue. */}
            {t.duration > 0 && (
              <span
                className={`absolute bottom-0 left-0 h-0.5 ${variant.bar} rounded-full`}
                style={{ animation: `toast-progress ${t.duration}ms linear forwards` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
