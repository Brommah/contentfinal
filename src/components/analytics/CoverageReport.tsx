"use client";

/**
 * Coverage Report Component
 * 
 * Exportable content coverage report for stakeholder presentations
 */

import React, { useMemo, useState } from "react";
import { useCanvasStore } from "@/lib/store";
import type { BlockData, BlockType, Company } from "@/lib/types";

interface CoverageData {
  company: Company;
  coverage: {
    type: BlockType;
    count: number;
    liveCount: number;
    percentage: number;
  }[];
  totalBlocks: number;
  liveBlocks: number;
  overallCoverage: number;
}

export default function CoverageReport() {
  const { nodes } = useCanvasStore();
  const [exporting, setExporting] = useState(false);

  const coverageData = useMemo((): CoverageData[] => {
    const blocks = nodes.map((n) => n.data as BlockData);
    const companies: Company[] = ["CERE", "CEF"];
    const blockTypes: BlockType[] = [
      "COMPANY",
      "CORE_VALUE_PROP",
      "PAIN_POINT",
      "SOLUTION",
      "FEATURE",
      "VERTICAL",
    ];

    return companies.map((company) => {
      const companyBlocks = blocks.filter(
        (b) => b.company === company || b.company === "SHARED"
      );

      const coverage = blockTypes.map((type) => {
        const typeBlocks = companyBlocks.filter((b) => b.type === type);
        const liveBlocks = typeBlocks.filter((b) => b.status === "LIVE");
        return {
          type,
          count: typeBlocks.length,
          liveCount: liveBlocks.length,
          percentage: typeBlocks.length > 0
            ? Math.round((liveBlocks.length / typeBlocks.length) * 100)
            : 0,
        };
      });

      const totalBlocks = companyBlocks.length;
      const liveBlocks = companyBlocks.filter((b) => b.status === "LIVE").length;

      return {
        company,
        coverage,
        totalBlocks,
        liveBlocks,
        overallCoverage: totalBlocks > 0
          ? Math.round((liveBlocks / totalBlocks) * 100)
          : 0,
      };
    });
  }, [nodes]);

  const typeLabels: Record<BlockType, string> = {
    COMPANY: "Company Info",
    CORE_VALUE_PROP: "Value Props",
    PAIN_POINT: "Pain Points",
    SOLUTION: "Solutions",
    FEATURE: "Features",
    VERTICAL: "Verticals",
    ARTICLE: "Articles",
    TECH_COMPONENT: "Tech Components",
    PAGE_ROOT: "Page Roots",
  };

  const handleExport = async (format: "csv" | "pdf") => {
    setExporting(true);

    // Simulate export delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (format === "csv") {
      // Generate CSV
      const headers = ["Company", "Block Type", "Total", "Live", "Coverage %"];
      const rows = coverageData.flatMap((cd) =>
        cd.coverage.map((c) => [
          cd.company,
          typeLabels[c.type],
          c.count,
          c.liveCount,
          `${c.percentage}%`,
        ])
      );

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `content-coverage-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setExporting(false);
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📈</span>
            Coverage Report
          </h3>
          <p className="text-sm text-slate-400">
            Content readiness by company
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="px-3 py-1.5 text-xs font-medium bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            {exporting ? "..." : "📥 CSV"}
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {exporting ? "..." : "📄 PDF"}
          </button>
        </div>
      </div>

      {/* Company Coverage Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {coverageData.map((cd) => (
          <div
            key={cd.company}
            className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    cd.company === "CERE" ? "bg-blue-500" : "bg-purple-500"
                  }`}
                />
                <span className="font-semibold text-white">{cd.company}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {cd.overallCoverage}%
                </div>
                <div className="text-xs text-slate-500">live coverage</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full ${
                  cd.company === "CERE" ? "bg-blue-500" : "bg-purple-500"
                }`}
                style={{ width: `${cd.overallCoverage}%` }}
              />
            </div>

            {/* Type Breakdown */}
            <div className="space-y-1.5">
              {cd.coverage.map((c) => (
                <div key={c.type} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{typeLabels[c.type]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">
                      {c.liveCount}/{c.count}
                    </span>
                    <span
                      className={`font-medium ${
                        c.percentage >= 80
                          ? "text-green-400"
                          : c.percentage >= 50
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {c.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Total: {coverageData.reduce((s, c) => s + c.totalBlocks, 0)} blocks
          </span>
          <span className="text-slate-400">
            Live: {coverageData.reduce((s, c) => s + c.liveBlocks, 0)} blocks
          </span>
        </div>
      </div>
    </div>
  );
}

