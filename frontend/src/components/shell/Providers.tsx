"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./QueryProvider";
import { Splash } from "./Splash";
import { AuthHydrator } from "./AuthHydrator";
import { ToastViewport } from "@/components/ui/Toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <Splash />
      <AuthHydrator />
      {children}
      <ToastViewport />
    </QueryProvider>
  );
}
