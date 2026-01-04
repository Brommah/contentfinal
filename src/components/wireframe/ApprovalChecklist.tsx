"use client";

import React, { useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { getSectionMeta, type WireframeSection } from "@/lib/wireframe-types";
import type { BlockData } from "@/lib/types";

interface ChecklistItem {
  id: string;
  label: string;
  isComplete: boolean;
  type: "required" | "recommended";
  details?: string;
}

interface ApprovalChecklistProps {
  pageId: string;
  onClose?: () => void;
}

/**
 * ApprovalChecklist - Shows checklist of items before page can go live
 */
export default function ApprovalChecklist({ pageId, onClose }: ApprovalChecklistProps) {
  const { wireframeSections, nodes } = useCanvasStore();

  const pageSections = useMemo(() => {
    return wireframeSections.filter((s) => s.pageId === pageId);
  }, [wireframeSections, pageId]);

  const checklist = useMemo((): ChecklistItem[] => {
    const items: ChecklistItem[] = [];

    // Required checks
    // 1. Has at least a Hero section
    const hasHero = pageSections.some((s) => s.type === "HERO");
    items.push({
      id: "hero",
      label: "Hero section added",
      isComplete: hasHero,
      type: "required",
    });

    // 2. Has a CTA section
    const hasCTA = pageSections.some((s) => s.type === "CTA");
    items.push({
      id: "cta",
      label: "Call-to-action section",
      isComplete: hasCTA,
      type: "required",
    });

    // 3. All sections have linked blocks
    const sectionsWithBlocks = pageSections.filter((s) => s.linkedBlockIds.length > 0);
    const allSectionsHaveBlocks = pageSections.every((s) => s.linkedBlockIds.length > 0);
    items.push({
      id: "blocks-linked",
      label: "All sections have content blocks",
      isComplete: allSectionsHaveBlocks,
      type: "required",
      details: `${sectionsWithBlocks.length}/${pageSections.length} sections`,
    });

    // 4. All linked blocks are approved or live
    const linkedBlockIds = pageSections.flatMap((s) => s.linkedBlockIds);
    const linkedBlocks = nodes
      .filter((n) => linkedBlockIds.includes(n.id))
      .map((n) => n.data as unknown as BlockData);
    const allBlocksApproved = linkedBlocks.every(
      (b) => b.status === "APPROVED" || b.status === "LIVE"
    );
    const approvedCount = linkedBlocks.filter(
      (b) => b.status === "APPROVED" || b.status === "LIVE"
    ).length;
    items.push({
      id: "blocks-approved",
      label: "All content blocks approved",
      isComplete: allBlocksApproved,
      type: "required",
      details: `${approvedCount}/${linkedBlocks.length} blocks`,
    });

    // Recommended checks
    // 5. Has value props section
    const hasValueProps = pageSections.some((s) => s.type === "VALUE_PROPS");
    items.push({
      id: "value-props",
      label: "Value propositions section",
      isComplete: hasValueProps,
      type: "recommended",
    });

    // 6. Has at least 3 sections
    items.push({
      id: "min-sections",
      label: "At least 3 content sections",
      isComplete: pageSections.length >= 3,
      type: "recommended",
      details: `${pageSections.length} sections`,
    });

    // 7. No sections pending review
    const pendingSections = pageSections.filter((s) => s.status === "PENDING_REVIEW");
    items.push({
      id: "no-pending",
      label: "No sections pending review",
      isComplete: pendingSections.length === 0,
      type: "recommended",
      details: pendingSections.length > 0 ? `${pendingSections.length} pending` : undefined,
    });

    // 8. All sections have variant set
    const sectionsWithVariants = pageSections.filter((s) => s.variant);
    items.push({
      id: "variants",
      label: "Section variants configured",
      isComplete: sectionsWithVariants.length === pageSections.length,
      type: "recommended",
      details: `${sectionsWithVariants.length}/${pageSections.length} sections`,
    });

    return items;
  }, [pageSections, nodes]);

  const requiredItems = checklist.filter((i) => i.type === "required");
  const recommendedItems = checklist.filter((i) => i.type === "recommended");
  const requiredComplete = requiredItems.filter((i) => i.isComplete).length;
  const recommendedComplete = recommendedItems.filter((i) => i.isComplete).length;
  const allRequiredComplete = requiredComplete === requiredItems.length;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              allRequiredComplete
                ? "bg-emerald-500/20"
                : "bg-amber-500/20"
            }`}
          >
            <span className="text-xl">{allRequiredComplete ? "✅" : "📋"}</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">Pre-Launch Checklist</h3>
            <p className="text-xs text-slate-400">
              {allRequiredComplete
                ? "Ready to go live!"
                : `${requiredItems.length - requiredComplete} required items remaining`}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Required Items */}
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Required ({requiredComplete}/{requiredItems.length})
            </h4>
            {allRequiredComplete && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full">
                ✓ Complete
              </span>
            )}
          </div>
          <div className="space-y-2">
            {requiredItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  item.isComplete
                    ? "bg-emerald-500/10"
                    : "bg-slate-700/30"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.isComplete
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-600 text-slate-400"
                  }`}
                >
                  {item.isComplete ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-[10px]">○</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      item.isComplete ? "text-emerald-400" : "text-slate-300"
                    }`}
                  >
                    {item.label}
                  </p>
                  {item.details && (
                    <p className="text-[10px] text-slate-500">{item.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recommended ({recommendedComplete}/{recommendedItems.length})
            </h4>
          </div>
          <div className="space-y-2">
            {recommendedItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  item.isComplete
                    ? "bg-blue-500/10"
                    : "bg-slate-700/30"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.isComplete
                      ? "bg-blue-500 text-white"
                      : "bg-slate-600 text-slate-400"
                  }`}
                >
                  {item.isComplete ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-[10px]">○</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      item.isComplete ? "text-blue-400" : "text-slate-300"
                    }`}
                  >
                    {item.label}
                  </p>
                  {item.details && (
                    <p className="text-[10px] text-slate-500">{item.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-900/50">
        {allRequiredComplete ? (
          <button className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors">
            🚀 Ready to Publish
          </button>
        ) : (
          <p className="text-xs text-slate-500 text-center">
            Complete all required items to enable publishing
          </p>
        )}
      </div>
    </div>
  );
}

