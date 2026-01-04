"use client";

import React, { useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import type { Company, BlockType, GovernanceMetrics } from "@/lib/types";
import RecommendationsPanel from "./RecommendationsPanel";

interface GovernanceDashboardProps {
  onNavigate?: (tab: string, itemId?: string) => void;
}

/**
 * GovernanceDashboard - Content health and governance overview
 * 
 * Displays:
 * - Freshness Score (blocks by last update date)
 * - Orphan Detection (blocks not linked anywhere)
 * - Broken Links (sections with missing blocks)
 * - Coverage Matrix (company x type heatmap)
 * - Actionable Recommendations
 */
export default function GovernanceDashboard({ onNavigate }: GovernanceDashboardProps) {
  const { calculateGovernanceMetrics, nodes } = useCanvasStore();

  const metrics = useMemo(() => {
    return calculateGovernanceMetrics();
  }, [calculateGovernanceMetrics]);

  const totalBlocks = nodes.filter((n) => n.data.status !== "ARCHIVED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📊</span>
            Content Governance
          </h2>
          <p className="text-slate-400 text-sm">
            Monitor content health and identify areas for improvement
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{totalBlocks}</div>
          <div className="text-xs text-slate-500">Total Active Blocks</div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        <FreshnessCard metrics={metrics} />
        <OrphansCard metrics={metrics} onNavigate={onNavigate} />
        <BrokenLinksCard metrics={metrics} onNavigate={onNavigate} />
        <CoverageCard metrics={metrics} />
      </div>

      {/* Coverage Matrix */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span>🎯</span>
          Coverage Matrix
        </h3>
        <CoverageMatrix metrics={metrics} />
      </div>

      {/* Recommendations */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
        <RecommendationsPanel onNavigate={onNavigate} maxItems={5} />
      </div>
    </div>
  );
}

function FreshnessCard({ metrics }: { metrics: GovernanceMetrics }) {
  const { fresh, stale, veryStale } = metrics.freshness;
  const total = fresh + stale + veryStale;
  
  const freshPercent = total > 0 ? Math.round((fresh / total) * 100) : 0;
  const stalePercent = total > 0 ? Math.round((stale / total) * 100) : 0;
  const veryStalePercent = total > 0 ? Math.round((veryStale / total) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🌿</span>
        <div>
          <h3 className="text-green-400 font-semibold">Freshness</h3>
          <p className="text-xs text-slate-500">Content age breakdown</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-400">Fresh (0-30 days)</span>
          <span className="text-white font-medium">{fresh} ({freshPercent}%)</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500"
            style={{ width: `${freshPercent}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-amber-400">Aging (30-90 days)</span>
          <span className="text-white font-medium">{stale} ({stalePercent}%)</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500"
            style={{ width: `${stalePercent}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-red-400">Stale (90+ days)</span>
          <span className="text-white font-medium">{veryStale} ({veryStalePercent}%)</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500"
            style={{ width: `${veryStalePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function OrphansCard({ 
  metrics, 
  onNavigate 
}: { 
  metrics: GovernanceMetrics; 
  onNavigate?: (tab: string, itemId?: string) => void;
}) {
  const { count, blocks } = metrics.orphans;

  return (
    <div className={`rounded-xl border p-4 ${
      count > 0 
        ? "bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30"
        : "bg-gradient-to-br from-slate-700/30 to-slate-800/30 border-slate-700/50"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🏝️</span>
        <div>
          <h3 className={count > 0 ? "text-amber-400 font-semibold" : "text-slate-400 font-semibold"}>
            Orphaned Blocks
          </h3>
          <p className="text-xs text-slate-500">Not linked anywhere</p>
        </div>
      </div>
      
      <div className="text-3xl font-bold mb-2" style={{ color: count > 0 ? "#f59e0b" : "#6b7280" }}>
        {count}
      </div>
      
      {count > 0 && (
        <>
          <div className="space-y-1 mb-3 max-h-24 overflow-y-auto">
            {blocks.slice(0, 3).map((block) => (
              <div key={block.id} className="text-xs text-slate-400 truncate">
                • {block.title}
              </div>
            ))}
            {blocks.length > 3 && (
              <div className="text-xs text-slate-500">+{blocks.length - 3} more</div>
            )}
          </div>
          <button
            onClick={() => onNavigate?.("schema")}
            className="text-xs text-amber-400 hover:text-amber-300"
          >
            Review orphans →
          </button>
        </>
      )}
      
      {count === 0 && (
        <p className="text-xs text-slate-500">All blocks are linked!</p>
      )}
    </div>
  );
}

function BrokenLinksCard({ 
  metrics,
  onNavigate,
}: { 
  metrics: GovernanceMetrics;
  onNavigate?: (tab: string) => void;
}) {
  const { count, sections } = metrics.brokenLinks;

  return (
    <div className={`rounded-xl border p-4 ${
      count > 0 
        ? "bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30"
        : "bg-gradient-to-br from-slate-700/30 to-slate-800/30 border-slate-700/50"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🔗</span>
        <div>
          <h3 className={count > 0 ? "text-red-400 font-semibold" : "text-slate-400 font-semibold"}>
            Broken Links
          </h3>
          <p className="text-xs text-slate-500">Missing block references</p>
        </div>
      </div>
      
      <div className="text-3xl font-bold mb-2" style={{ color: count > 0 ? "#ef4444" : "#6b7280" }}>
        {count}
      </div>
      
      {count > 0 && (
        <>
          <div className="space-y-1 mb-3 max-h-24 overflow-y-auto">
            {sections.slice(0, 3).map((section) => (
              <div key={section.id} className="text-xs text-slate-400 truncate">
                • {section.pageName}
              </div>
            ))}
            {sections.length > 3 && (
              <div className="text-xs text-slate-500">+{sections.length - 3} more</div>
            )}
          </div>
          <button
            onClick={() => onNavigate?.("wireframe")}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Fix broken links →
          </button>
        </>
      )}
      
      {count === 0 && (
        <p className="text-xs text-slate-500">All links are valid!</p>
      )}
    </div>
  );
}

function CoverageCard({ metrics }: { metrics: GovernanceMetrics }) {
  const { gaps } = metrics.coverage;

  return (
    <div className={`rounded-xl border p-4 ${
      gaps.length > 0 
        ? "bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30"
        : "bg-gradient-to-br from-slate-700/30 to-slate-800/30 border-slate-700/50"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🎯</span>
        <div>
          <h3 className={gaps.length > 0 ? "text-purple-400 font-semibold" : "text-slate-400 font-semibold"}>
            Coverage Gaps
          </h3>
          <p className="text-xs text-slate-500">Missing content types</p>
        </div>
      </div>
      
      <div className="text-3xl font-bold mb-2" style={{ color: gaps.length > 0 ? "#a855f7" : "#6b7280" }}>
        {gaps.length}
      </div>
      
      {gaps.length > 0 && (
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {gaps.slice(0, 4).map((gap, i) => (
            <div key={i} className="text-xs text-slate-400">
              • {gap.company}: {gap.type.replace(/_/g, " ").toLowerCase()}
            </div>
          ))}
          {gaps.length > 4 && (
            <div className="text-xs text-slate-500">+{gaps.length - 4} more</div>
          )}
        </div>
      )}
      
      {gaps.length === 0 && (
        <p className="text-xs text-slate-500">All types covered!</p>
      )}
    </div>
  );
}

function CoverageMatrix({ metrics }: { metrics: GovernanceMetrics }) {
  const { byCompany, byType, gaps } = metrics.coverage;
  
  const companies: Company[] = ["CERE", "CEF", "SHARED"];
  const types: BlockType[] = [
    "CORE_VALUE_PROP",
    "PAIN_POINT",
    "SOLUTION",
    "FEATURE",
    "VERTICAL",
    "ARTICLE",
    "TECH_COMPONENT",
  ];

  // Calculate counts per company/type
  const { nodes } = useCanvasStore();
  const matrix = useMemo(() => {
    const result: Record<Company, Record<BlockType, number>> = {
      CERE: {} as Record<BlockType, number>,
      CEF: {} as Record<BlockType, number>,
      SHARED: {} as Record<BlockType, number>,
    };
    
    companies.forEach((company) => {
      types.forEach((type) => {
        result[company][type] = 0;
      });
    });
    
    nodes.forEach((n) => {
      const data = n.data;
      if (data.status !== "ARCHIVED" && result[data.company as Company]) {
        result[data.company as Company][data.type as BlockType] = 
          (result[data.company as Company][data.type as BlockType] || 0) + 1;
      }
    });
    
    return result;
  }, [nodes]);

  const getIntensity = (count: number): string => {
    if (count === 0) return "bg-slate-800";
    if (count <= 2) return "bg-green-900/50";
    if (count <= 5) return "bg-green-700/50";
    return "bg-green-500/50";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left text-slate-500 font-normal p-2"></th>
            {types.map((type) => (
              <th key={type} className="text-center text-slate-400 font-medium p-2">
                <div className="writing-mode-vertical transform -rotate-45 origin-center w-16 truncate">
                  {type.replace(/_/g, " ")}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company}>
              <td className="text-slate-300 font-medium p-2 whitespace-nowrap">
                {company === "CERE" ? "🔵" : company === "CEF" ? "🟣" : "🟢"} {company}
              </td>
              {types.map((type) => {
                const count = matrix[company][type] || 0;
                const isGap = gaps.some((g) => g.company === company && g.type === type);
                
                return (
                  <td key={type} className="p-1 text-center">
                    <div
                      className={`
                        w-full h-8 rounded flex items-center justify-center font-medium
                        ${isGap ? "ring-2 ring-red-500/50" : ""}
                        ${getIntensity(count)}
                      `}
                    >
                      {count > 0 ? (
                        <span className="text-white">{count}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span>Coverage intensity:</span>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-slate-800 rounded" /> 0
          <span className="w-4 h-4 bg-green-900/50 rounded" /> 1-2
          <span className="w-4 h-4 bg-green-700/50 rounded" /> 3-5
          <span className="w-4 h-4 bg-green-500/50 rounded" /> 6+
          <span className="w-4 h-4 ring-2 ring-red-500/50 rounded bg-slate-800" /> Gap
        </div>
      </div>
    </div>
  );
}


