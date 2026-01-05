"use client";

import React, { useState } from "react";
import { Panel } from "@xyflow/react";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, type BlockStatus, type Company, type BlockData, type BlockType } from "@/lib/types";

/**
 * Floating toolbar that appears when multiple nodes are selected
 * Compact design that doesn't overlap with other toolbars
 */
export default function SelectionToolbar() {
  const { selectedNodeIds, nodes, updateMultipleNodes, removeSelectedNodes, clearSelection } =
    useCanvasStore();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);

  if (selectedNodeIds.length < 2) return null;

  // Get selected blocks data for summary
  const selectedBlocks = nodes
    .filter((n) => selectedNodeIds.includes(n.id))
    .map((n) => n.data as BlockData);

  // Group by type for display
  const typeGroups = selectedBlocks.reduce((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleStatusChange = (status: BlockStatus) => {
    updateMultipleNodes(selectedNodeIds, { status });
    setShowStatusMenu(false);
  };

  const handleCompanyChange = (company: Company) => {
    updateMultipleNodes(selectedNodeIds, { company });
    setShowCompanyMenu(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete ${selectedNodeIds.length} selected blocks?`)) {
      removeSelectedNodes();
    }
  };

  return (
    <Panel position="top-left" className="!left-[180px] !top-[12px]">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl">
        {/* Selection badge */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700/50">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-blue-500/25">
            {selectedNodeIds.length}
          </div>
          <span className="text-sm text-slate-300 font-medium">selected</span>
        </div>

        {/* Type preview */}
        <div className="flex items-center gap-1 pr-3 border-r border-slate-700/50">
          {Object.entries(typeGroups).slice(0, 3).map(([type, count]) => {
            const cfg = BLOCK_CONFIGS[type as BlockType];
            return (
              <span
                key={type}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/50 text-xs text-slate-400"
                title={`${count} ${cfg?.label || type}`}
              >
                {cfg?.icon} {count}
              </span>
            );
          })}
          {Object.keys(typeGroups).length > 3 && (
            <span className="text-xs text-slate-500">+{Object.keys(typeGroups).length - 3}</span>
          )}
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowStatusMenu(!showStatusMenu); setShowCompanyMenu(false); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
          >
            Status
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showStatusMenu && (
            <div className="absolute top-full left-0 mt-1 py-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[120px]">
              <button onClick={() => handleStatusChange("LIVE")} className="w-full px-3 py-2 text-left text-sm text-green-400 hover:bg-slate-700 flex items-center gap-2">
                🟢 Live
              </button>
              <button onClick={() => handleStatusChange("VISION")} className="w-full px-3 py-2 text-left text-sm text-purple-400 hover:bg-slate-700 flex items-center gap-2">
                🔮 Vision
              </button>
              <button onClick={() => handleStatusChange("DRAFT")} className="w-full px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-700 flex items-center gap-2">
                📝 Draft
              </button>
              <button onClick={() => handleStatusChange("PENDING_REVIEW")} className="w-full px-3 py-2 text-left text-sm text-amber-400 hover:bg-slate-700 flex items-center gap-2">
                ⏳ Review
              </button>
            </div>
          )}
        </div>

        {/* Company dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowCompanyMenu(!showCompanyMenu); setShowStatusMenu(false); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
          >
            Company
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCompanyMenu && (
            <div className="absolute top-full left-0 mt-1 py-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[100px]">
              <button onClick={() => handleCompanyChange("CERE")} className="w-full px-3 py-2 text-left text-sm text-blue-400 hover:bg-slate-700 flex items-center gap-2">
                🔵 CERE
              </button>
              <button onClick={() => handleCompanyChange("CEF")} className="w-full px-3 py-2 text-left text-sm text-purple-400 hover:bg-slate-700 flex items-center gap-2">
                🟣 CEF
              </button>
              <button onClick={() => handleCompanyChange("SHARED")} className="w-full px-3 py-2 text-left text-sm text-emerald-400 hover:bg-slate-700 flex items-center gap-2">
                🟢 Shared
              </button>
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
          title="Delete selected blocks"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        {/* Clear selection */}
        <button
          onClick={clearSelection}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Clear selection (Esc)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </Panel>
  );
}

