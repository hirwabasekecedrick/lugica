"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api/errors";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Never retry auth or permission failures; retrying a 403 is pointless.
          if (error instanceof ApiError) {
            if (error.status === 401 || error.status === 403 || error.status === 404) {
              return false;
            }
            if (error.status >= 400 && error.status < 500) return false;
          }
          return failureCount < 2;
        },
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Created lazily per browser session so server and client do not share state.
  const [client] = useState(makeQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
