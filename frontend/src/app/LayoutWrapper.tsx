// FILE: src/app/LayoutWrapper.tsx
"use client";

import { VerticalContextProvider } from "@/components/VerticalContextProvider";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <VerticalContextProvider>
      {children}
    </VerticalContextProvider>
  );
}
