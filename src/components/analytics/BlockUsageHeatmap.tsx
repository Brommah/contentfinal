"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, type BlockData, type BlockType } from "@/lib/types";

interface BlockUsage {
  id: string;
  title: string;
  type: BlockType;
  icon: string;
  usageCount: number;
  pages: string[];
  intensity: number; // 0-1 scale for heatmap color
}

/**
 * BlockUsageHeatmap - Visual overlay showing which blocks are used most
 */
export default function BlockUsageHeatmap() {
  const router = useRouter();
  const { nodes, wireframeSections, focusOnNode, selectNode } = useCanvasStore();
  const [sortBy, setSortBy] = useState<"usage" | "alphabetical">("usage");
  const [showUnused, setShowUnused] = useState(true);

  // Calculate usage for each block
  const blockUsageData = useMemo((): BlockUsage[] => {
    const usageMap = new Map<string, { pages: Set<string>; count: number }>();

    // Initialize all blocks
    nodes.forEach((node) => {
      const block = node.data as unknown as BlockData;
      usageMap.set(block.id, { pages: new Set(), count: 0 });
    });

    // Count usage in wireframe sections
    wireframeSections.forEach((section) => {
      section.linkedBlockIds.forEach((blockId) => {
        const usage = usageMap.get(blockId);
        if (usage) {
          usage.pages.add(section.pageId || "unknown");
          usage.count++;
        }
      });
    });

    // Convert to array and calculate intensity
    const maxUsage = Math.max(1, ...Array.from(usageMap.values()).map((u) => u.count));
    
    const usageArray: BlockUsage[] = nodes.map((node) => {
      const block = node.data as unknown as BlockData;
      const usage = usageMap.get(block.id)!;
      const config = BLOCK_CONFIGS[block.type];
      
      return {
        id: block.id,
        title: block.title,
        type: block.type,
        icon: config.icon,
        usageCount: usage.count,
        pages: Array.from(usage.pages),
        intensity: usage.count / maxUsage,
      };
    });

    // Filter and sort
    let filtered = showUnused ? usageArray : usageArray.filter((b) => b.usageCount > 0);
    
    if (sortBy === "usage") {
      filtered.sort((a, b) => b.usageCount - a.usageCount);
    } else {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [nodes, wireframeSections, sortBy, showUnused]);

  const handleBlockClick = (blockId: string) => {
    router.push("/?tab=schema");
    focusOnNode(blockId);
    selectNode(blockId);
  };

  const getHeatmapColor = (intensity: number) => {
    if (intensity === 0) return "bg-slate-700/50";
    if (intensity < 0.25) return "bg-blue-500/30";
    if (intensity < 0.5) return "bg-cyan-500/40";
    if (intensity < 0.75) return "bg-emerald-500/50";
    return "bg-emerald-400/70";
  };

  const totalUsage = blockUsageData.reduce((sum, b) => sum + b.usageCount, 0);
  const unusedCount = blockUsageData.filter((b) => b.usageCount === 0).length;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center">
              <span className="text-xl">🔥</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">Block Usage Heatmap</h3>
              <p className="text-xs text-slate-400">
                {totalUsage} total usages • {unusedCount} unused
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-slate-900 rounded-lg">
            <button
              onClick={() => setSortBy("usage")}
              className={`px-2 py-1 text-[10px] rounded ${
                sortBy === "usage"
                  ? "bg-blue-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              By Usage
            </button>
            <button
              onClick={() => setSortBy("alphabetical")}
              className={`px-2 py-1 text-[10px] rounded ${
                sortBy === "alphabetical"
                  ? "bg-blue-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              A-Z
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnused}
              onChange={(e) => setShowUnused(e.target.checked)}
              className="w-3 h-3 rounded bg-slate-700 border-slate-600"
            />
            Show unused
          </label>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        <div className="grid grid-cols-4 gap-2">
          {blockUsageData.slice(0, 24).map((block) => (
            <button
              key={block.id}
              onClick={() => handleBlockClick(block.id)}
              className={`p-3 rounded-lg transition-all hover:scale-105 group ${getHeatmapColor(
                block.intensity
              )}`}
              title={`${block.title}\n${block.usageCount} usages across ${block.pages.length} pages`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{block.icon}</span>
                <span
                  className={`text-[10px] font-bold ${
                    block.usageCount === 0 ? "text-slate-500" : "text-white"
                  }`}
                >
                  {block.usageCount}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 truncate group-hover:text-white">
                {block.title}
              </p>
            </button>
          ))}
        </div>

        {blockUsageData.length > 24 && (
          <p className="text-center text-xs text-slate-500 mt-4">
            +{blockUsageData.length - 24} more blocks
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Usage intensity:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 rounded bg-slate-700/50" title="Unused" />
            <div className="w-4 h-3 rounded bg-blue-500/30" title="Low" />
            <div className="w-4 h-3 rounded bg-cyan-500/40" title="Medium" />
            <div className="w-4 h-3 rounded bg-emerald-500/50" title="High" />
            <div className="w-4 h-3 rounded bg-emerald-400/70" title="Very High" />
            <span className="text-[9px] text-slate-500 ml-1">Low → High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

