"use client";

/**
 * Bulk Actions Menu
 * 
 * Context menu for bulk status updates on selected blocks
 */

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useCanvasStore } from "@/lib/store";
import type { BlockStatus } from "@/lib/types";
import { useToast } from "@/components/ui";

interface MenuPosition {
  x: number;
  y: number;
}

export default function BulkActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const { success, error } = useToast();

  const {
    selectedNodeIds,
    nodes,
    batchSetStatus,
    removeSelectedNodes,
    updateMultipleNodes,
  } = useCanvasStore();

  const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
  const selectedCount = selectedNodes.length;

  // Handle right-click on canvas
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Only show if multiple nodes selected
      if (selectedCount < 2) return;

      // Check if right-clicking on the canvas area
      const target = e.target as HTMLElement;
      if (target.closest("[data-tour='canvas']") || target.closest(".react-flow")) {
        e.preventDefault();
        setPosition({ x: e.clientX, y: e.clientY });
        setIsOpen(true);
      }
    };

    const handleClick = () => {
      setIsOpen(false);
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("click", handleClick);
    };
  }, [selectedCount]);

  const handleStatusChange = useCallback(
    (status: BlockStatus) => {
      batchSetStatus(selectedNodeIds, status);
      setIsOpen(false);

      const statusLabels: Record<BlockStatus, string> = {
        DRAFT: "Draft",
        PENDING_REVIEW: "Pending Review",
        APPROVED: "Approved",
        NEEDS_CHANGES: "Needs Changes",
        LIVE: "Live",
        VISION: "Vision",
        ARCHIVED: "Archived",
      };

      success(`✅ Status Updated`, `${selectedCount} blocks set to ${statusLabels[status]}`);
    },
    [selectedNodeIds, selectedCount, batchSetStatus, success]
  );

  const handleSubmitForReview = useCallback(() => {
    batchSetStatus(selectedNodeIds, "PENDING_REVIEW");
    setIsOpen(false);
    success("📤 Submitted for Review", `${selectedCount} blocks submitted for review`);
  }, [selectedNodeIds, selectedCount, batchSetStatus, success]);

  const handleDelete = useCallback(() => {
    if (confirm(`Delete ${selectedCount} selected blocks?`)) {
      removeSelectedNodes();
      setIsOpen(false);
      error("🗑️ Deleted", `${selectedCount} blocks removed`);
    }
  }, [selectedCount, removeSelectedNodes, error]);

  if (!isOpen || selectedCount < 2) return null;

  // Adjust position to stay within viewport
  const adjustedX = Math.min(position.x, window.innerWidth - 220);
  const adjustedY = Math.min(position.y, window.innerHeight - 350);

  return createPortal(
    <div
      className="fixed z-[9998] w-52 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{ left: adjustedX, top: adjustedY }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-700 bg-slate-800/50">
        <span className="text-xs font-medium text-slate-400">
          {selectedCount} blocks selected
        </span>
      </div>

      {/* Quick Actions */}
      <div className="py-1">
        <button
          onClick={handleSubmitForReview}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-slate-300 hover:bg-blue-600/20 hover:text-white transition-colors"
        >
          <span>📤</span>
          <span>Submit All for Review</span>
        </button>
      </div>

      {/* Status Changes */}
      <div className="py-1 border-t border-slate-700">
        <div className="px-3 py-1 text-xs font-medium text-slate-500 uppercase">
          Set Status
        </div>
        {(
          [
            { status: "DRAFT", label: "Draft", icon: "📝" },
            { status: "PENDING_REVIEW", label: "Pending Review", icon: "👀" },
            { status: "APPROVED", label: "Approved", icon: "✅" },
            { status: "NEEDS_CHANGES", label: "Needs Changes", icon: "🔄" },
            { status: "LIVE", label: "Live", icon: "🚀" },
            { status: "VISION", label: "Vision", icon: "💡" },
          ] as { status: BlockStatus; label: string; icon: string }[]
        ).map(({ status, label, icon }) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="py-1 border-t border-slate-700">
        <button
          onClick={handleDelete}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors"
        >
          <span>🗑️</span>
          <span>Delete Selected</span>
        </button>
      </div>
    </div>,
    document.body
  );
}

