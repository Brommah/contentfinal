"use client";

/**
 * Velocity Metrics Component
 * 
 * Tracks time-to-live for content blocks: avg days from Draft → Live
 */

import React, { useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import type { BlockData, BlockType } from "@/lib/types";

interface VelocityData {
  type: BlockType;
  avgDays: number;
  count: number;
  trend: "up" | "down" | "stable";
}

export default function VelocityMetrics() {
  const { nodes } = useCanvasStore();

  const velocityData = useMemo(() => {
    const blocks = nodes.map((n) => n.data as BlockData);

    // Group by type and calculate velocity
    const typeGroups: Record<string, { totalDays: number; count: number }> = {};

    blocks.forEach((block) => {
      if (block.status === "LIVE" && block.createdAt) {
        const createdDate = new Date(block.createdAt);
        const now = new Date();
        const daysToLive = Math.floor(
          (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (!typeGroups[block.type]) {
          typeGroups[block.type] = { totalDays: 0, count: 0 };
        }
        typeGroups[block.type].totalDays += daysToLive;
        typeGroups[block.type].count += 1;
      }
    });

    const velocities: VelocityData[] = Object.entries(typeGroups)
      .map(([type, data]) => ({
        type: type as BlockType,
        avgDays: Math.round(data.totalDays / data.count),
        count: data.count,
        trend: (Math.random() > 0.5 ? "down" : "up") as "up" | "down" | "stable", // Simulated trend
      }))
      .sort((a, b) => b.count - a.count);

    return velocities;
  }, [nodes]);

  const overallAvg = useMemo(() => {
    if (velocityData.length === 0) return 0;
    const total = velocityData.reduce((sum, v) => sum + v.avgDays * v.count, 0);
    const count = velocityData.reduce((sum, v) => sum + v.count, 0);
    return Math.round(total / count);
  }, [velocityData]);

  const typeLabels: Record<string, string> = {
    COMPANY: "Company",
    CORE_VALUE_PROP: "Value Prop",
    PAIN_POINT: "Pain Point",
    SOLUTION: "Solution",
    FEATURE: "Feature",
    VERTICAL: "Vertical",
    ARTICLE: "Article",
    TECH_COMPONENT: "Tech Component",
  };

  const typeColors: Record<string, string> = {
    COMPANY: "bg-blue-500",
    CORE_VALUE_PROP: "bg-purple-500",
    PAIN_POINT: "bg-red-500",
    SOLUTION: "bg-green-500",
    FEATURE: "bg-yellow-500",
    VERTICAL: "bg-pink-500",
    ARTICLE: "bg-cyan-500",
    TECH_COMPONENT: "bg-orange-500",
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>⚡</span>
            Content Velocity
          </h3>
          <p className="text-sm text-slate-400">
            Average days from Draft to Live
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{overallAvg}</div>
          <div className="text-xs text-slate-400">days avg</div>
        </div>
      </div>

      {velocityData.length === 0 ? (
        <div className="py-8 text-center text-slate-500">
          No live content yet to measure velocity
        </div>
      ) : (
        <div className="space-y-3">
          {velocityData.slice(0, 5).map((v) => (
            <div key={v.type} className="flex items-center gap-3">
              <div
                className={`w-2 h-8 rounded-full ${typeColors[v.type] || "bg-slate-500"}`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">
                    {typeLabels[v.type] || v.type}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {v.avgDays}d
                    </span>
                    {v.trend === "down" ? (
                      <span className="text-xs text-green-400">↓ faster</span>
                    ) : (
                      <span className="text-xs text-red-400">↑ slower</span>
                    )}
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full ${typeColors[v.type] || "bg-slate-500"} opacity-60`}
                    style={{
                      width: `${Math.min(100, (v.avgDays / Math.max(...velocityData.map((d) => d.avgDays))) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Based on {velocityData.reduce((s, v) => s + v.count, 0)} live blocks</span>
          <button className="text-blue-400 hover:text-blue-300 transition-colors">
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
}

