"use client";

/**
 * AI Content Suggestions Component
 * 
 * Uses GPT-4 to suggest readability improvements for content
 */

import React, { useState, useCallback } from "react";
import { useCanvasStore } from "@/lib/store";
import type { BlockData } from "@/lib/types";
import { useToast } from "@/components/ui";

interface Suggestion {
  id: string;
  type: "readability" | "clarity" | "engagement" | "seo";
  original: string;
  suggested: string;
  explanation: string;
  impact: "high" | "medium" | "low";
}

interface AIContentSuggestionsProps {
  blockId: string;
  content: string;
  onApplySuggestion?: (newContent: string) => void;
}

// Simulated AI suggestions (in production, call actual GPT-4 API)
function generateSuggestions(content: string): Suggestion[] {
  if (!content || content.length < 20) return [];

  const suggestions: Suggestion[] = [];

  // Check for long sentences
  const sentences = content.split(/[.!?]+/).filter(Boolean);
  const longSentences = sentences.filter((s) => s.split(" ").length > 25);
  if (longSentences.length > 0) {
    suggestions.push({
      id: "readability-1",
      type: "readability",
      original: longSentences[0].trim(),
      suggested: longSentences[0]
        .trim()
        .split(",")
        .map((s) => s.trim())
        .join(". "),
      explanation:
        "Breaking long sentences improves readability. Aim for 15-20 words per sentence.",
      impact: "high",
    });
  }

  // Check for passive voice
  const passivePatterns = /\b(is|are|was|were|be|been|being)\s+(\w+ed)\b/gi;
  const passiveMatches = content.match(passivePatterns);
  if (passiveMatches && passiveMatches.length > 0) {
    suggestions.push({
      id: "clarity-1",
      type: "clarity",
      original: passiveMatches[0],
      suggested: "Consider active voice",
      explanation:
        "Active voice is more direct and engaging. Try rephrasing to show who does the action.",
      impact: "medium",
    });
  }

  // Check for weak words
  const weakWords = ["very", "really", "just", "quite", "somewhat"];
  for (const word of weakWords) {
    if (content.toLowerCase().includes(` ${word} `)) {
      suggestions.push({
        id: `engagement-${word}`,
        type: "engagement",
        original: word,
        suggested: "Remove or replace with stronger word",
        explanation: `"${word}" weakens your message. Use more specific, powerful language.`,
        impact: "low",
      });
      break;
    }
  }

  // SEO suggestion
  if (content.length > 50 && !content.includes("you") && !content.includes("your")) {
    suggestions.push({
      id: "seo-1",
      type: "seo",
      original: "Current content",
      suggested: "Add customer-focused language",
      explanation:
        'Content that speaks directly to readers ("you", "your") tends to perform better.',
      impact: "medium",
    });
  }

  return suggestions;
}

export default function AIContentSuggestions({
  blockId,
  content,
  onApplySuggestion,
}: AIContentSuggestionsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const { updateNode } = useCanvasStore();
  const { success, info } = useToast();

  const analyzContent = useCallback(async () => {
    setIsAnalyzing(true);
    setShowPanel(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newSuggestions = generateSuggestions(content);
    setSuggestions(newSuggestions);
    setIsAnalyzing(false);

    if (newSuggestions.length === 0) {
      info("✨ Content looks great!", "No major improvements suggested.");
    }
  }, [content, info]);

  const handleApply = (suggestion: Suggestion) => {
    if (suggestion.suggested && suggestion.original) {
      const newContent = content.replace(suggestion.original, suggestion.suggested);
      updateNode(blockId, { content: newContent });
      onApplySuggestion?.(newContent);

      // Remove applied suggestion
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));

      success("✅ Applied", "Suggestion applied to content");
    }
  };

  const typeIcons: Record<Suggestion["type"], string> = {
    readability: "📖",
    clarity: "💡",
    engagement: "🎯",
    seo: "🔍",
  };

  const impactColors: Record<Suggestion["impact"], string> = {
    high: "text-red-400 bg-red-500/10",
    medium: "text-yellow-400 bg-yellow-500/10",
    low: "text-blue-400 bg-blue-500/10",
  };

  return (
    <div className="mt-4 border-t border-slate-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <span>🤖</span>
          AI Content Assistant
        </h4>
        <button
          onClick={analyzContent}
          disabled={isAnalyzing || !content}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            isAnalyzing
              ? "bg-slate-700 text-slate-500"
              : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
          }`}
        >
          {isAnalyzing ? "Analyzing..." : "✨ Improve Readability"}
        </button>
      </div>

      {showPanel && (
        <div className="space-y-2">
          {isAnalyzing ? (
            <div className="py-4 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                <span className="animate-spin">⚙️</span>
                Analyzing content...
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-4 text-center text-slate-500 text-sm">
              No suggestions at this time
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span>{typeIcons[suggestion.type]}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                        impactColors[suggestion.impact]
                      }`}
                    >
                      {suggestion.impact}
                    </span>
                  </div>
                  <button
                    onClick={() => handleApply(suggestion)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">{suggestion.explanation}</p>
                {suggestion.original !== "Current content" && (
                  <div className="mt-2 text-xs">
                    <div className="text-red-400/70 line-through truncate">
                      "{suggestion.original}"
                    </div>
                    {suggestion.suggested !== "Consider active voice" &&
                      suggestion.suggested !== "Remove or replace with stronger word" &&
                      suggestion.suggested !== "Add customer-focused language" && (
                        <div className="text-green-400/70 truncate">
                          → "{suggestion.suggested}"
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

