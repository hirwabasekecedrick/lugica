"use client";

import type { ReactNode } from "react";

/** Shared loading and error states so every surface fails the same way. */

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3">
      <span className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin" />
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-12 text-center bg-page border border-border rounded-2xl p-6">
      <h3 className="text-sm font-bold text-text mb-1">{title}</h3>
      {description && <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "Something went wrong loading this view.";

  return (
    <div className="py-12 text-center bg-page border border-danger/30 rounded-2xl p-6">
      <h3 className="text-sm font-bold text-text mb-1">Could not load</h3>
      <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-accent hover:bg-border text-on-accent text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** Inline banner for mutation errors, e.g. the stock-availability rejection. */
export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
      {message}
    </div>
  );
}
