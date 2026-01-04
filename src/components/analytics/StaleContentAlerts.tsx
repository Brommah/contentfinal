"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, type BlockData } from "@/lib/types";
import { formatDistanceToNow, differenceInDays } from "date-fns";

interface StaleBlock {
  id: string;
  title: string;
  type: string;
  icon: string;
  lastUpdated: Date;
  daysSinceUpdate: number;
  staleness: "warning" | "critical";
}

interface StaleContentAlertsProps {
  thresholdDays?: number; // Days before content is considered stale
  criticalThresholdDays?: number; // Days before content is critical
}

/**
 * StaleContentAlerts - Highlights blocks that haven't been updated recently
 */
export default function StaleContentAlerts({
  thresholdDays = 14,
  criticalThresholdDays = 30,
}: StaleContentAlertsProps) {
  const router = useRouter();
  const { nodes, focusOnNode, selectNode } = useCanvasStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const staleBlocks = useMemo((): StaleBlock[] => {
    const now = new Date();
    const stale: StaleBlock[] = [];

    nodes.forEach((node) => {
      const block = node.data as unknown as BlockData;
      const updatedAt = block.updatedAt ? new Date(block.updatedAt) : block.createdAt ? new Date(block.createdAt) : null;

      if (!updatedAt) return;

      const daysSince = differenceInDays(now, updatedAt);

      if (daysSince >= thresholdDays) {
        const config = BLOCK_CONFIGS[block.type];
        stale.push({
          id: block.id,
          title: block.title,
          type: config.label,
          icon: config.icon,
          lastUpdated: updatedAt,
          daysSinceUpdate: daysSince,
          staleness: daysSince >= criticalThresholdDays ? "critical" : "warning",
        });
      }
    });

    // Sort by staleness (most stale first)
    return stale.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
  }, [nodes, thresholdDays, criticalThresholdDays]);

  const criticalCount = staleBlocks.filter((b) => b.staleness === "critical").length;
  const warningCount = staleBlocks.filter((b) => b.staleness === "warning").length;

  const handleBlockClick = (blockId: string) => {
    router.push("/?tab=schema");
    focusOnNode(blockId);
    selectNode(blockId);
  };

  if (staleBlocks.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <span className="text-xl">✨</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">All Content Fresh</h3>
            <p className="text-xs text-slate-400">
              No blocks older than {thresholdDays} days
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 border-b border-slate-700/50 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <span className="text-xl">⏰</span>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white flex items-center gap-2">
              Stale Content
              <span className="text-xs font-normal text-slate-400">
                ({staleBlocks.length} blocks)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {criticalCount > 0 && (
                <span className="text-red-400 mr-2">{criticalCount} critical</span>
              )}
              {warningCount > 0 && (
                <span className="text-amber-400">{warningCount} needs attention</span>
              )}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="divide-y divide-slate-700/50 max-h-[300px] overflow-y-auto">
          {staleBlocks.slice(0, 10).map((block) => (
            <button
              key={block.id}
              onClick={() => handleBlockClick(block.id)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition-colors text-left group"
            >
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  block.staleness === "critical"
                    ? "bg-red-500/20"
                    : "bg-amber-500/20"
                }`}
              >
                {block.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                  {block.title}
                </p>
                <p className="text-[10px] text-slate-400">
                  {block.type} • Updated {formatDistanceToNow(block.lastUpdated, { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                    block.staleness === "critical"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {block.daysSinceUpdate}d
                </span>
                <svg
                  className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
          {staleBlocks.length > 10 && (
            <div className="px-4 py-3 text-center text-xs text-slate-500">
              +{staleBlocks.length - 10} more stale blocks
            </div>
          )}
        </div>
      )}
    </div>
  );
}

