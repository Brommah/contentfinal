"use client";

import React from "react";
import type { BlockData } from "@/lib/types";
import { useCanvasStore } from "@/lib/store";
import EditableText from "../EditableText";

interface ValuePropsSectionProps {
  blocks: BlockData[];
  accent: string;
  variant?: string;
}

/**
 * ValuePropsSection - Editable grid of value propositions
 * Supports variants: default (3 column), compact (2 column), full-width (4 column)
 */
export default function ValuePropsSection({ blocks, accent, variant = "default" }: ValuePropsSectionProps) {
  const { updateNode } = useCanvasStore();

  const valueProps = blocks.filter((b) => b.type === "CORE_VALUE_PROP").slice(0, 4);

  // Placeholder data if no blocks linked
  const displayItems = valueProps.length > 0
    ? valueProps
    : [
        { id: "placeholder-1", title: "Value Prop 1", subtitle: "Description here", type: "CORE_VALUE_PROP" },
        { id: "placeholder-2", title: "Value Prop 2", subtitle: "Description here", type: "CORE_VALUE_PROP" },
        { id: "placeholder-3", title: "Value Prop 3", subtitle: "Description here", type: "CORE_VALUE_PROP" },
      ] as BlockData[];

  const icons = ["💎", "🚀", "🔒", "⚡"];

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

  // Determine grid columns based on variant
  const getGridCols = () => {
    switch (variant) {
      case "compact":
        return "grid-cols-2";
      case "full-width":
        return "grid-cols-4";
      default:
        return "grid-cols-3";
    }
  };

  // Compact variant - horizontal list
  if (variant === "compact") {
    return (
      <div className="p-6">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
          Why Choose Us
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {displayItems.slice(0, 2).map((item, i) => (
            <div
              key={item.id}
              className="flex items-start gap-4 p-4 rounded-lg bg-gray-700/20 border border-gray-700/30"
            >
              <div className={`w-12 h-12 shrink-0 rounded-lg bg-${accent}-500/20 flex items-center justify-center text-xl`}>
                {icons[i % icons.length]}
              </div>
              <div className="flex-1">
                <EditableText
                  value={item.title}
                  onChange={(value) => handleTitleChange(item.id, value)}
                  placeholder="Value Prop Title"
                  className="text-sm font-semibold text-white mb-1 block"
                  as="h3"
                />
                <EditableText
                  value={item.subtitle || ""}
                  onChange={(value) => handleSubtitleChange(item.id, value)}
                  placeholder="Description text"
                  className="text-xs text-gray-400 block"
                  as="p"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full-width variant - 4 column grid
  if (variant === "full-width") {
    return (
      <div className="p-6">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
          Why Choose Us
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {displayItems.slice(0, 4).map((item, i) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-gray-700/20 border border-gray-700/30 text-center"
            >
              <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-${accent}-500/20 flex items-center justify-center text-sm`}>
                {icons[i % icons.length]}
              </div>
              <EditableText
                value={item.title}
                onChange={(value) => handleTitleChange(item.id, value)}
                placeholder="Value Prop"
                className="text-xs font-semibold text-white mb-0.5 block"
                as="h3"
              />
              <EditableText
                value={item.subtitle || ""}
                onChange={(value) => handleSubtitleChange(item.id, value)}
                placeholder="Description"
                className="text-[10px] text-gray-400 block"
                as="p"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default variant - 3 column grid (but uses 2 for mobile)
  return (
    <div className="p-6">
      <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
        Why Choose Us
      </h2>

      <div className={`grid ${getGridCols()} gap-4`}>
        {displayItems.slice(0, 3).map((item, i) => (
          <div
            key={item.id}
            className="p-4 rounded-lg bg-gray-700/20 border border-gray-700/30 text-center"
          >
            <div className={`w-10 h-10 mx-auto mb-3 rounded-lg bg-${accent}-500/20 flex items-center justify-center text-lg`}>
              {icons[i % icons.length]}
            </div>
            <EditableText
              value={item.title}
              onChange={(value) => handleTitleChange(item.id, value)}
              placeholder="Value Prop Title"
              className="text-sm font-semibold text-white mb-1 block"
              as="h3"
            />
            <EditableText
              value={item.subtitle || ""}
              onChange={(value) => handleSubtitleChange(item.id, value)}
              placeholder="Description text"
              className="text-xs text-gray-400 block"
              as="p"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
