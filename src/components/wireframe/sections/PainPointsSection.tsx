"use client";

import React from "react";
import type { BlockData } from "@/lib/types";
import { useCanvasStore } from "@/lib/store";
import EditableText from "../EditableText";

interface PainPointsSectionProps {
  blocks: BlockData[];
  variant?: string;
}

/**
 * PainPointsSection - Editable problems/challenges display
 * Supports variants: default (list), centered (cards)
 */
export default function PainPointsSection({ blocks, variant = "default" }: PainPointsSectionProps) {
  const { updateNode } = useCanvasStore();

  const painPoints = blocks.filter((b) => b.type === "PAIN_POINT").slice(0, 4);

  const displayItems = painPoints.length > 0
    ? painPoints
    : [
        { id: "placeholder-1", title: "Pain Point 1", subtitle: "Description", type: "PAIN_POINT" },
        { id: "placeholder-2", title: "Pain Point 2", subtitle: "Description", type: "PAIN_POINT" },
        { id: "placeholder-3", title: "Pain Point 3", subtitle: "Description", type: "PAIN_POINT" },
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

  // Centered/Cards variant
  if (variant === "centered") {
    return (
      <div className="p-6 bg-red-950/10">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          The Problem
        </h2>
        <p className="text-center text-xs text-gray-500 mb-6">
          Challenges facing the industry today
        </p>

        <div className="grid grid-cols-2 gap-4">
          {displayItems.map((item, i) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-center"
            >
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-500/20 text-red-400 text-lg font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <EditableText
                value={item.title}
                onChange={(value) => handleTitleChange(item.id, value)}
                placeholder="Pain Point Title"
                className="text-sm font-semibold text-red-300 mb-1 block"
                as="h3"
              />
              <EditableText
                value={item.subtitle || item.content || ""}
                onChange={(value) => handleSubtitleChange(item.id, value)}
                placeholder="Problem description"
                className="text-xs text-gray-500 block"
                as="p"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default (list) variant
  return (
    <div className="p-6 bg-red-950/10">
      <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
        The Problem
      </h2>
      <p className="text-center text-xs text-gray-500 mb-6">
        Challenges facing the industry today
      </p>

      <div className="space-y-3">
        {displayItems.map((item, i) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20"
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div className="flex-1">
              <EditableText
                value={item.title}
                onChange={(value) => handleTitleChange(item.id, value)}
                placeholder="Pain Point Title"
                className="text-sm font-medium text-red-300 block"
                as="h3"
              />
              <EditableText
                value={item.subtitle || item.content || ""}
                onChange={(value) => handleSubtitleChange(item.id, value)}
                placeholder="Problem description"
                className="text-xs text-gray-500 mt-0.5 block"
                as="p"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
