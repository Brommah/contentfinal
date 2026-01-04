"use client";

import React from "react";
import { useCanvasStore } from "@/lib/store";
import type { Company } from "@/lib/types";
import type { RoadmapItem, RoadmapStatus } from "@/lib/roadmap-types";
import { STATUS_CONFIGS } from "@/lib/roadmap-types";
import type { TabType } from "../dashboard/TabNavigation";

interface RoadmapOverviewProps {
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
 * RoadmapOverview - Shows In Progress and Up Next roadmap items
 * Review items are shown in a separate RoadmapReviewQueue component
 * Click on items to navigate to Content Roadmap
 */
export default function RoadmapOverview({ companyFilter, onNavigate }: RoadmapOverviewProps) {
  const { roadmapItems, updateRoadmapItemStatus, selectRoadmapItem } = useCanvasStore();

  // Filter items by company
  const filteredItems = roadmapItems.filter(
    (item) => companyFilter === "ALL" || item.company === companyFilter
  );

  // Sort by priority and then by phase
  const sortedItems = [...filteredItems].sort((a, b) => {
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return 0;
  });

  // Group by status
  const itemsInReview = sortedItems.filter((i) => i.status === "REVIEW");
  const inProgressItems = sortedItems.filter((i) => i.status === "IN_PROGRESS");
  const plannedItems = sortedItems.filter((i) => i.status === "PLANNED").slice(0, 8);
  const publishedItems = sortedItems.filter((i) => i.status === "PUBLISHED");

  const handleStatusChange = (id: string, status: RoadmapStatus) => {
    updateRoadmapItemStatus(id, status);
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            🚀 In Progress & Up Next
          </h2>
          <span className="text-xs text-slate-500">
            Synced with Content Roadmap
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* In Progress */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
            🔄 In Progress ({inProgressItems.length})
          </h3>
          {inProgressItems.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No items in progress</p>
          ) : (
            <div className="space-y-2">
              {inProgressItems.map((item) => (
                <RoadmapItemCard
                  key={item.id}
                  item={item}
                  onStatusChange={handleStatusChange}
                  onNavigateToItem={() => {
                    selectRoadmapItem(item.id);
                    onNavigate?.("roadmap");
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Planned / Up Next */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
            ⏭️ Up Next ({plannedItems.length})
          </h3>
          {plannedItems.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No upcoming items</p>
          ) : (
            <div className="space-y-2">
              {plannedItems.map((item) => (
                <RoadmapItemCard
                  key={item.id}
                  item={item}
                  onStatusChange={handleStatusChange}
                  compact
                  onNavigateToItem={() => {
                    selectRoadmapItem(item.id);
                    onNavigate?.("roadmap");
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 pt-3 border-t border-slate-700/50">
          <MiniStat
            label="Published"
            value={publishedItems.length}
            total={filteredItems.length}
            color="emerald"
          />
          <MiniStat
            label="In Review"
            value={itemsInReview.length}
            total={filteredItems.length}
            color="amber"
          />
          <MiniStat
            label="In Progress"
            value={inProgressItems.length}
            total={filteredItems.length}
            color="blue"
          />
          <MiniStat
            label="Planned"
            value={sortedItems.filter((i) => i.status === "PLANNED").length}
            total={filteredItems.length}
            color="slate"
          />
        </div>
      </div>
    </div>
  );
}

function RoadmapItemCard({
  item,
  onStatusChange,
  compact = false,
  showReviewActions = false,
  onNavigateToItem,
}: {
  item: RoadmapItem;
  onStatusChange: (id: string, status: RoadmapStatus) => void;
  compact?: boolean;
  showReviewActions?: boolean;
  onNavigateToItem?: () => void;
}) {
  const statusConfig = STATUS_CONFIGS[item.status];
  const companyColor = item.company === "CERE" ? "text-blue-400" : "text-purple-400";

  return (
    <div
      className={`
        p-3 rounded-lg border transition-all hover:border-slate-600
        border-slate-700/50
      `}
      style={{ backgroundColor: `${statusConfig.color}10` }}
    >
      <div 
        className="flex items-start gap-3 cursor-pointer group"
        onClick={onNavigateToItem}
        title="Click to view in Content Roadmap"
      >
        <span className="text-lg mt-0.5">{PRIORITY_ICONS[item.priority]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${companyColor}`}>
              {item.company}
            </span>
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: statusConfig.color }}
            />
            <span className="text-xs" style={{ color: statusConfig.color }}>
              {statusConfig.label}
            </span>
            <span className="ml-auto text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view →
            </span>
          </div>
          <h4 className="text-white font-medium text-sm truncate group-hover:text-blue-300 transition-colors">{item.title}</h4>
          {!compact && item.description && (
            <p className="text-slate-400 text-xs mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        
        {/* Action buttons based on status */}
        <div className="flex gap-1">
          {showReviewActions ? (
            // Review actions for Fred
            <>
              <button
                onClick={() => onStatusChange(item.id, "PUBLISHED")}
                className="px-2 py-1 text-xs rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                title="Approve & Publish"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => onStatusChange(item.id, "IN_PROGRESS")}
                className="px-2 py-1 text-xs rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
                title="Send back for changes"
              >
                🔄 Revise
              </button>
            </>
          ) : (
            // Standard status change buttons
            <>
              {item.status === "PLANNED" && (
                <button
                  onClick={() => onStatusChange(item.id, "IN_PROGRESS")}
                  className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                  title="Start"
                >
                  ▶️
                </button>
              )}
              {item.status === "IN_PROGRESS" && (
                <button
                  onClick={() => onStatusChange(item.id, "REVIEW")}
                  className="p-1.5 rounded hover:bg-amber-500/20 text-amber-400 transition-colors"
                  title="Submit for Review"
                >
                  👀
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: "emerald" | "blue" | "slate" | "amber";
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const colors = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    slate: "bg-slate-500",
    amber: "bg-amber-500",
  };

  return (
    <div className="text-center">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${colors[color]} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
