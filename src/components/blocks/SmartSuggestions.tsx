"use client";

import React, { useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, type BlockType, type BlockData } from "@/lib/types";

interface Suggestion {
  id: string;
  type: BlockType;
  reason: string;
  priority: "high" | "medium" | "low";
}

/**
 * SmartSuggestions - AI-powered suggestions for missing blocks
 */
export default function SmartSuggestions() {
  const { nodes, addNode } = useCanvasStore();

  // Analyze current blocks and suggest missing ones
  const suggestions = useMemo((): Suggestion[] => {
    const blocks = nodes.map((n) => n.data as unknown as BlockData);
    const blockTypeCount: Record<string, number> = {};
    
    // Count block types
    blocks.forEach((b) => {
      blockTypeCount[b.type] = (blockTypeCount[b.type] || 0) + 1;
    });

    const suggestions: Suggestion[] = [];

    // Rule-based suggestions
    if (!blockTypeCount["CORE_VALUE_PROP"] || blockTypeCount["CORE_VALUE_PROP"] < 2) {
      suggestions.push({
        id: "suggest-vp",
        type: "CORE_VALUE_PROP",
        reason: "Add more value propositions to strengthen your messaging",
        priority: "high",
      });
    }

    if (!blockTypeCount["PAIN_POINT"] || blockTypeCount["PAIN_POINT"] < 3) {
      suggestions.push({
        id: "suggest-pain",
        type: "PAIN_POINT",
        reason: "Identify more customer pain points to address",
        priority: "medium",
      });
    }

    if (!blockTypeCount["SOLUTION"]) {
      suggestions.push({
        id: "suggest-solution",
        type: "SOLUTION",
        reason: "Add solutions that address your identified pain points",
        priority: "high",
      });
    }

    if (!blockTypeCount["FEATURE"] || blockTypeCount["FEATURE"] < 3) {
      suggestions.push({
        id: "suggest-feature",
        type: "FEATURE",
        reason: "Showcase more product features",
        priority: "medium",
      });
    }

    if (!blockTypeCount["VERTICAL"]) {
      suggestions.push({
        id: "suggest-vertical",
        type: "VERTICAL",
        reason: "Define industry verticals or use cases",
        priority: "low",
      });
    }

    if (!blockTypeCount["ARTICLE"]) {
      suggestions.push({
        id: "suggest-article",
        type: "ARTICLE",
        reason: "Add articles or blog content for SEO",
        priority: "low",
      });
    }

    return suggestions.slice(0, 3); // Show top 3 suggestions
  }, [nodes]);

  const handleAddSuggested = (type: BlockType) => {
    const config = BLOCK_CONFIGS[type];
    addNode({
      type,
      title: `New ${config.label}`,
      subtitle: "Edit this block",
      company: "SHARED",
      status: "DRAFT",
    });
  };

  if (suggestions.length === 0) {
    return (
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-base">✨</span>
          Suggestions
        </h3>
        <div className="text-center py-4 text-gray-500">
          <div className="text-2xl mb-2">🎉</div>
          <p className="text-xs">Great coverage! No suggestions right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="text-base">✨</span>
        AI Suggestions
      </h3>
      <div className="space-y-2">
        {suggestions.map((suggestion) => {
          const config = BLOCK_CONFIGS[suggestion.type];
          return (
            <div
              key={suggestion.id}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/5 to-purple-500/5"
            >
              <div className="flex items-start gap-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: `${config.borderColor}20` }}
                >
                  {config.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Add {config.label}
                    </p>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                        suggestion.priority === "high"
                          ? "bg-red-500/20 text-red-400"
                          : suggestion.priority === "medium"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {suggestion.priority}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {suggestion.reason}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAddSuggested(suggestion.type)}
                className="mt-2 w-full px-3 py-1.5 text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"
              >
                + Add {config.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

