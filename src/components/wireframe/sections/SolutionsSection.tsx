"use client";

import React from "react";
import type { BlockData } from "@/lib/types";
import { useCanvasStore } from "@/lib/store";
import EditableText from "../EditableText";

interface SolutionsSectionProps {
  blocks: BlockData[];
  accent: string;
  variant?: string;
}

/**
 * SolutionsSection - Editable solutions display
 * Supports variants: default (grid), split (alternating)
 */
export default function SolutionsSection({ blocks, accent, variant = "default" }: SolutionsSectionProps) {
  const { updateNode } = useCanvasStore();

  const solutions = blocks.filter((b) => b.type === "SOLUTION").slice(0, 4);

  const displayItems = solutions.length > 0
    ? solutions
    : [
        { id: "placeholder-1", title: "Solution 1", subtitle: "Description", type: "SOLUTION" },
        { id: "placeholder-2", title: "Solution 2", subtitle: "Description", type: "SOLUTION" },
        { id: "placeholder-3", title: "Solution 3", subtitle: "Description", type: "SOLUTION" },
      ] as BlockData[];

  const handleTitleChange = (blockId: string, value: string) => {
    if (!blockId.startsWith("placeholder")) {
      updateNode(blockId, { title: value });
    }
  };

  const handleSubtitleChange = (blockId: string, value: string) => {
    if (!blockId.startsWith("placeholder")) {
      updateNode(blockId, { subtitle: value });
    }
  };

  // Split/Alternating variant
  if (variant === "split") {
    return (
      <div className="p-6 bg-green-950/10">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Our Solution
        </h2>
        <p className="text-center text-xs text-gray-500 mb-6">
          How we address these challenges
        </p>

        <div className="space-y-4">
          {displayItems.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-6 p-4 rounded-lg bg-${accent}-500/5 border border-${accent}-500/20 ${
                i % 2 === 1 ? "flex-row-reverse" : ""
              }`}
            >
              {/* Image placeholder */}
              <div className="w-24 h-16 shrink-0 rounded-lg bg-gray-700/30 flex items-center justify-center text-gray-500 text-xs">
                Visual
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-5 h-5 rounded-full bg-${accent}-500/30 text-${accent}-400 text-xs flex items-center justify-center`}>
                    ✓
                  </span>
                  <EditableText
                    value={item.title}
                    onChange={(value) => handleTitleChange(item.id, value)}
                    placeholder="Solution Title"
                    className={`text-sm font-medium text-${accent}-300`}
                    as="h3"
                  />
                </div>
                <EditableText
                  value={item.subtitle || item.content || ""}
                  onChange={(value) => handleSubtitleChange(item.id, value)}
                  placeholder="Solution description"
                  className="text-xs text-gray-500 block"
                  as="p"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default (grid) variant
  return (
    <div className="p-6 bg-green-950/10">
      <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Our Solution
      </h2>
      <p className="text-center text-xs text-gray-500 mb-6">
        How we address these challenges
      </p>

      <div className="grid grid-cols-2 gap-3">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg bg-${accent}-500/5 border border-${accent}-500/20`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-5 h-5 rounded-full bg-${accent}-500/30 text-${accent}-400 text-xs flex items-center justify-center`}>
                ✓
              </span>
              <EditableText
                value={item.title}
                onChange={(value) => handleTitleChange(item.id, value)}
                placeholder="Solution Title"
                className={`text-sm font-medium text-${accent}-300`}
                as="h3"
              />
            </div>
            <EditableText
              value={item.subtitle || item.content || ""}
              onChange={(value) => handleSubtitleChange(item.id, value)}
              placeholder="Solution description"
              className="text-xs text-gray-500 block"
              as="p"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
