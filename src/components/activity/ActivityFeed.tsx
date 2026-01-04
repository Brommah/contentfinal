"use client";

import React, { useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, type BlockData } from "@/lib/types";

interface ActivityItem {
  id: string;
  type: "block_created" | "block_updated" | "section_added" | "status_changed";
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  timestamp: Date;
  blockId?: string;
}

/**
 * ActivityFeed - Shows recent changes and activity
 */
export default function ActivityFeed() {
  const { nodes, wireframeSections, focusOnNode, selectNode } = useCanvasStore();

  // Build activity items from blocks and sections
  const activityItems = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];
    const now = new Date();

    // Add block activities
    nodes.forEach((node) => {
      const block = node.data as unknown as BlockData;
      const config = BLOCK_CONFIGS[block.type];
      
      if (block.updatedAt) {
        const updatedAt = new Date(block.updatedAt);
        // Only show items from last 24 hours
        const hoursSince = (now.getTime() - updatedAt.getTime()) / 3600000;
        if (hoursSince <= 24) {
          items.push({
            id: `update-${block.id}`,
            type: "block_updated",
            title: `Updated "${block.title}"`,
            subtitle: config.label,
            icon: "✏️",
            iconBg: "bg-blue-500/20",
            timestamp: updatedAt,
            blockId: block.id,
          });
        }
      }

      if (block.createdAt) {
        const createdAt = new Date(block.createdAt);
        const hoursSince = (now.getTime() - createdAt.getTime()) / 3600000;
        if (hoursSince <= 24) {
          items.push({
            id: `create-${block.id}`,
            type: "block_created",
            title: `Created "${block.title}"`,
            subtitle: config.label,
            icon: "➕",
            iconBg: "bg-emerald-500/20",
            timestamp: createdAt,
            blockId: block.id,
          });
        }
      }
    });

    // Sort by timestamp (most recent first)
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return items.slice(0, 10);
  }, [nodes]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${diffHours}h ago`;
  };

  const handleItemClick = (item: ActivityItem) => {
    if (item.blockId) {
      focusOnNode(item.blockId);
      selectNode(item.blockId);
    }
  };

  if (activityItems.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <span className="text-base">📋</span>
          Recent Activity
        </h3>
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <div className="text-2xl mb-2">🏖️</div>
          <p className="text-xs">No recent activity</p>
          <p className="text-xs text-gray-400 mt-1">Changes will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <span className="text-base">📋</span>
        Recent Activity
      </h3>
      <div className="space-y-2">
        {activityItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
          >
            <span className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center text-sm flex-shrink-0`}>
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {item.title}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                {item.subtitle}
                <span className="text-gray-400">•</span>
                {formatTimeAgo(item.timestamp)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

