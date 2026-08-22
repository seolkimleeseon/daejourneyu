"use client";

import { useEffect, type ReactNode } from "react";
import { QueryProvider } from "./QueryProvider";
import { Splash } from "./Splash";
import { ToastViewport } from "@/components/ui/Toast";
import { useAuthStore } from "@/stores/useAuthStore";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().restoreSession();
  }, []);

  return (
    <QueryProvider>
      <Splash />
      {children}
      <ToastViewport />
    </QueryProvider>
  );
}
