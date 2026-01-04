"use client";

import React, { useState, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import type { Company, BlockStatus } from "@/lib/types";
import { DEFAULT_PAGES } from "@/lib/wireframe-types";
import type { TabType } from "../dashboard/TabNavigation";

interface PageReviewQueueProps {
  companyFilter: Company | "ALL";
  onNavigate?: (tab: TabType) => void;
}

interface PageGroup {
  pageId: string;
  pageName: string;
  company: Company;
  sectionCount: number;
  sectionIds: string[];
}

/**
 * PageReviewQueue - Shows wireframe pages with sections pending Fred's review
 * Uses synchronized status from wireframeSections for complete status sync
 * Click on items to navigate to Wireframe Designer
 */
export default function PageReviewQueue({ companyFilter, onNavigate }: PageReviewQueueProps) {
  const { wireframeSections, updateWireframeSection, selectSection, selectWireframePage } = useCanvasStore();
  const [commentingOnId, setCommentingOnId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  // Group sections by page and filter for PENDING_REVIEW status
  const { pendingPages, recentlyReviewed } = useMemo(() => {
    // Filter by company first
    const filteredSections = wireframeSections.filter(
      (s) => companyFilter === "ALL" || s.company === companyFilter
    );

    // Group pending sections by page
    const pendingMap = new Map<string, PageGroup>();
    const reviewedMap = new Map<string, PageGroup & { status: BlockStatus }>();

    filteredSections.forEach((section) => {
      const page = DEFAULT_PAGES.find((p) => p.id === section.pageId);
      const pageName = page?.name || section.pageId;

      if (section.status === "PENDING_REVIEW") {
        if (!pendingMap.has(section.pageId)) {
          pendingMap.set(section.pageId, {
            pageId: section.pageId,
            pageName,
            company: section.company,
            sectionCount: 0,
            sectionIds: [],
          });
        }
        const group = pendingMap.get(section.pageId)!;
        group.sectionCount++;
        group.sectionIds.push(section.id);
      } else if (section.status === "APPROVED" || section.status === "NEEDS_CHANGES") {
        if (!reviewedMap.has(section.pageId)) {
          reviewedMap.set(section.pageId, {
            pageId: section.pageId,
            pageName,
            company: section.company,
            sectionCount: 0,
            sectionIds: [],
            status: section.status,
          });
        }
        const group = reviewedMap.get(section.pageId)!;
        group.sectionCount++;
        group.sectionIds.push(section.id);
      }
    });

    return {
      pendingPages: Array.from(pendingMap.values()),
      recentlyReviewed: Array.from(reviewedMap.values()).slice(0, 3),
    };
  }, [wireframeSections, companyFilter]);

  const handleApprovePage = (pageGroup: PageGroup) => {
    // Update all sections in this page to APPROVED
    pageGroup.sectionIds.forEach((sectionId) => {
      updateWireframeSection(sectionId, { status: "APPROVED" });
    });
    setCommentingOnId(null);
    setComment("");
  };

  const handleRequestChanges = (pageGroup: PageGroup) => {
    if (commentingOnId === pageGroup.pageId && comment.trim()) {
      // Update all sections in this page to NEEDS_CHANGES
      pageGroup.sectionIds.forEach((sectionId) => {
        updateWireframeSection(sectionId, { status: "NEEDS_CHANGES" });
      });
      setCommentingOnId(null);
      setComment("");
    } else {
      setCommentingOnId(pageGroup.pageId);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            🎨 Pages Pending Review
            {pendingPages.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300 font-medium">
                {pendingPages.length}
              </span>
            )}
          </h2>
          <span className="text-xs text-slate-500">
            Synced with Wireframe Designer
          </span>
        </div>
      </div>

      <div className="p-5">
        {pendingPages.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🎨</div>
            <p className="text-slate-400 text-sm">No pages pending review</p>
            <p className="text-slate-500 text-xs mt-1">
              Set sections to &quot;Pending Review&quot; in Wireframe Designer
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingPages.map((pageGroup) => (
              <PageReviewCard
                key={pageGroup.pageId}
                pageGroup={pageGroup}
                isCommenting={commentingOnId === pageGroup.pageId}
                comment={comment}
                onCommentChange={setComment}
                onApprove={() => handleApprovePage(pageGroup)}
                onRequestChanges={() => handleRequestChanges(pageGroup)}
                onCancelComment={() => {
                  setCommentingOnId(null);
                  setComment("");
                }}
                onNavigateToPage={() => {
                  // Navigate directly to this page in Wireframe Designer
                  selectWireframePage(pageGroup.pageId);
                  // Select the first section of this page to open the Section Editor
                  if (pageGroup.sectionIds.length > 0) {
                    selectSection(pageGroup.sectionIds[0]);
                  }
                  onNavigate?.("wireframe");
                }}
              />
            ))}
          </div>
        )}

        {/* Recently reviewed */}
        {recentlyReviewed.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <h3 className="text-xs font-medium text-slate-500 mb-2">
              Recently Reviewed
            </h3>
            <div className="space-y-1">
              {recentlyReviewed.map((page) => (
                <div
                  key={page.pageId}
                  className="flex items-center gap-2 p-2 rounded bg-slate-700/30 text-sm"
                >
                  <span className="text-slate-400">{page.pageName}</span>
                  <span className="text-xs text-slate-500">
                    ({page.sectionCount} sections)
                  </span>
                  <span
                    className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      page.status === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {page.status === "APPROVED" ? "✓ Approved" : "⟳ Needs Changes"}
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

function PageReviewCard({
  pageGroup,
  isCommenting,
  comment,
  onCommentChange,
  onApprove,
  onRequestChanges,
  onCancelComment,
  onNavigateToPage,
}: {
  pageGroup: PageGroup;
  isCommenting: boolean;
  comment: string;
  onCommentChange: (comment: string) => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onCancelComment: () => void;
  onNavigateToPage: () => void;
}) {
  const companyColor =
    pageGroup.company === "CERE"
      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
      : "bg-purple-500/20 text-purple-300 border-purple-500/30";

  return (
    <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
      <div 
        className="flex items-start gap-3 mb-3 cursor-pointer group"
        onClick={onNavigateToPage}
        title="Click to view in Wireframe Designer"
      >
        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-lg group-hover:ring-2 group-hover:ring-purple-400 transition-all">
          📄
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded border ${companyColor}`}>
              {pageGroup.company}
            </span>
            <span className="text-xs text-slate-500">
              {pageGroup.sectionCount} section{pageGroup.sectionCount !== 1 ? "s" : ""}
            </span>
            <span className="ml-auto text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view →
            </span>
          </div>
          <h4 className="text-white font-medium group-hover:text-purple-300 transition-colors">{pageGroup.pageName}</h4>
        </div>
      </div>

      {/* Comment input */}
      {isCommenting && (
        <div className="mb-3">
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Add design feedback..."
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={2}
            autoFocus
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onApprove}
          className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-medium text-sm hover:bg-emerald-500/30 transition-colors"
        >
          ✅ Approve All
        </button>
        {isCommenting ? (
          <>
            <button
              onClick={onRequestChanges}
              disabled={!comment.trim()}
              className="flex-1 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 font-medium text-sm hover:bg-purple-500/30 transition-colors disabled:opacity-50"
            >
              📝 Submit
            </button>
            <button
              onClick={onCancelComment}
              className="px-2 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={onRequestChanges}
            className="flex-1 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 font-medium text-sm hover:bg-purple-500/30 transition-colors"
          >
            🔄 Request Changes
          </button>
        )}
      </div>
    </div>
  );
}
