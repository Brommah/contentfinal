"use client";

import React from "react";
import { Panel } from "@xyflow/react";
import { useCanvasStore } from "@/lib/store";
import type { BlockStatus, Company } from "@/lib/types";

/**
 * Floating toolbar that appears when multiple nodes are selected
 * Allows bulk status changes and other actions
 */
export default function SelectionToolbar() {
  const { selectedNodeIds, updateMultipleNodes, removeSelectedNodes, clearSelection } =
    useCanvasStore();

  if (selectedNodeIds.length < 2) return null;

  const handleStatusChange = (status: BlockStatus) => {
    updateMultipleNodes(selectedNodeIds, { status });
  };

  const handleCompanyChange = (company: Company) => {
    updateMultipleNodes(selectedNodeIds, { company });
  };

  const handleDelete = () => {
    if (confirm(`Delete ${selectedNodeIds.length} selected blocks?`)) {
      removeSelectedNodes();
    }
  };

  return (
    <Panel
      position="top-center"
      className="glass rounded-xl px-4 py-3 shadow-lg border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center gap-3">
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/20">
          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
            {selectedNodeIds.length}
          </div>
          <span className="text-sm text-gray-300 font-medium">selected</span>
        </div>

        {/* Status buttons */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Status:</span>
          <button
            onClick={() => handleStatusChange("LIVE")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
          >
            Live
          </button>
          <button
            onClick={() => handleStatusChange("VISION")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
          >
            Vision
          </button>
          <button
            onClick={() => handleStatusChange("DRAFT")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-colors"
          >
            Draft
          </button>
          <button
            onClick={() => handleStatusChange("PENDING_REVIEW")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
            title="Submit for Fred's review"
          >
            ⏳ Review
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/20" />

        {/* Company buttons */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Company:</span>
          <button
            onClick={() => handleCompanyChange("CERE")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          >
            CERE
          </button>
          <button
            onClick={() => handleCompanyChange("CEF")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            CEF
          </button>
          <button
            onClick={() => handleCompanyChange("SHARED")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
          >
            Shared
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/20" />

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>

        {/* Clear selection */}
        <button
          onClick={clearSelection}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Clear selection"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </Panel>
  );
}

