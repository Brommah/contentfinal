"use client";

import React from "react";
import type { SyncStatus } from "@/lib/persistence";

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  onSaveNow?: () => void;
}

/**
 * Visual indicator showing save/sync status
 */
export default function SyncStatusIndicator({
  status,
  onSaveNow,
}: SyncStatusIndicatorProps) {
  const { isSaving, lastSaved, hasUnsavedChanges, error } = status;

  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 5000) return "Just now";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Status indicator dot */}
      <div className="relative">
        <div
          className={`w-2 h-2 rounded-full ${
            error
              ? "bg-red-500"
              : isSaving
              ? "bg-amber-500"
              : hasUnsavedChanges
              ? "bg-amber-400"
              : "bg-emerald-500"
          }`}
        />
        {isSaving && (
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
        )}
      </div>

      {/* Status text */}
      <span
        className={`${
          error
            ? "text-red-400"
            : isSaving
            ? "text-amber-400"
            : "text-gray-400"
        }`}
      >
        {error ? (
          <span className="flex items-center gap-1">
            <span>Error saving</span>
            <button
              onClick={onSaveNow}
              className="underline hover:text-amber-300"
            >
              Retry
            </button>
          </span>
        ) : isSaving ? (
          "Saving..."
        ) : hasUnsavedChanges ? (
          <span className="flex items-center gap-1">
            <span>Unsaved changes</span>
            <button
              onClick={onSaveNow}
              className="underline hover:text-white"
            >
              Save now
            </button>
          </span>
        ) : (
          `Saved ${formatLastSaved(lastSaved)}`
        )}
      </span>

      {/* Manual save button (keyboard shortcut hint) */}
      {!isSaving && !error && (
        <span className="text-gray-600 hidden sm:inline">
          (⌘S)
        </span>
      )}
    </div>
  );
}


