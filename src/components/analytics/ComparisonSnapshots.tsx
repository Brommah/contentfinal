"use client";

/**
 * Comparison Snapshots Component
 * 
 * Side-by-side diff showing what changed between two points in time
 */

import React, { useState, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import type { BlockData, BlockStatus } from "@/lib/types";

interface SnapshotComparison {
  added: BlockData[];
  removed: BlockData[];
  statusChanged: { block: BlockData; from: BlockStatus; to: BlockStatus }[];
  contentEdited: BlockData[];
}

type TimeRange = "today" | "week" | "month" | "custom";

export default function ComparisonSnapshots() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const { nodes } = useCanvasStore();

  // Simulate comparison (in production, this would compare actual snapshots)
  const comparison = useMemo((): SnapshotComparison => {
    const blocks = nodes.map((n) => n.data as BlockData);
    const now = Date.now();

    const getRangeMs = () => {
      switch (timeRange) {
        case "today":
          return 24 * 60 * 60 * 1000;
        case "week":
          return 7 * 24 * 60 * 60 * 1000;
        case "month":
          return 30 * 24 * 60 * 60 * 1000;
        default:
          return 7 * 24 * 60 * 60 * 1000;
      }
    };

    const rangeMs = getRangeMs();

    // Simulate changes based on createdAt/updatedAt
    const added = blocks.filter((b) => {
      const created = new Date(b.createdAt || 0).getTime();
      return now - created < rangeMs;
    });

    const contentEdited = blocks.filter((b) => {
      const updated = new Date(b.updatedAt || 0).getTime();
      const created = new Date(b.createdAt || 0).getTime();
      return now - updated < rangeMs && updated !== created;
    });

    // Simulate status changes
    const statusChanged = blocks
      .slice(0, 3)
      .filter((b) => b.status === "LIVE" || b.status === "APPROVED")
      .map((b) => ({
        block: b,
        from: "DRAFT" as BlockStatus,
        to: b.status,
      }));

    return {
      added,
      removed: [],
      statusChanged,
      contentEdited,
    };
  }, [nodes, timeRange]);

  const totalChanges =
    comparison.added.length +
    comparison.removed.length +
    comparison.statusChanged.length +
    comparison.contentEdited.length;

  const timeRangeLabels: Record<TimeRange, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    custom: "Custom",
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📊</span>
            Content Changes
          </h3>
          <p className="text-sm text-slate-400">
            Compare snapshots over time
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 bg-slate-700/50 rounded-lg p-1">
          {(["today", "week", "month"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {timeRangeLabels[range]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2.5 text-center">
          <div className="text-xl font-bold text-green-400">
            +{comparison.added.length}
          </div>
          <div className="text-xs text-green-400/70">Added</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-center">
          <div className="text-xl font-bold text-red-400">
            -{comparison.removed.length}
          </div>
          <div className="text-xs text-red-400/70">Removed</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5 text-center">
          <div className="text-xl font-bold text-blue-400">
            {comparison.statusChanged.length}
          </div>
          <div className="text-xs text-blue-400/70">Status</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2.5 text-center">
          <div className="text-xl font-bold text-purple-400">
            {comparison.contentEdited.length}
          </div>
          <div className="text-xs text-purple-400/70">Edited</div>
        </div>
      </div>

      {/* Changes List */}
      {totalChanges === 0 ? (
        <div className="py-6 text-center text-slate-500">
          <span className="text-2xl">📋</span>
          <p className="mt-2">No changes in this period</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comparison.added.slice(0, 3).map((block) => (
            <div
              key={`add-${block.id}`}
              className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg"
            >
              <span className="text-green-400">+</span>
              <span className="text-sm text-white truncate flex-1">
                {block.title}
              </span>
              <span className="text-xs text-slate-500">{block.type}</span>
            </div>
          ))}

          {comparison.statusChanged.slice(0, 3).map(({ block, from, to }) => (
            <div
              key={`status-${block.id}`}
              className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg"
            >
              <span className="text-blue-400">→</span>
              <span className="text-sm text-white truncate flex-1">
                {block.title}
              </span>
              <span className="text-xs text-slate-500">
                {from} → {to}
              </span>
            </div>
          ))}

          {comparison.contentEdited.slice(0, 3).map((block) => (
            <div
              key={`edit-${block.id}`}
              className="flex items-center gap-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg"
            >
              <span className="text-purple-400">✎</span>
              <span className="text-sm text-white truncate flex-1">
                {block.title}
              </span>
              <span className="text-xs text-slate-500">edited</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center">
        <span className="text-xs text-slate-500">
          {totalChanges} total changes
        </span>
        <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
          Export Report →
        </button>
      </div>
    </div>
  );
}

