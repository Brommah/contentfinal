"use client";

import React from "react";
import type { BlockData } from "@/lib/types";
import { useCanvasStore } from "@/lib/store";
import EditableText from "../EditableText";

interface FeaturesSectionProps {
  blocks: BlockData[];
  accent: string;
  variant?: string;
}

/**
 * FeaturesSection - Editable product features grid
 * Supports variants: default (grid), compact (list), centered (carousel)
 */
export default function FeaturesSection({ blocks, accent, variant = "default" }: FeaturesSectionProps) {
  const { updateNode } = useCanvasStore();

  const features = blocks.filter((b) => b.type === "FEATURE" || b.type === "TECH_COMPONENT").slice(0, 6);

  const displayItems = features.length > 0
    ? features
    : [
        { id: "placeholder-1", title: "Feature 1", subtitle: "Description", type: "FEATURE" },
        { id: "placeholder-2", title: "Feature 2", subtitle: "Description", type: "FEATURE" },
        { id: "placeholder-3", title: "Feature 3", subtitle: "Description", type: "FEATURE" },
        { id: "placeholder-4", title: "Feature 4", subtitle: "Description", type: "FEATURE" },
      ] as BlockData[];

  const icons = ["⚡", "🔧", "📊", "🔐", "🌐", "🤖"];

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

  // Compact (list) variant
  if (variant === "compact") {
    return (
      <div className="p-6">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Features
        </h2>
        <p className="text-center text-xs text-gray-500 mb-6">
          What makes us different
        </p>

        <div className="space-y-2">
          {displayItems.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-700/20 border border-gray-700/30"
            >
              <span className={`w-6 h-6 rounded bg-${accent}-500/20 flex items-center justify-center text-xs shrink-0`}>
                {icons[i % icons.length]}
              </span>
              <EditableText
                value={item.title}
                onChange={(value) => handleTitleChange(item.id, value)}
                placeholder="Feature Name"
                className="text-sm text-white flex-1"
                as="span"
              />
              <EditableText
                value={item.subtitle || ""}
                onChange={(value) => handleSubtitleChange(item.id, value)}
                placeholder="Description"
                className="text-xs text-gray-500 flex-1"
                as="span"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Centered (carousel-style) variant
  if (variant === "centered") {
    return (
      <div className="p-6">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Features
        </h2>
        <p className="text-center text-xs text-gray-500 mb-6">
          What makes us different
        </p>

        <div className="flex gap-4 overflow-hidden">
          {displayItems.slice(0, 3).map((item, i) => (
            <div
              key={item.id}
              className="flex-1 min-w-0 p-4 rounded-xl bg-gray-700/20 border border-gray-700/30 text-center"
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-${accent}-500/20 flex items-center justify-center text-xl`}>
                {icons[i % icons.length]}
              </div>
              <EditableText
                value={item.title}
                onChange={(value) => handleTitleChange(item.id, value)}
                placeholder="Feature Name"
                className="text-sm font-semibold text-white mb-1 block"
                as="h3"
              />
              <EditableText
                value={item.subtitle || ""}
                onChange={(value) => handleSubtitleChange(item.id, value)}
                placeholder="Feature description"
                className="text-xs text-gray-500 block"
                as="p"
              />
            </div>
          ))}
        </div>

        {/* Carousel indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i === 0 ? `bg-${accent}-500` : "bg-gray-600"}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Default (grid) variant
  return (
    <div className="p-6">
      <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Features
      </h2>
      <p className="text-center text-xs text-gray-500 mb-6">
        What makes us different
      </p>

      <div className="grid grid-cols-2 gap-3">
        {displayItems.map((item, i) => (
          <div
            key={item.id}
            className="p-3 rounded-lg bg-gray-700/20 border border-gray-700/30"
          >
            <div className="flex items-start gap-2">
              <span className={`w-8 h-8 rounded-lg bg-${accent}-500/20 flex items-center justify-center text-sm flex-shrink-0`}>
                {icons[i % icons.length]}
              </span>
              <div className="flex-1 min-w-0">
                <EditableText
                  value={item.title}
                  onChange={(value) => handleTitleChange(item.id, value)}
                  placeholder="Feature Name"
                  className="text-sm font-medium text-white block"
                  as="h3"
                />
                <EditableText
                  value={item.subtitle || ""}
                  onChange={(value) => handleSubtitleChange(item.id, value)}
                  placeholder="Feature description"
                  className="text-[10px] text-gray-500 mt-0.5 block"
                  as="p"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
