"use client";

import React, { useState } from "react";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, type Company, type BlockData } from "@/lib/types";
import { calculateSLAStatus } from "@/lib/content-scoring";
import type { TabType } from "../dashboard/TabNavigation";
import { useToast } from "@/components/ui";

interface ContentReviewQueueProps {
  companyFilter: Company | "ALL";
  onNavigate?: (tab: TabType) => void;
}

/**
 * ContentReviewQueue - Shows content blocks pending Fred's review
 * Click on items to navigate to Content Schema and view them
 * Supports batch approval for faster workflow
 */
export default function ContentReviewQueue({ companyFilter, onNavigate }: ContentReviewQueueProps) {
  const { nodes, approveBlock, requestBlockChanges, focusOnNode, batchApproveBlocks, batchRejectBlocks, addComment } = useCanvasStore();
  const { success, warning } = useToast();
  const [commentingOnId, setCommentingOnId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);

  // Get blocks pending review
  const pendingBlocks = nodes
    .filter((node) => {
      const data = node.data as BlockData;
      if (data.status !== "PENDING_REVIEW") return false;
      if (companyFilter !== "ALL" && data.company !== companyFilter) return false;
      return true;
    })
    .map((node) => node.data as BlockData);

  // Get recently approved/rejected blocks
  const recentlyReviewed = nodes
    .filter((node) => {
      const data = node.data as BlockData;
      return data.status === "APPROVED" || data.status === "NEEDS_CHANGES";
    })
    .map((node) => node.data as BlockData)
    .slice(0, 3);

  const handleApprove = (blockId: string) => {
    const block = nodes.find((n) => n.id === blockId);
    approveBlock(blockId);
    success(`"${(block?.data as BlockData)?.title || "Block"}" approved`);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(blockId);
      return next;
    });
  };

  const handleRequestChanges = (blockId: string) => {
    if (commentingOnId === blockId && comment.trim()) {
      // Add comment to block comments array
      addComment(blockId, "Fred (CEO)", comment.trim());
      requestBlockChanges(blockId);
      setCommentingOnId(null);
      setComment("");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(blockId);
        return next;
      });
    } else {
      setCommentingOnId(blockId);
    }
  };

  // Toggle selection for batch mode
  const toggleSelection = (blockId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  // Select all pending blocks
  const selectAll = () => {
    setSelectedIds(new Set(pendingBlocks.map((b) => b.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Batch approve selected
  const handleBatchApprove = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    batchApproveBlocks(Array.from(selectedIds));
    success(`${count} block${count > 1 ? "s" : ""} approved`);
    setSelectedIds(new Set());
    setBatchMode(false);
  };

  // Batch reject selected
  const handleBatchReject = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    batchRejectBlocks(Array.from(selectedIds));
    warning(`${count} block${count > 1 ? "s" : ""} sent back for changes`);
    setSelectedIds(new Set());
    setBatchMode(false);
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            ⏳ Content Pending Review
            {pendingBlocks.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300 font-medium">
                {pendingBlocks.length}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {pendingBlocks.length > 1 && (
              <button
                onClick={() => setBatchMode(!batchMode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  batchMode
                    ? "bg-blue-500 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {batchMode ? "Exit Batch Mode" : "⚡ Batch Mode"}
              </button>
            )}
            <span className="text-xs text-slate-500">
              Synced with Content Schema
            </span>
          </div>
        </div>

        {/* Batch mode controls */}
        {batchMode && pendingBlocks.length > 0 && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === pendingBlocks.length}
                onChange={() => selectedIds.size === pendingBlocks.length ? clearSelection() : selectAll()}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">
                {selectedIds.size} of {pendingBlocks.length} selected
              </span>
            </div>
            <div className="flex-1" />
            <button
              onClick={handleBatchApprove}
              disabled={selectedIds.size === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ✅ Approve All ({selectedIds.size})
            </button>
            <button
              onClick={handleBatchReject}
              disabled={selectedIds.size === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🔄 Reject All ({selectedIds.size})
            </button>
          </div>
        )}
      </div>

      <div className="p-5">
        {pendingBlocks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-slate-400">No content pending review</p>
            <p className="text-slate-500 text-sm mt-1">
              Team members can submit content for your approval
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingBlocks.map((block) => (
              <ContentReviewCard
                key={block.id}
                block={block}
                isCommenting={commentingOnId === block.id}
                comment={comment}
                onCommentChange={setComment}
                onApprove={() => handleApprove(block.id)}
                onRequestChanges={() => handleRequestChanges(block.id)}
                onCancelComment={() => {
                  setCommentingOnId(null);
                  setComment("");
                }}
                onNavigateToBlock={() => {
                  focusOnNode(block.id);
                  onNavigate?.("schema");
                }}
                batchMode={batchMode}
                isSelected={selectedIds.has(block.id)}
                onToggleSelect={() => toggleSelection(block.id)}
              />
            ))}
          </div>
        )}

        {/* Recently reviewed section */}
        {recentlyReviewed.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-500 mb-3">
              Recently Reviewed
            </h3>
            <div className="space-y-2">
              {recentlyReviewed.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/30"
                >
                  <span className="text-lg">{BLOCK_CONFIGS[block.type].icon}</span>
                  <span className="text-sm text-slate-300 flex-1 truncate">
                    {block.title}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      block.status === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {block.status === "APPROVED" ? "Approved" : "Needs Changes"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContentReviewCard({
  block,
  isCommenting,
  comment,
  onCommentChange,
  onApprove,
  onRequestChanges,
  onCancelComment,
  onNavigateToBlock,
  batchMode = false,
  isSelected = false,
  onToggleSelect,
}: {
  block: BlockData;
  isCommenting: boolean;
  comment: string;
  onCommentChange: (comment: string) => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onCancelComment: () => void;
  onNavigateToBlock: () => void;
  batchMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const config = BLOCK_CONFIGS[block.type];
  const companyColor = block.company === "CERE" ? "text-blue-400" : "text-purple-400";
  
  // Calculate SLA status
  const sla = calculateSLAStatus(block.submittedForReviewAt);

  return (
    <div className={`p-4 rounded-lg border transition-all ${
      isSelected 
        ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30" 
        : sla.isOverdue 
          ? "border-red-500/50 bg-red-500/5"
          : "border-amber-500/30 bg-amber-500/5"
    }`}>
      {/* Clickable Header with optional checkbox */}
      <div 
        className="flex items-start gap-3 mb-3 cursor-pointer group"
        onClick={batchMode ? onToggleSelect : onNavigateToBlock}
        title={batchMode ? "Click to select" : "Click to view in Content Schema"}
      >
        {/* Checkbox in batch mode */}
        {batchMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="mt-3 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
          />
        )}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl group-hover:ring-2 group-hover:ring-amber-400 transition-all"
          style={{ backgroundColor: config.bgColor }}
        >
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${companyColor}`}>
              {block.company}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-500">{config.label}</span>
            {/* SLA Badge */}
            {block.submittedForReviewAt && (
              <span
                className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                style={{
                  backgroundColor: `${sla.statusColor}20`,
                  color: sla.statusColor,
                }}
              >
                {sla.statusLabel}
              </span>
            )}
            <span className="ml-auto text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {batchMode ? "Click to select" : "Click to view →"}
            </span>
          </div>
          <h4 className="text-white font-medium group-hover:text-amber-300 transition-colors">{block.title}</h4>
          {block.subtitle && (
            <p className="text-slate-400 text-sm mt-0.5">{block.subtitle}</p>
          )}
        </div>
      </div>

      {/* Content preview */}
      {block.content && (
        <div className="mb-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
          <p className="text-slate-300 text-sm line-clamp-3">{block.content}</p>
        </div>
      )}

      {/* Comment input */}
      {isCommenting && (
        <div className="mb-4">
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Add feedback for the team..."
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            rows={3}
            autoFocus
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onApprove}
          className="flex-1 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 font-medium text-sm hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <span>✅</span> Approve
        </button>
        {isCommenting ? (
          <>
            <button
              onClick={onRequestChanges}
              disabled={!comment.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 font-medium text-sm hover:bg-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>📝</span> Submit Feedback
            </button>
            <button
              onClick={onCancelComment}
              className="px-3 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={onRequestChanges}
            className="flex-1 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 font-medium text-sm hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span> Request Changes
          </button>
        )}
      </div>
    </div>
  );
}

