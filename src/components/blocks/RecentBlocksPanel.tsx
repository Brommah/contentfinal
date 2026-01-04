"use client";

import React, { useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, type BlockData } from "@/lib/types";

/**
 * RecentBlocksPanel - Shows recently modified blocks for quick access
 */
export default function RecentBlocksPanel() {
  const { nodes, focusOnNode, selectNode } = useCanvasStore();

  // Get blocks sorted by updatedAt (most recent first)
  const recentBlocks = useMemo(() => {
    return nodes
      .map((n) => n.data as unknown as BlockData)
      .filter((b) => b.updatedAt)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [nodes]);

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleBlockClick = (blockId: string) => {
    focusOnNode(blockId);
    selectNode(blockId);
  };

  if (recentBlocks.length === 0) {
    return null;
  }

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="text-base">🕐</span>
        Recent Blocks
      </h3>
      <div className="space-y-2">
        {recentBlocks.map((block) => {
          const config = BLOCK_CONFIGS[block.type];
          return (
            <button
              key={block.id}
              onClick={() => handleBlockClick(block.id)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ backgroundColor: `${config.borderColor}20` }}
              >
                {config.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {block.title}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: config.borderColor }}
                  />
                  {config.label}
                  <span className="text-gray-400">•</span>
                  {formatTimeAgo(block.updatedAt)}
                </p>
              </div>
              <svg
                className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

