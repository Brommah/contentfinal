"use client";

/**
 * SLA Dashboard Component
 * 
 * Shows aggregate view of items pending review with SLA tracking
 */

import React, { useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import type { BlockData } from "@/lib/types";

interface SLAItem {
  id: string;
  title: string;
  type: string;
  company: string;
  submittedAt: Date;
  daysWaiting: number;
  slaStatus: "ok" | "warning" | "overdue";
}

const SLA_THRESHOLDS = {
  warning: 3, // Days until warning
  overdue: 5, // Days until overdue
};

export default function SLADashboard() {
  const { nodes } = useCanvasStore();

  const slaItems = useMemo(() => {
    const pendingBlocks = nodes.filter(
      (n) => (n.data as BlockData).status === "PENDING_REVIEW"
    );

    return pendingBlocks.map((node) => {
      const data = node.data as BlockData;
      const submittedAt = data.submittedForReviewAt
        ? new Date(data.submittedForReviewAt)
        : new Date(data.updatedAt || data.createdAt || Date.now());
      const daysWaiting = Math.floor(
        (Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      let slaStatus: "ok" | "warning" | "overdue" = "ok";
      if (daysWaiting >= SLA_THRESHOLDS.overdue) {
        slaStatus = "overdue";
      } else if (daysWaiting >= SLA_THRESHOLDS.warning) {
        slaStatus = "warning";
      }

      return {
        id: node.id,
        title: data.title || "Untitled",
        type: data.type,
        company: data.company,
        submittedAt,
        daysWaiting,
        slaStatus,
      };
    }).sort((a, b) => b.daysWaiting - a.daysWaiting);
  }, [nodes]);

  const stats = useMemo(() => {
    const overdue = slaItems.filter((i) => i.slaStatus === "overdue").length;
    const warning = slaItems.filter((i) => i.slaStatus === "warning").length;
    const ok = slaItems.filter((i) => i.slaStatus === "ok").length;
    return { overdue, warning, ok, total: slaItems.length };
  }, [slaItems]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>⏱️</span>
            Review SLA Dashboard
          </h3>
          <p className="text-sm text-slate-400">
            {stats.total} items pending review
          </p>
        </div>
      </div>

      {/* SLA Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.overdue}</div>
          <div className="text-xs text-red-400/70">Overdue (&gt;{SLA_THRESHOLDS.overdue}d)</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.warning}</div>
          <div className="text-xs text-yellow-400/70">Warning ({SLA_THRESHOLDS.warning}-{SLA_THRESHOLDS.overdue}d)</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.ok}</div>
          <div className="text-xs text-green-400/70">On Track (&lt;{SLA_THRESHOLDS.warning}d)</div>
        </div>
      </div>

      {/* Items List */}
      {slaItems.length === 0 ? (
        <div className="py-6 text-center text-slate-500">
          <span className="text-2xl">✅</span>
          <p className="mt-2">No items pending review</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {slaItems.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2.5 rounded-lg border ${
                item.slaStatus === "overdue"
                  ? "bg-red-500/10 border-red-500/30"
                  : item.slaStatus === "warning"
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-slate-700/30 border-slate-600/30"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.slaStatus === "overdue"
                      ? "bg-red-500"
                      : item.slaStatus === "warning"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    {item.company} • {item.type}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div
                  className={`text-sm font-semibold ${
                    item.slaStatus === "overdue"
                      ? "text-red-400"
                      : item.slaStatus === "warning"
                      ? "text-yellow-400"
                      : "text-slate-400"
                  }`}
                >
                  {item.daysWaiting}d
                </div>
                <div className="text-xs text-slate-500">
                  {formatDate(item.submittedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {slaItems.length > 10 && (
        <div className="mt-3 text-center">
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View all {slaItems.length} items →
          </button>
        </div>
      )}
    </div>
  );
}

