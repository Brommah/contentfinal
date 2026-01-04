"use client";

import React from "react";
import type { ColumnLayout } from "@/lib/wireframe-types";

type ColumnSplit = "50-50" | "60-40" | "40-60" | "70-30" | "30-70";

interface ColumnLayoutSelectorProps {
  columns: ColumnLayout;
  columnSplit: ColumnSplit;
  onColumnsChange: (columns: ColumnLayout) => void;
  onSplitChange: (split: ColumnSplit) => void;
}

const COLUMN_OPTIONS: { id: ColumnLayout; label: string; icon: React.ReactNode }[] = [
  {
    id: 1,
    label: "Full Width",
    icon: (
      <div className="w-8 h-6 border border-current rounded flex">
        <div className="flex-1 bg-current/30" />
      </div>
    ),
  },
  {
    id: 2,
    label: "Two Columns",
    icon: (
      <div className="w-8 h-6 border border-current rounded flex gap-0.5">
        <div className="flex-1 bg-current/30" />
        <div className="flex-1 bg-current/30" />
      </div>
    ),
  },
];

const SPLIT_OPTIONS: { id: ColumnSplit; label: string; leftWidth: string; rightWidth: string }[] = [
  { id: "50-50", label: "Equal", leftWidth: "50%", rightWidth: "50%" },
  { id: "60-40", label: "60/40", leftWidth: "60%", rightWidth: "40%" },
  { id: "40-60", label: "40/60", leftWidth: "40%", rightWidth: "60%" },
  { id: "70-30", label: "70/30", leftWidth: "70%", rightWidth: "30%" },
  { id: "30-70", label: "30/70", leftWidth: "30%", rightWidth: "70%" },
];

/**
 * ColumnLayoutSelector - UI for selecting column layout and split ratio
 */
export default function ColumnLayoutSelector({
  columns,
  columnSplit,
  onColumnsChange,
  onSplitChange,
}: ColumnLayoutSelectorProps) {
  return (
    <div className="space-y-3">
      {/* Column count */}
      <div>
        <div className="flex items-center gap-2">
          {COLUMN_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onColumnsChange(option.id)}
              className={`
                flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
                ${columns === option.id
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }
              `}
            >
              <span className="text-current">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Column split (only shown for 2 columns) */}
      {columns === 2 && (
        <div className="pl-2 border-l-2 border-indigo-500/30 space-y-2">
          <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">
            Column Ratio
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SPLIT_OPTIONS.map((split) => (
              <button
                key={split.id}
                onClick={() => onSplitChange(split.id)}
                className={`
                  group flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all
                  ${columnSplit === split.id
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }
                `}
              >
                {/* Mini preview */}
                <div className="flex w-6 h-4 border border-current/50 rounded overflow-hidden">
                  <div
                    className="bg-current/30 transition-all"
                    style={{ width: split.leftWidth }}
                  />
                  <div className="w-px bg-current/50" />
                  <div
                    className="bg-current/20 transition-all"
                    style={{ width: split.rightWidth }}
                  />
                </div>
                <span>{split.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


