"use client";

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import type { VersionSnapshot } from "@/lib/version-control";
import type { BlockData } from "@/lib/types";
import { BLOCK_CONFIGS, COMPANY_COLORS } from "@/lib/types";
import VisualDiff from "./VisualDiff";

interface RollbackPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  currentSnapshot: VersionSnapshot;
  targetSnapshot: VersionSnapshot;
  onConfirm: () => void;
  isRestoring: boolean;
}

/**
 * RollbackPreview - Preview what will change when rolling back to a previous version
 */
export default function RollbackPreview({
  isOpen,
  onClose,
  currentSnapshot,
  targetSnapshot,
  onConfirm,
  isRestoring,
}: RollbackPreviewProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"diff" | "preview">("diff");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate what will change
  const changes = useMemo(() => {
    const currentMap = new Map(
      currentSnapshot.nodes.map((n) => [n.id, n.data as BlockData])
    );
    const targetMap = new Map(
      targetSnapshot.nodes.map((n) => [n.id, n.data as BlockData])
    );

    const willLose: BlockData[] = [];
    const willRestore: BlockData[] = [];
    const willChange: Array<{ old: BlockData; new: BlockData }> = [];

    // Blocks that will be lost (exist in current but not in target)
    for (const [id, data] of currentMap) {
      if (!targetMap.has(id)) {
        willLose.push(data);
      }
    }

    // Blocks that will be restored (exist in target but not in current)
    for (const [id, data] of targetMap) {
      if (!currentMap.has(id)) {
        willRestore.push(data);
      } else {
        // Check for content differences
        const current = currentMap.get(id)!;
        if (
          current.title !== data.title ||
          current.content !== data.content ||
          current.status !== data.status
        ) {
          willChange.push({ old: current, new: data });
        }
      }
    }

    return { willLose, willRestore, willChange };
  }, [currentSnapshot, targetSnapshot]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[900px] max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span>⏪</span>
              Rollback Preview
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Rolling back from <strong className="text-white">{currentSnapshot.label}</strong> to{" "}
              <strong className="text-blue-400">{targetSnapshot.label}</strong>
            </p>
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

        {/* Warning banner */}
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-300">
                This action will modify your current content
              </p>
              <p className="text-xs text-amber-400/70">
                A backup snapshot of your current state will be created automatically
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          <button
            onClick={() => setActiveTab("diff")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "diff"
                ? "bg-blue-500/20 text-blue-300"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            📊 Changes Overview
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "preview"
                ? "bg-blue-500/20 text-blue-300"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            👁️ Preview Target
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {activeTab === "diff" ? (
            <VisualDiff oldSnapshot={currentSnapshot} newSnapshot={targetSnapshot} />
          ) : (
            <div className="space-y-4">
              {/* Target state preview */}
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Content after rollback ({targetSnapshot.nodes.length} blocks)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {targetSnapshot.nodes.slice(0, 15).map((node) => {
                  const data = node.data as BlockData;
                  const config = BLOCK_CONFIGS[data.type];
                  return (
                    <div
                      key={node.id}
                      className="p-3 bg-slate-800 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span>{config?.icon || "📄"}</span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: COMPANY_COLORS[data.company]?.primary }}
                        />
                      </div>
                      <h4 className="text-sm font-medium text-white truncate">
                        {data.title}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {config?.label || data.type}
                      </p>
                    </div>
                  );
                })}
                {targetSnapshot.nodes.length > 15 && (
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-center text-slate-500 text-sm">
                    +{targetSnapshot.nodes.length - 15} more blocks
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700/50">
          <div className="flex items-center gap-6">
            {changes.willLose.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-slate-300">
                  <strong className="text-red-400">{changes.willLose.length}</strong> blocks will be removed
                </span>
              </div>
            )}
            {changes.willRestore.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-slate-300">
                  <strong className="text-green-400">{changes.willRestore.length}</strong> blocks will be restored
                </span>
              </div>
            )}
            {changes.willChange.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-slate-300">
                  <strong className="text-amber-400">{changes.willChange.length}</strong> blocks will revert to older content
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRestoring}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isRestoring ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Restoring...
              </>
            ) : (
              <>
                ⏪ Confirm Rollback
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

