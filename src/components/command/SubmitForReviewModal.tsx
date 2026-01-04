"use client";

/**
 * Submit for Review Modal
 * 
 * Confirmation flow with checklist before submitting content for review.
 * Includes reviewer selection and due date for active review workflow.
 */

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useCanvasStore } from "@/lib/store";
import type { BlockData } from "@/lib/types";
import { DEFAULT_REVIEWERS } from "@/lib/types";
import { useToast } from "@/components/ui";

interface SubmitForReviewModalProps {
  blockIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  check: (block: BlockData) => boolean;
  severity: "error" | "warning";
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "has-title",
    label: "Has a title",
    description: "Block must have a descriptive title",
    check: (block) => Boolean(block.title && block.title.trim().length > 3),
    severity: "error",
  },
  {
    id: "has-content",
    label: "Has content",
    description: "Block should have meaningful content",
    check: (block) => Boolean(block.content && block.content.trim().length > 20),
    severity: "warning",
  },
  {
    id: "content-score",
    label: "Content score ≥ 60",
    description: "Content quality should meet minimum threshold",
    check: (block) => ((block.contentScore as number | undefined) ?? 0) >= 60,
    severity: "warning",
  },
  {
    id: "has-company",
    label: "Assigned to company",
    description: "Block must be assigned to CERE, CEF, or SHARED",
    check: (block) => Boolean(block.company),
    severity: "error",
  },
];

export default function SubmitForReviewModal({
  blockIds,
  isOpen,
  onClose,
  onSubmit,
}: SubmitForReviewModalProps) {
  const { nodes, createReviewRequest } = useCanvasStore();
  const { success } = useToast();
  const [reviewerNote, setReviewerNote] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState(DEFAULT_REVIEWERS[0]?.id || "");
  const [dueDate, setDueDate] = useState(() => {
    // Default due date: 3 days from now
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split("T")[0];
  });

  const selectedBlocks = useMemo(() => {
    return nodes
      .filter((n) => blockIds.includes(n.id))
      .map((n) => n.data as BlockData);
  }, [nodes, blockIds]);

  // Run checklist for all blocks
  const checklistResults = useMemo(() => {
    return CHECKLIST_ITEMS.map((item) => {
      const passingBlocks = selectedBlocks.filter((b) => item.check(b));
      const failingBlocks = selectedBlocks.filter((b) => !item.check(b));
      return {
        ...item,
        passed: failingBlocks.length === 0,
        passingCount: passingBlocks.length,
        failingCount: failingBlocks.length,
        failingBlocks,
      };
    });
  }, [selectedBlocks]);

  const hasErrors = checklistResults.some((r) => !r.passed && r.severity === "error");
  const hasWarnings = checklistResults.some((r) => !r.passed && r.severity === "warning");
  const canSubmit = !hasErrors && (acknowledged || !hasWarnings);

  const handleSubmit = () => {
    const reviewer = DEFAULT_REVIEWERS.find((r) => r.id === selectedReviewerId);
    if (!reviewer) return;

    // Create a review request with full context
    createReviewRequest(
      blockIds,
      { id: "current-user", name: "You", avatar: "U" }, // Current user
      reviewer.id,
      reviewer.name,
      new Date(dueDate),
      reviewerNote || `Review request for ${blockIds.length} block(s)`
    );

    success("📤 Review Request Sent", `${blockIds.length} block${blockIds.length > 1 ? "s" : ""} sent to ${reviewer.name} for review`);
    onSubmit?.();
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📤</span>
            Submit for Review
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {selectedBlocks.length} block{selectedBlocks.length > 1 ? "s" : ""} will be
            submitted for review
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Checklist */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-300">Pre-submission Checklist</h3>
            <div className="space-y-2">
              {checklistResults.map((result) => (
                <div
                  key={result.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    result.passed
                      ? "bg-green-500/10 border-green-500/30"
                      : result.severity === "error"
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-yellow-500/10 border-yellow-500/30"
                  }`}
                >
                  <span className="text-lg">
                    {result.passed ? "✅" : result.severity === "error" ? "❌" : "⚠️"}
                  </span>
                  <div className="flex-1">
                    <div
                      className={`font-medium text-sm ${
                        result.passed
                          ? "text-green-400"
                          : result.severity === "error"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {result.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {result.passed
                        ? `All ${result.passingCount} blocks pass`
                        : `${result.failingCount} block${result.failingCount > 1 ? "s" : ""} ${
                            result.failingCount > 1 ? "need" : "needs"
                          } attention`}
                    </div>
                    {!result.passed && result.failingBlocks.length <= 3 && (
                      <div className="mt-1 text-xs text-slate-400">
                        {result.failingBlocks.map((b) => b.title || "Untitled").join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviewer Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Reviewer
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DEFAULT_REVIEWERS.map((reviewer) => (
                <button
                  key={reviewer.id}
                  onClick={() => setSelectedReviewerId(reviewer.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    selectedReviewerId === reviewer.id
                      ? "bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/50"
                      : "bg-slate-800 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      selectedReviewerId === reviewer.id
                        ? "bg-blue-500 text-white"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {reviewer.avatar || reviewer.name.charAt(0)}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-white">{reviewer.name}</div>
                    <div className="text-[10px] text-slate-500">{reviewer.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reviewer Note */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Context for Reviewer
            </label>
            <textarea
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              placeholder="What should the reviewer focus on? Any specific feedback needed?"
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Acknowledgment for warnings */}
          {hasWarnings && !hasErrors && (
            <label className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-yellow-400">
                  Submit anyway
                </div>
                <div className="text-xs text-slate-400">
                  I understand there are warnings but want to proceed with submission
                </div>
              </div>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              canSubmit
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            {hasErrors
              ? "Fix Errors First"
              : `Submit ${selectedBlocks.length} Block${selectedBlocks.length > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

