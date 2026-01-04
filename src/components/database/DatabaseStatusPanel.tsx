"use client";

import React, { useState } from "react";
import { useDatabaseSync } from "@/lib/use-database-sync";

interface DatabaseStatusPanelProps {
  workspaceId: string;
}

/**
 * DatabaseStatusPanel - Shows database sync status and provides sync controls
 */
export default function DatabaseStatusPanel({ workspaceId }: DatabaseStatusPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    syncState,
    syncToDatabase,
    pullFromDatabase,
  } = useDatabaseSync({
    workspaceId,
    autoSync: true,
    syncInterval: 30000,
  });

  const formatLastSynced = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
          ${syncState.error
            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
            : syncState.isSyncing
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
              : syncState.pendingChanges > 0
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }
        `}
      >
        {/* Status Icon */}
        {syncState.error ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) : syncState.isSyncing ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        )}
        
        <span className="hidden sm:inline">Database</span>
        
        {/* Pending changes badge */}
        {syncState.pendingChanges > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
            {syncState.pendingChanges}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border shadow-xl z-50 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">Database Sync</h3>
                <span className={`
                  px-2 py-0.5 rounded-full text-[10px] font-medium
                  ${syncState.error
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    : syncState.isSyncing
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  }
                `}>
                  {syncState.error ? "Error" : syncState.isSyncing ? "Syncing" : "Connected"}
                </span>
              </div>
              
              {syncState.error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{syncState.error}</p>
              )}
            </div>

            {/* Status */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Last synced</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {formatLastSynced(syncState.lastSynced)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Pending changes</span>
                <span className={`font-medium ${
                  syncState.pendingChanges > 0 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-slate-700 dark:text-slate-300"
                }`}>
                  {syncState.pendingChanges}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Workspace</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono text-xs truncate max-w-[120px]">
                  {workspaceId}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <button
                onClick={syncToDatabase}
                disabled={syncState.isSyncing}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {syncState.isSyncing ? "Syncing..." : "Push to DB"}
              </button>
              
              <button
                onClick={pullFromDatabase}
                disabled={syncState.isSyncing}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Pull from DB
              </button>
            </div>

            {/* Info */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Auto-syncs every 30 seconds when changes are pending. Uses PostgreSQL via Prisma.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


