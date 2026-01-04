"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useConflictResolution, type ConflictInfo } from "@/lib/conflict-resolution";

/**
 * ConflictBadge - Shows pending conflict count
 */
export function ConflictBadge({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors animate-pulse"
      title="Resolve conflicts"
    >
      <span className="text-red-400">⚠️</span>
      <span className="text-sm font-medium text-red-300">
        {count} conflict{count !== 1 ? "s" : ""}
      </span>
    </button>
  );
}

interface ConflictResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (blockId: string, field: string, value: unknown) => void;
}

/**
 * ConflictResolverModal - UI for resolving edit conflicts
 */
export function ConflictResolverModal({ isOpen, onClose, onResolve }: ConflictResolverModalProps) {
  const { conflicts, resolveConflict } = useConflictResolution();
  const [selectedConflict, setSelectedConflict] = useState<ConflictInfo | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (conflicts.length > 0 && !selectedConflict) {
      setSelectedConflict(conflicts[0]);
    }
  }, [conflicts, selectedConflict]);

  const handleResolve = (resolution: "local" | "remote") => {
    if (!selectedConflict) return;

    const value = resolution === "local" ? selectedConflict.localValue : selectedConflict.remoteValue;
    
    // Apply the resolution
    onResolve(selectedConflict.blockId, selectedConflict.field, value);
    
    // Mark as resolved
    resolveConflict(selectedConflict.id, resolution);
    
    // Move to next conflict
    const remaining = conflicts.filter((c) => c.id !== selectedConflict.id);
    if (remaining.length > 0) {
      setSelectedConflict(remaining[0]);
    } else {
      setSelectedConflict(null);
      onClose();
    }
  };

  if (!mounted || !isOpen || conflicts.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[700px] max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-red-500/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h2 className="text-xl font-semibold text-white">Resolve Conflicts</h2>
              <p className="text-sm text-slate-400">
                {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""} need your attention
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conflict list sidebar */}
        <div className="flex">
          <div className="w-48 border-r border-slate-700 bg-slate-800/50">
            <div className="p-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Conflicts
              </h3>
              {conflicts.map((conflict) => (
                <button
                  key={conflict.id}
                  onClick={() => setSelectedConflict(conflict)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                    selectedConflict?.id === conflict.id
                      ? "bg-blue-500/20 text-blue-300"
                      : "text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  <div className="font-medium truncate">{conflict.blockTitle}</div>
                  <div className="text-xs text-slate-500">{conflict.field}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected conflict details */}
          <div className="flex-1 p-6">
            {selectedConflict ? (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {selectedConflict.blockTitle}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Field: <code className="px-1 py-0.5 bg-slate-800 rounded">{selectedConflict.field}</code>
                  </p>
                </div>

                {/* Comparison */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Your version */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                        Your Version
                      </span>
                      <span className="text-xs text-slate-500">
                        {selectedConflict.localUser}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg text-sm text-slate-300 font-mono break-all max-h-40 overflow-auto">
                      {JSON.stringify(selectedConflict.localValue, null, 2)}
                    </div>
                    <button
                      onClick={() => handleResolve("local")}
                      className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Use This Version
                    </button>
                  </div>

                  {/* Remote version */}
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                        Their Version
                      </span>
                      <span className="text-xs text-slate-500">
                        {selectedConflict.remoteUser}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg text-sm text-slate-300 font-mono break-all max-h-40 overflow-auto">
                      {JSON.stringify(selectedConflict.remoteValue, null, 2)}
                    </div>
                    <button
                      onClick={() => handleResolve("remote")}
                      className="w-full mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Use This Version
                    </button>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-slate-500 text-center">
                  <p>
                    Your edit: {new Date(selectedConflict.localTimestamp).toLocaleString()}
                  </p>
                  <p>
                    Their edit: {new Date(selectedConflict.remoteTimestamp).toLocaleString()}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <span className="text-4xl block mb-2">✅</span>
                <p>All conflicts resolved!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


