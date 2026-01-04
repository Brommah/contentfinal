"use client";

import React, { useState, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import type { Company } from "@/lib/types";
import type { RoadmapItem, RoadmapStatus } from "@/lib/roadmap-types";
import { PRIORITY_CONFIGS } from "@/lib/roadmap-types";
import type { TabType } from "../dashboard/TabNavigation";
import { useToast } from "@/components/ui";

interface RoadmapReviewQueueProps {
  companyFilter: Company | "ALL";
  onNavigate?: (tab: TabType) => void;
}

const PRIORITY_ICONS: Record<string, string> = {
  CRITICAL: "🔴",
  HIGH: "🟠",
  MEDIUM: "🟡",
  LOW: "🟢",
};

/**
 * RoadmapReviewQueue - Shows roadmap items awaiting CEO review
 * Similar to ContentReviewQueue but for roadmap items
 */
export default function RoadmapReviewQueue({ companyFilter, onNavigate }: RoadmapReviewQueueProps) {
  const { roadmapItems, updateRoadmapItemStatus, selectRoadmapItem } = useCanvasStore();
  const { success, warning } = useToast();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Filter items by company and review status
  const itemsInReview = useMemo(() => {
    return roadmapItems
      .filter((item) => item.status === "REVIEW")
      .filter((item) => companyFilter === "ALL" || item.company === companyFilter)
      .sort((a, b) => {
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [roadmapItems, companyFilter]);

  const handleStatusChange = (id: string, status: RoadmapStatus) => {
    updateRoadmapItemStatus(id, status);
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === itemsInReview.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(itemsInReview.map((i) => i.id)));
    }
  };

  const handleBatchApprove = () => {
    const count = selectedItems.size;
    selectedItems.forEach((id) => {
      updateRoadmapItemStatus(id, "PUBLISHED");
    });
    success(`${count} roadmap item${count > 1 ? "s" : ""} published`);
    setSelectedItems(new Set());
  };

  const handleBatchReject = () => {
    const count = selectedItems.size;
    selectedItems.forEach((id) => {
      updateRoadmapItemStatus(id, "IN_PROGRESS");
    });
    warning(`${count} roadmap item${count > 1 ? "s" : ""} sent back`);
    setSelectedItems(new Set());
  };

  const handleNavigateToItem = (itemId: string) => {
    selectRoadmapItem(itemId);
    onNavigate?.("roadmap");
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            📋 Roadmap Pending Review
          </h2>
          <span className="text-xs text-slate-500">
            Synced with Content Roadmap
          </span>
        </div>
      </div>

      {/* Batch Actions */}
      {itemsInReview.length > 0 && (
        <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-900/30 flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            {selectedItems.size === itemsInReview.length ? "Deselect All" : "Select All"}
          </button>
          {selectedItems.size > 0 && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-slate-400">
                {selectedItems.size} selected
              </span>
              <div className="flex-1" />
              <button
                onClick={handleBatchApprove}
                className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                ✅ Approve All
              </button>
              <button
                onClick={handleBatchReject}
                className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                🔄 Send Back All
              </button>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {itemsInReview.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-slate-400">No roadmap items pending review</p>
            <p className="text-slate-500 text-sm mt-1">
              Team members can submit items for your approval
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {itemsInReview.map((item) => (
              <RoadmapReviewCard
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                onToggleSelect={() => handleToggleSelect(item.id)}
                onApprove={() => handleStatusChange(item.id, "PUBLISHED")}
                onReject={() => handleStatusChange(item.id, "IN_PROGRESS")}
                onNavigate={() => handleNavigateToItem(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RoadmapReviewCard({
  item,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onNavigate,
}: {
  item: RoadmapItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  onNavigate: () => void;
}) {
  const companyColor = item.company === "CERE" ? "text-blue-400 bg-blue-500/10" : "text-purple-400 bg-purple-500/10";
  const priorityConfig = PRIORITY_CONFIGS[item.priority];

  return (
    <div
      className={`
        p-4 rounded-lg border transition-all
        ${isSelected 
          ? "border-blue-500/50 bg-blue-500/10" 
          : "border-slate-700/50 hover:border-slate-600 bg-slate-900/30"
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
        />

        {/* Priority Icon */}
        <span className="text-lg mt-0.5">{PRIORITY_ICONS[item.priority]}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${companyColor}`}>
              {item.company}
            </span>
            <span 
              className="text-xs px-2 py-0.5 rounded"
              style={{ 
                color: priorityConfig.color,
                backgroundColor: `${priorityConfig.color}20`
              }}
            >
              {priorityConfig.label}
            </span>
            <span className="text-xs text-slate-500">
              {item.contentType.replace(/_/g, " ")}
            </span>
          </div>
          
          <h4 
            className="text-white font-medium text-sm truncate cursor-pointer hover:text-blue-300 transition-colors"
            onClick={onNavigate}
            title="Click to view in Content Roadmap"
          >
            {item.title}
          </h4>
          
          {item.description && (
            <p className="text-slate-400 text-xs mt-1 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
            title="Approve & Publish"
          >
            ✅ Approve
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
            title="Send back for changes"
          >
            🔄 Revise
          </button>
        </div>
      </div>
    </div>
  );
}

