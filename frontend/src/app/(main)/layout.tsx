"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { VerticalContextProvider, FullVerticalConfig } from "@/components/VerticalContextProvider";
import { config as coreConfig } from "@verticals/core";
import { PageTitleProvider } from "@/context/PageTitleContext";
import ChatIcon from "@/components/ChatIcon";
import { DateProvider } from '@/context/DateContext';
import React from "react";
import { cn } from "@/lib/utils";

const verticalConfig: FullVerticalConfig = {
  name: 'core',
  config: coreConfig,
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <PageTitleProvider>
      <DateProvider>
        <VerticalContextProvider verticalConfig={verticalConfig}>
          <div className="flex h-screen bg-background">
            <Sidebar isCollapsed={isCollapsed} setCollapsed={setIsCollapsed} />
            <div className={cn("flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out", isCollapsed ? "lg:ml-[80px]" : "lg:ml-[256px]")}>
              <Header />
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
                {children}
              </main>
            </div>
            <ChatIcon />
          </div>
        </VerticalContextProvider>
      </DateProvider>
    </PageTitleProvider>
  );
}