"use client";

import React, { useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import type { ContentRecommendation, RecommendationSeverity } from "@/lib/types";

interface RecommendationsPanelProps {
  onNavigate?: (tab: string, itemId?: string) => void;
  maxItems?: number;
  compact?: boolean;
}

const SEVERITY_STYLES: Record<RecommendationSeverity, { bg: string; border: string; text: string; icon: string }> = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    icon: "🔴",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    icon: "🟡",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    icon: "🔵",
  },
};

/**
 * RecommendationsPanel - Displays actionable recommendations based on content health analysis
 * 
 * Shows:
 * - Stale content (not updated in 90+ days)
 * - Stuck in review (PENDING_REVIEW for 7+ days)
 * - Orphaned blocks (not linked anywhere)
 * - Missing coverage (company/type combinations with no blocks)
 * - Broken links (sections linking to deleted blocks)
 */
export default function RecommendationsPanel({
  onNavigate,
  maxItems = 10,
  compact = false,
}: RecommendationsPanelProps) {
  const { generateRecommendations } = useCanvasStore();

  const recommendations = useMemo(() => {
    return generateRecommendations().slice(0, maxItems);
  }, [generateRecommendations, maxItems]);

  if (recommendations.length === 0) {
    return (
      <div className={`${compact ? "p-4" : "p-6"} text-center`}>
        <div className="text-4xl mb-2">✨</div>
        <p className="text-slate-400 text-sm">
          Everything looks great! No recommendations at this time.
        </p>
      </div>
    );
  }

  const criticalCount = recommendations.filter((r) => r.severity === "critical").length;
  const warningCount = recommendations.filter((r) => r.severity === "warning").length;

  return (
    <div className="space-y-3">
      {/* Summary Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span>💡</span>
            Recommendations
          </h3>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                {warningCount} warnings
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-2">
        {recommendations.map((rec) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            onAction={() => {
              if (rec.action.type === "navigate" && rec.action.target) {
                onNavigate?.(rec.action.target, rec.affectedItems[0]?.id);
              }
            }}
            compact={compact}
          />
        ))}
      </div>

      {/* View All Link */}
      {recommendations.length >= maxItems && !compact && (
        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate?.("analytics")}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all recommendations →
          </button>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  recommendation,
  onAction,
  compact,
}: {
  recommendation: ContentRecommendation;
  onAction: () => void;
  compact: boolean;
}) {
  const styles = SEVERITY_STYLES[recommendation.severity];

  return (
    <div
      className={`${styles.bg} border ${styles.border} rounded-lg ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{styles.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className={`${styles.text} font-medium ${compact ? "text-xs" : "text-sm"}`}>
            {recommendation.title}
          </h4>
          {!compact && (
            <p className="text-slate-400 text-xs mt-1">
              {recommendation.message}
            </p>
          )}
          
          {/* Affected Items */}
          {recommendation.affectedItems.length > 0 && !compact && (
            <div className="flex flex-wrap gap-1 mt-2">
              {recommendation.affectedItems.slice(0, 3).map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800/50 rounded text-[10px] text-slate-400"
                >
                  {item.type === "block" ? "📦" : item.type === "section" ? "📄" : "📅"}
                  <span className="max-w-[120px] truncate">{item.title}</span>
                </span>
              ))}
              {recommendation.affectedItems.length > 3 && (
                <span className="text-[10px] text-slate-500">
                  +{recommendation.affectedItems.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <button
          onClick={onAction}
          className={`shrink-0 px-2 py-1 rounded text-xs font-medium transition-colors ${
            recommendation.severity === "critical"
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : recommendation.severity === "warning"
              ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          }`}
        >
          {recommendation.action.label}
        </button>
      </div>
    </div>
  );
}

/**
 * Mini version for embedding in other panels
 */
export function RecommendationsMini({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { generateRecommendations } = useCanvasStore();
  
  const recommendations = useMemo(() => {
    return generateRecommendations().slice(0, 3);
  }, [generateRecommendations]);

  if (recommendations.length === 0) return null;

  const criticalCount = recommendations.filter((r) => r.severity === "critical").length;

  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">Recommendations</span>
        {criticalCount > 0 && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
      <div className="space-y-1">
        {recommendations.map((rec) => {
          const styles = SEVERITY_STYLES[rec.severity];
          return (
            <button
              key={rec.id}
              onClick={() => onNavigate?.("analytics")}
              className={`w-full text-left p-2 rounded ${styles.bg} hover:opacity-80 transition-opacity`}
            >
              <span className={`text-xs ${styles.text} line-clamp-1`}>
                {styles.icon} {rec.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


