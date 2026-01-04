"use client";

import React, { ReactNode } from "react";
import TabNavigation, { type TabType } from "./TabNavigation";
import SyncStatusIndicator from "./SyncStatusIndicator";
import type { SyncStatus } from "@/lib/persistence";
import { ThemeToggle } from "@/lib/theme";
import { PageTransition } from "@/components/ui";

interface DashboardLayoutProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  workspaceName: string;
  blockCount?: number;
  children: ReactNode;
  syncStatus?: SyncStatus;
  onSaveNow?: () => void;
  extraToolbar?: ReactNode;
}

/**
 * DashboardLayout - Main layout wrapper with refined navigation
 */
export default function DashboardLayout({
  activeTab,
  onTabChange,
  workspaceName,
  children,
  syncStatus,
  onSaveNow,
  extraToolbar,
}: DashboardLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/50 relative z-50">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo - Clickable to go Home */}
          <div className="flex items-center gap-6" data-tour="logo">
            <button
              onClick={() => onTabChange("home")}
              className="flex items-center gap-3 group"
              title="Go to Home"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 group-hover:scale-105 transition-all duration-200">
                C
              </div>
              <div>
                <h1 className="font-semibold text-slate-900 dark:text-white text-sm tracking-wide group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
                  {workspaceName}
                </h1>
              </div>
            </button>

            {/* Sync status */}
            {syncStatus && (
              <div data-tour="sync-status" className="opacity-70 hover:opacity-100 transition-opacity">
                <SyncStatusIndicator status={syncStatus} onSaveNow={onSaveNow} />
              </div>
            )}
          </div>

          {/* Tab Navigation - centered */}
          <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />

          {/* Right side: Theme toggle + Extra toolbar */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {extraToolbar}
          </div>
        </div>
      </header>

      {/* Main content with page transitions */}
      <PageTransition
        pageKey={activeTab}
        type="fade"
        duration={150}
        className="flex-1 overflow-hidden flex flex-col"
      >
        {children}
      </PageTransition>
    </div>
  );
}
