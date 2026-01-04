"use client";

import React, { useMemo } from "react";
import {
  analyzeContent,
  getQualityColor,
  getQualityLabel,
} from "@/lib/content-scoring";

interface ContentScorePanelProps {
  content: string | null | undefined;
  title: string | null | undefined;
  subtitle: string | null | undefined;
}

/**
 * ContentScorePanel - Displays readability metrics and content quality
 */
export default function ContentScorePanel({
  content,
  title,
  subtitle,
}: ContentScorePanelProps) {
  // Combine all text for analysis
  const fullText = [title, subtitle, content].filter(Boolean).join(". ");
  const score = useMemo(() => analyzeContent(fullText), [fullText]);

  const qualityColor = getQualityColor(score.qualityRating);
  const qualityLabel = getQualityLabel(score.qualityRating);

  return (
    <div className="space-y-3">
      {/* Header with quality badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          Content Quality
        </h3>
        <span
          className="px-2 py-1 text-xs font-semibold rounded-full"
          style={{
            backgroundColor: `${qualityColor}20`,
            color: qualityColor,
          }}
        >
          {qualityLabel}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Words" value={score.wordCount} target="15-100" />
        <StatBox
          label="Readability"
          value={score.readabilityScore}
          suffix="/100"
          target="60+"
          color={score.readabilityScore >= 60 ? "#22c55e" : score.readabilityScore >= 40 ? "#f59e0b" : "#ef4444"}
        />
        <StatBox
          label="Sentences"
          value={score.sentenceCount}
        />
        <StatBox
          label="Avg Words/Sentence"
          value={score.avgWordsPerSentence}
          target="<20"
          color={score.avgWordsPerSentence <= 20 ? "#22c55e" : "#f59e0b"}
        />
      </div>

      {/* Reading level */}
      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <span className="text-xs text-gray-600 dark:text-gray-400">Reading Level</span>
        <span className="text-xs font-medium text-gray-900 dark:text-white">
          📚 {score.readingLevel}
        </span>
      </div>

      {/* Suggestions */}
      {score.suggestions.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400">
            💡 Suggestions
          </h4>
          <ul className="space-y-1">
            {score.suggestions.map((suggestion, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400"
              >
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Stat box component
function StatBox({
  label,
  value,
  suffix = "",
  target,
  color,
}: {
  label: string;
  value: number;
  suffix?: string;
  target?: string;
  color?: string;
}) {
  return (
    <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-lg font-bold"
          style={{ color: color || "inherit" }}
        >
          {value}
        </span>
        {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
      </div>
      {target && (
        <div className="text-[10px] text-gray-400">Target: {target}</div>
      )}
    </div>
  );
}

