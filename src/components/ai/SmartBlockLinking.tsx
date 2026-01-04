"use client";

/**
 * Smart Block Linking Component
 * 
 * Auto-suggests related blocks to connect based on content similarity
 */

import React, { useState, useMemo, useCallback } from "react";
import { useCanvasStore } from "@/lib/store";
import type { BlockData, BlockType } from "@/lib/types";
import { useToast } from "@/components/ui";

interface LinkSuggestion {
  blockId: string;
  title: string;
  type: BlockType;
  company: string;
  score: number;
  reason: string;
}

interface SmartBlockLinkingProps {
  currentBlockId: string;
}

// Relationship suggestions based on block types
const TYPE_RELATIONSHIPS: Record<BlockType, BlockType[]> = {
  PAIN_POINT: ["SOLUTION", "FEATURE"],
  SOLUTION: ["PAIN_POINT", "FEATURE", "TECH_COMPONENT"],
  FEATURE: ["SOLUTION", "PAIN_POINT", "TECH_COMPONENT"],
  CORE_VALUE_PROP: ["PAIN_POINT", "SOLUTION", "FEATURE"],
  COMPANY: ["CORE_VALUE_PROP", "VERTICAL"],
  VERTICAL: ["PAIN_POINT", "SOLUTION", "FEATURE"],
  ARTICLE: ["PAIN_POINT", "SOLUTION", "FEATURE", "CORE_VALUE_PROP"],
  TECH_COMPONENT: ["FEATURE", "SOLUTION"],
  PAGE_ROOT: ["CORE_VALUE_PROP", "PAIN_POINT", "SOLUTION", "FEATURE"],
};

// Simple keyword extraction
function extractKeywords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter((w) => !["this", "that", "with", "from", "have", "will", "your", "their"].includes(w));
}

// Calculate similarity score between two blocks
function calculateSimilarity(block1: BlockData, block2: BlockData): number {
  const keywords1 = new Set([
    ...extractKeywords(block1.title || ""),
    ...extractKeywords(block1.content || ""),
  ]);
  const keywords2 = new Set([
    ...extractKeywords(block2.title || ""),
    ...extractKeywords(block2.content || ""),
  ]);

  const intersection = [...keywords1].filter((k) => keywords2.has(k));
  const union = new Set([...keywords1, ...keywords2]);

  return union.size > 0 ? (intersection.length / union.size) * 100 : 0;
}

export default function SmartBlockLinking({ currentBlockId }: SmartBlockLinkingProps) {
  const { nodes, edges, addEdge } = useCanvasStore();
  const { success } = useToast();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentBlock = useMemo(() => {
    const node = nodes.find((n) => n.id === currentBlockId);
    return node?.data as BlockData | undefined;
  }, [nodes, currentBlockId]);

  // Get existing connections
  const existingConnections = useMemo(() => {
    return new Set(
      edges
        .filter((e) => e.source === currentBlockId || e.target === currentBlockId)
        .flatMap((e) => [e.source, e.target])
    );
  }, [edges, currentBlockId]);

  // Generate link suggestions
  const suggestions = useMemo((): LinkSuggestion[] => {
    if (!currentBlock) return [];

    const relatedTypes = TYPE_RELATIONSHIPS[currentBlock.type] || [];

    return nodes
      .filter((node) => {
        const data = node.data as BlockData;
        // Don't suggest self or already connected
        if (node.id === currentBlockId || existingConnections.has(node.id)) return false;
        // Must be same company or SHARED
        if (data.company !== currentBlock.company && data.company !== "SHARED" && currentBlock.company !== "SHARED") return false;
        return true;
      })
      .map((node) => {
        const data = node.data as BlockData;
        const typeMatch = relatedTypes.includes(data.type);
        const similarity = calculateSimilarity(currentBlock, data);

        // Calculate overall score
        let score = similarity;
        if (typeMatch) score += 30;
        if (data.status === "LIVE") score += 10;

        let reason = "";
        if (typeMatch && similarity > 20) {
          reason = `Related ${data.type.toLowerCase().replace("_", " ")} with similar content`;
        } else if (typeMatch) {
          reason = `Commonly linked ${data.type.toLowerCase().replace("_", " ")}`;
        } else if (similarity > 30) {
          reason = "Similar keywords in content";
        } else {
          reason = "Potential connection";
        }

        return {
          blockId: node.id,
          title: data.title || "Untitled",
          type: data.type,
          company: data.company,
          score,
          reason,
        };
      })
      .filter((s) => s.score > 15)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [nodes, currentBlock, currentBlockId, existingConnections]);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setShowSuggestions(true);
    // Simulate analysis delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsAnalyzing(false);
  }, []);

  const handleConnect = useCallback(
    (targetBlockId: string) => {
      addEdge({
        fromBlockId: currentBlockId,
        toBlockId: targetBlockId,
        relationshipType: "REFERENCES",
      });
      success("🔗 Connected", "Blocks are now linked");
    },
    [currentBlockId, addEdge, success]
  );

  const typeIcons: Record<BlockType, string> = {
    COMPANY: "🏢",
    CORE_VALUE_PROP: "💎",
    PAIN_POINT: "⚡",
    SOLUTION: "✅",
    FEATURE: "✨",
    VERTICAL: "🎯",
    ARTICLE: "📝",
    TECH_COMPONENT: "🔧",
    PAGE_ROOT: "📄",
  };

  if (!currentBlock) return null;

  return (
    <div className="mt-4 border-t border-slate-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <span>🔗</span>
          Smart Linking
        </h4>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="px-3 py-1.5 text-xs font-medium bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
        >
          {isAnalyzing ? "Finding..." : "Find Related Blocks"}
        </button>
      </div>

      {showSuggestions && (
        <div className="space-y-2">
          {isAnalyzing ? (
            <div className="py-3 text-center text-sm text-slate-500">
              <span className="animate-pulse">Analyzing connections...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-3 text-center text-sm text-slate-500">
              No related blocks found
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <div
                key={suggestion.blockId}
                className="flex items-center justify-between p-2.5 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span>{typeIcons[suggestion.type]}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {suggestion.title}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {suggestion.reason}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      suggestion.score > 50
                        ? "bg-green-500/10 text-green-400"
                        : suggestion.score > 30
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {Math.round(suggestion.score)}%
                  </span>
                  <button
                    onClick={() => handleConnect(suggestion.blockId)}
                    className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Link
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

