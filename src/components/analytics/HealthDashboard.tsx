"use client";

import React, { useMemo, useState } from "react";
import { useCanvasStore } from "@/lib/store";
import type { BlockData, BlockType, BlockStatus, Company } from "@/lib/types";
import { BLOCK_CONFIGS, COMPANY_COLORS } from "@/lib/types";
import { analyzeContent, calculateSLAStatus } from "@/lib/content-scoring";
import type { TabType } from "../dashboard/TabNavigation";
import VelocityMetrics from "./VelocityMetrics";
import SLADashboard from "./SLADashboard";
import ComparisonSnapshots from "./ComparisonSnapshots";
import CoverageReport from "./CoverageReport";
import GovernanceDashboard from "./GovernanceDashboard";
import RecommendationsPanel from "./RecommendationsPanel";

type AnalyticsView = "overview" | "governance";

interface HealthDashboardProps {
  onNavigate?: (tab: TabType) => void;
}

/**
 * HealthDashboard - Analytics view showing content health metrics
 * Displays block distribution, quality scores, coverage gaps, and SLA tracking
 */
export default function HealthDashboard({ onNavigate }: HealthDashboardProps) {
  const { nodes, edges, wireframeSections, roadmapItems, selectNodes } = useCanvasStore();
  const [view, setView] = useState<AnalyticsView>("overview");

  // Get all blocks
  const blocks = useMemo(() => {
    return nodes.map((n) => n.data as BlockData);
  }, [nodes]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const byStatus: Record<BlockStatus, number> = {
      LIVE: 0,
      VISION: 0,
      DRAFT: 0,
      ARCHIVED: 0,
      PENDING_REVIEW: 0,
      APPROVED: 0,
      NEEDS_CHANGES: 0,
    };

    const byType: Record<BlockType, number> = {
      COMPANY: 0,
      CORE_VALUE_PROP: 0,
      PAIN_POINT: 0,
      SOLUTION: 0,
      FEATURE: 0,
      VERTICAL: 0,
      ARTICLE: 0,
      TECH_COMPONENT: 0,
      PAGE_ROOT: 0,
    };

    const byCompany: Record<Company, number> = {
      CERE: 0,
      CEF: 0,
      SHARED: 0,
    };

    let totalQualityScore = 0;
    let qualityCount = 0;
    const qualityDistribution = { excellent: 0, good: 0, "needs-work": 0, poor: 0 };
    
    const overdueBlocks: BlockData[] = [];
    const warningBlocks: BlockData[] = [];
    const orphanedBlocks: BlockData[] = [];

    blocks.forEach((block) => {
      byStatus[block.status]++;
      byType[block.type]++;
      byCompany[block.company]++;

      // Quality analysis
      const fullText = [block.title, block.subtitle, block.content].filter(Boolean).join(". ");
      const score = analyzeContent(fullText);
      totalQualityScore += score.readabilityScore;
      qualityCount++;
      qualityDistribution[score.qualityRating]++;

      // SLA tracking
      if (block.status === "PENDING_REVIEW" && block.submittedForReviewAt) {
        const sla = calculateSLAStatus(block.submittedForReviewAt);
        if (sla.isOverdue) {
          overdueBlocks.push(block);
        } else if (sla.isWarning) {
          warningBlocks.push(block);
        }
      }

      // Orphaned blocks (no connections)
      const hasConnections = edges.some((e) => e.source === block.id || e.target === block.id);
      const isLinkedToWireframe = wireframeSections.some((s) => s.linkedBlockIds.includes(block.id));
      const isLinkedToRoadmap = roadmapItems.some((i) => i.linkedBlockIds.includes(block.id));
      if (!hasConnections && !isLinkedToWireframe && !isLinkedToRoadmap) {
        orphanedBlocks.push(block);
      }
    });

    // Coverage gaps - missing block types per company
    const coverageGaps: { company: Company; missingTypes: BlockType[] }[] = [];
    const essentialTypes: BlockType[] = ["CORE_VALUE_PROP", "PAIN_POINT", "SOLUTION", "FEATURE"];
    (["CERE", "CEF"] as Company[]).forEach((company) => {
      const companyBlocks = blocks.filter((b) => b.company === company || b.company === "SHARED");
      const missingTypes = essentialTypes.filter(
        (type) => !companyBlocks.some((b) => b.type === type)
      );
      if (missingTypes.length > 0) {
        coverageGaps.push({ company, missingTypes });
      }
    });

    return {
      total: blocks.length,
      byStatus,
      byType,
      byCompany,
      avgQualityScore: qualityCount > 0 ? Math.round(totalQualityScore / qualityCount) : 0,
      qualityDistribution,
      overdueBlocks,
      warningBlocks,
      orphanedBlocks,
      coverageGaps,
      connectionCount: edges.length,
    };
  }, [blocks, edges, wireframeSections, roadmapItems]);

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50" data-tour="analytics-header">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
                📊
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Content Health Dashboard
                </h1>
                <p className="text-slate-300 text-sm">
                  Analytics and insights for your content workflow
                </p>
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setView("overview")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === "overview"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📈 Overview
              </button>
              <button
                onClick={() => setView("governance")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === "governance"
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🛡️ Governance
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Governance View */}
        {view === "governance" && (
          <GovernanceDashboard onNavigate={(tab, itemId) => onNavigate?.(tab as TabType)} />
        )}
        
        {/* Overview View */}
        {view === "overview" && (
          <>
        {/* Top Stats Row */}
        <div className="grid grid-cols-5 gap-4" data-tour="analytics-stats">
          <StatCard
            icon="📦"
            label="Total Blocks"
            value={metrics.total}
            color="blue"
          />
          <StatCard
            icon="🔗"
            label="Connections"
            value={metrics.connectionCount}
            color="purple"
          />
          <StatCard
            icon="📝"
            label="Avg Readability"
            value={metrics.avgQualityScore}
            suffix="/100"
            color={metrics.avgQualityScore >= 60 ? "emerald" : metrics.avgQualityScore >= 40 ? "amber" : "red"}
          />
          <StatCard
            icon="🚨"
            label="Overdue Reviews"
            value={metrics.overdueBlocks.length}
            color="red"
            highlight={metrics.overdueBlocks.length > 0}
          />
          <StatCard
            icon="🔍"
            label="Orphaned Blocks"
            value={metrics.orphanedBlocks.length}
            color="amber"
            highlight={metrics.orphanedBlocks.length > 0}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Charts */}
          <div className="col-span-8 space-y-6">
            {/* Status Distribution */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5" data-tour="status-distribution">
              <h2 className="text-lg font-semibold text-white mb-4">Status Distribution</h2>
              <div className="space-y-3">
                {Object.entries(metrics.byStatus)
                  .filter(([, count]) => count > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <StatusBar
                      key={status}
                      status={status as BlockStatus}
                      count={count}
                      total={metrics.total}
                    />
                  ))}
              </div>
            </div>

            {/* Block Type Distribution */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5" data-tour="block-types">
              <h2 className="text-lg font-semibold text-white mb-4">Block Types</h2>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(metrics.byType)
                  .filter(([, count]) => count > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const config = BLOCK_CONFIGS[type as BlockType];
                    return (
                      <div
                        key={type}
                        className="p-3 rounded-lg border border-slate-700/50"
                        style={{ backgroundColor: `${config.color}10` }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{config.icon}</span>
                          <span className="text-2xl font-bold text-white">{count}</span>
                        </div>
                        <div className="text-xs text-slate-400">{config.label}</div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Quality Distribution */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5" data-tour="content-quality">
              <h2 className="text-lg font-semibold text-white mb-4">Content Quality</h2>
              <div className="grid grid-cols-4 gap-3">
                <QualityCard rating="excellent" count={metrics.qualityDistribution.excellent} total={metrics.total} />
                <QualityCard rating="good" count={metrics.qualityDistribution.good} total={metrics.total} />
                <QualityCard rating="needs-work" count={metrics.qualityDistribution["needs-work"]} total={metrics.total} />
                <QualityCard rating="poor" count={metrics.qualityDistribution.poor} total={metrics.total} />
              </div>
            </div>
          </div>

          {/* Right Column - Alerts & Issues */}
          <div className="col-span-4 space-y-6">
            {/* Company Distribution */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5" data-tour="company-breakdown">
              <h2 className="text-lg font-semibold text-white mb-4">By Company</h2>
              <div className="space-y-3">
                {(["CERE", "CEF", "SHARED"] as Company[]).map((company) => {
                  const count = metrics.byCompany[company];
                  const colors = COMPANY_COLORS[company];
                  const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                  return (
                    <div key={company} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <span className="text-sm text-slate-300 flex-1">{company}</span>
                      <span className="text-sm font-medium text-white">{count}</span>
                      <span className="text-xs text-slate-500 w-12 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overdue Reviews */}
            {metrics.overdueBlocks.length > 0 && (
              <div className="bg-red-500/10 rounded-xl border border-red-500/30 p-5" data-tour="overdue-reviews">
                <h2 className="text-lg font-semibold text-red-300 mb-3 flex items-center gap-2">
                  🚨 Overdue Reviews
                </h2>
                <p className="text-xs text-red-400/70 mb-3">Click to view in Content Schema</p>
                <div className="space-y-2">
                  {metrics.overdueBlocks.slice(0, 5).map((block) => {
                    const sla = calculateSLAStatus(block.submittedForReviewAt);
                    return (
                      <button
                        key={block.id}
                        onClick={() => {
                          selectNodes([block.id]);
                          onNavigate?.("schema");
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-left group"
                      >
                        <span>{BLOCK_CONFIGS[block.type].icon}</span>
                        <span className="text-sm text-white flex-1 truncate group-hover:text-red-200">{block.title}</span>
                        <span className="text-xs text-red-300">{sla.hoursInReview}h</span>
                        <span className="text-xs text-red-400 opacity-0 group-hover:opacity-100">→</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coverage Gaps */}
            {metrics.coverageGaps.length > 0 && (
              <div className="bg-amber-500/10 rounded-xl border border-amber-500/30 p-5" data-tour="coverage-gaps">
                <h2 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
                  ⚠️ Coverage Gaps
                </h2>
                <div className="space-y-3">
                  {metrics.coverageGaps.map(({ company, missingTypes }) => (
                    <div key={company}>
                      <div className="text-sm text-slate-400 mb-1">{company} is missing:</div>
                      <div className="flex flex-wrap gap-1">
                        {missingTypes.map((type) => (
                          <span
                            key={type}
                            className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300"
                          >
                            {BLOCK_CONFIGS[type].label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orphaned Blocks */}
            {metrics.orphanedBlocks.length > 0 && (
              <div className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-5" data-tour="orphaned-blocks">
                <h2 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  🔍 Orphaned Blocks
                </h2>
                <p className="text-xs text-slate-500 mb-3">
                  These blocks have no connections. Click to view and connect them.
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {metrics.orphanedBlocks.slice(0, 10).map((block) => (
                    <button
                      key={block.id}
                      onClick={() => {
                        selectNodes([block.id]);
                        onNavigate?.("schema");
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-left group"
                    >
                      <span>{BLOCK_CONFIGS[block.type].icon}</span>
                      <span className="text-sm text-slate-300 flex-1 truncate group-hover:text-white">{block.title}</span>
                      <span className="text-xs text-slate-500">{block.company}</span>
                      <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Analytics Row */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <VelocityMetrics />
          <SLADashboard />
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <ComparisonSnapshots />
          <CoverageReport />
        </div>
        
        {/* Recommendations Section */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 mt-6">
          <RecommendationsPanel 
            onNavigate={(tab, itemId) => onNavigate?.(tab as TabType)} 
            maxItems={5}
          />
        </div>
          </>
        )}
      </div>
    </div>
  );
}

// Stat card component
function StatCard({
  icon,
  label,
  value,
  suffix = "",
  color,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
  color: "blue" | "amber" | "purple" | "emerald" | "red";
  highlight?: boolean;
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    red: "from-red-500/20 to-red-600/10 border-red-500/30",
  };

  const textColors = {
    blue: "text-blue-400",
    amber: "text-amber-400",
    purple: "text-purple-400",
    emerald: "text-emerald-400",
    red: "text-red-400",
  };

  return (
    <div
      className={`
        relative p-4 rounded-xl border bg-gradient-to-br
        ${colorClasses[color]}
        ${highlight ? "ring-2 ring-offset-2 ring-offset-slate-950 ring-" + color + "-500/50 animate-pulse" : ""}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className={`text-2xl font-bold ${textColors[color]}`}>
            {value}{suffix}
          </div>
          <div className="text-slate-400 text-xs">{label}</div>
        </div>
      </div>
    </div>
  );
}

// Status bar component
function StatusBar({
  status,
  count,
  total,
}: {
  status: BlockStatus;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  
  const statusConfig: Record<BlockStatus, { label: string; color: string; icon: string }> = {
    LIVE: { label: "Live", color: "#22c55e", icon: "🟢" },
    VISION: { label: "Vision", color: "#8b5cf6", icon: "🔮" },
    DRAFT: { label: "Draft", color: "#6b7280", icon: "📝" },
    ARCHIVED: { label: "Archived", color: "#374151", icon: "📦" },
    PENDING_REVIEW: { label: "Pending Review", color: "#f59e0b", icon: "⏳" },
    APPROVED: { label: "Approved", color: "#10b981", icon: "✅" },
    NEEDS_CHANGES: { label: "Needs Changes", color: "#ef4444", icon: "🔄" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-32 flex items-center gap-2 text-slate-400">
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
      <div className="flex-1 h-4 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: config.color }}
        />
      </div>
      <span className="text-sm font-medium text-white w-8 text-right">{count}</span>
      <span className="text-xs text-slate-500 w-10 text-right">{pct}%</span>
    </div>
  );
}

// Quality card component
function QualityCard({
  rating,
  count,
  total,
}: {
  rating: "excellent" | "good" | "needs-work" | "poor";
  count: number;
  total: number;
}) {
  const config = {
    excellent: { label: "Excellent", color: "#22c55e", icon: "✨" },
    good: { label: "Good", color: "#3b82f6", icon: "👍" },
    "needs-work": { label: "Needs Work", color: "#f59e0b", icon: "⚠️" },
    poor: { label: "Poor", color: "#ef4444", icon: "❌" },
  }[rating];

  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div
      className="p-3 rounded-lg border border-slate-700/50"
      style={{ backgroundColor: `${config.color}10` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{config.icon}</span>
        <span className="text-xl font-bold text-white">{count}</span>
      </div>
      <div className="text-xs text-slate-400">{config.label}</div>
      <div className="text-[10px] text-slate-500">{pct}% of blocks</div>
    </div>
  );
}

