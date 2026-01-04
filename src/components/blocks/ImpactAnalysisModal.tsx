"use client";

import React from "react";
import { createPortal } from "react-dom";
import type { BlockUsage } from "@/lib/types";

interface ImpactAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  blockTitle: string;
  usage: BlockUsage;
  actionLabel?: string;
}

/**
 * Modal that shows impact analysis before making changes to a block
 * that is used in multiple places (wireframe sections, roadmap items, etc.)
 */
export function ImpactAnalysisModal({
  isOpen,
  onClose,
  onConfirm,
  blockTitle,
  usage,
  actionLabel = "Save Changes",
}: ImpactAnalysisModalProps) {
  if (!isOpen) return null;

  const hasImpact = usage.totalUsages > 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Impact Analysis</h2>
            <p className="text-sm text-slate-400">
              Review changes to &ldquo;{blockTitle}&rdquo;
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
          {!hasImpact ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✓</div>
              <p className="text-slate-300">
                This block is not linked anywhere. Changes won&apos;t affect other content.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                <p className="text-amber-200 text-sm">
                  This block is used in <strong>{usage.totalUsages} place{usage.totalUsages > 1 ? "s" : ""}</strong>.
                  Changes will affect all linked content.
                </p>
              </div>

              {/* Wireframe Sections */}
              {usage.wireframeSections.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <span>🌐</span>
                    Wireframe Sections ({usage.wireframeSections.length})
                  </h3>
                  <ul className="space-y-1">
                    {usage.wireframeSections.map((section) => (
                      <li
                        key={section.id}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg text-sm"
                      >
                        <span className="text-slate-400">📄</span>
                        <span className="text-slate-300">{section.pageName}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-slate-400">{section.type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Roadmap Items */}
              {usage.roadmapItems.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <span>📅</span>
                    Roadmap Items ({usage.roadmapItems.length})
                  </h3>
                  <ul className="space-y-1">
                    {usage.roadmapItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg text-sm"
                      >
                        <span className="text-slate-400">📌</span>
                        <span className="text-slate-300">{item.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dependent Blocks */}
              {usage.dependentBlocks.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <span>🔗</span>
                    Dependent Blocks ({usage.dependentBlocks.length})
                  </h3>
                  <ul className="space-y-1">
                    {usage.dependentBlocks.map((block) => (
                      <li
                        key={block.id}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg text-sm"
                      >
                        <span className="text-slate-400">📦</span>
                        <span className="text-slate-300">{block.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              hasImpact
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {hasImpact ? `${actionLabel} Anyway` : actionLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Usage badge component to show on blocks
 */
export function UsageBadge({ usage }: { usage: BlockUsage }) {
  if (usage.totalUsages === 0) return null;

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400"
      title={`Used in ${usage.totalUsages} places`}
    >
      <span>🔗</span>
      <span>{usage.totalUsages}</span>
    </div>
  );
}

export default ImpactAnalysisModal;


