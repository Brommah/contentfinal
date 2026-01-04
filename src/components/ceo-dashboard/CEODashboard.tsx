"use client";

import React, { useState, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import RoadmapOverview from "./RoadmapOverview";
import ContentReviewQueue from "./ContentReviewQueue";
import PageReviewQueue from "./PageReviewQueue";
import RoadmapReviewQueue from "./RoadmapReviewQueue";
import SuggestionsInbox from "./SuggestionsInbox";
import { ActivityFeed } from "@/components/activity";
import { StaleContentAlerts, BlockUsageHeatmap } from "@/components/analytics";
import type { Company, ReviewRequest, BlockData } from "@/lib/types";
import type { TabType } from "../dashboard/TabNavigation";
import { formatDistanceToNow, isPast } from "date-fns";

interface CEODashboardProps {
  onNavigate?: (tab: TabType) => void;
}

/**
 * CEODashboard - Fred's executive dashboard for content oversight
 * Shows roadmap status, content pending review, page reviews, and team suggestions
 * All statuses are synced across Content Schema, Wireframe, Roadmap, and Editor
 */
export default function CEODashboard({ onNavigate }: CEODashboardProps) {
  const [companyFilter, setCompanyFilter] = useState<Company | "ALL">("ALL");
  const { 
    nodes, 
    roadmapItems, 
    suggestions, 
    wireframeSections,
    reviewRequests,
    completeReviewRequest,
    getPendingReviewsForReviewer,
  } = useCanvasStore();
  
  // Get pending review requests for the CEO
  const pendingReviewRequests = useMemo(() => {
    return reviewRequests.filter((r) => r.status === "PENDING" || r.status === "IN_REVIEW");
  }, [reviewRequests]);

  // Calculate stats - using synchronized statuses from all sources
  const pendingReviewCount = nodes.filter(
    (n) => n.data.status === "PENDING_REVIEW"
  ).length;
  
  // Count unique pages with sections in PENDING_REVIEW status
  const pendingPageReviews = useMemo(() => {
    const pagesWithPendingSections = new Set(
      wireframeSections
        .filter((s) => s.status === "PENDING_REVIEW")
        .map((s) => s.pageId)
    );
    return pagesWithPendingSections.size;
  }, [wireframeSections]);
  
  // Roadmap items in REVIEW status
  const roadmapInReview = roadmapItems.filter(
    (i) => i.status === "REVIEW"
  ).length;
  
  const pendingSuggestions = suggestions.filter(
    (s) => s.status === "PENDING"
  ).length;
  
  const inProgressItems = roadmapItems.filter(
    (i) => i.status === "IN_PROGRESS"
  ).length;

  const totalPending = pendingReviewCount + pendingPageReviews + pendingSuggestions + roadmapInReview;

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50" data-tour="ceo-header">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">
                👔
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  CEO View
                </h1>
                <p className="text-slate-300 text-sm">
                  Content oversight & approval queue
                </p>
              </div>
            </div>

            {/* Stats pills */}
            <div className="flex items-center gap-3">
              {totalPending > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-200 font-medium text-sm">
                    {totalPending} items need attention
                  </span>
                </div>
              )}
              
              {/* Company filter */}
              <select
                data-tour="ceo-company-filter"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value as Company | "ALL")}
                className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Companies</option>
                <option value="CERE">🔵 CERE Only</option>
                <option value="CEF">🟣 CEF Only</option>
              </select>

            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-5 gap-4 mb-6" data-tour="stats-row">
          <StatCard
            icon="🚀"
            label="In Progress"
            value={inProgressItems}
            color="blue"
            onClick={() => onNavigate?.("roadmap")}
          />
          <StatCard
            icon="⏳"
            label="Content to Review"
            value={pendingReviewCount}
            color="amber"
            highlight={pendingReviewCount > 0}
            onClick={() => onNavigate?.("schema")}
          />
          <StatCard
            icon="🎨"
            label="Pages to Review"
            value={pendingPageReviews}
            color="purple"
            highlight={pendingPageReviews > 0}
            onClick={() => onNavigate?.("wireframe")}
          />
          <StatCard
            icon="📅"
            label="Roadmap in Review"
            value={roadmapInReview}
            color="blue"
            highlight={roadmapInReview > 0}
            onClick={() => onNavigate?.("roadmap")}
          />
          <StatCard
            icon="💡"
            label="Team Suggestions"
            value={pendingSuggestions}
            color="emerald"
            highlight={pendingSuggestions > 0}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - In Progress & Up Next + Activity */}
          <div className="col-span-5 space-y-6">
            <div data-tour="roadmap-overview">
            <RoadmapOverview companyFilter={companyFilter} onNavigate={onNavigate} />
            </div>
            
            {/* Activity Feed */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <ActivityFeed />
            </div>

            {/* Stale Content Alerts */}
            <StaleContentAlerts thresholdDays={14} criticalThresholdDays={30} />

            {/* Block Usage Heatmap */}
            <BlockUsageHeatmap />
          </div>

          {/* Right Column - All Review Queues */}
          <div className="col-span-7 space-y-6">
            {/* Review Requests with Context (New Active Workflow) */}
            {pendingReviewRequests.length > 0 && (
              <div data-tour="review-requests" className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📥</span>
                    <h2 className="text-white font-semibold">Review Requests</h2>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                      {pendingReviewRequests.length} pending
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-slate-700/50 max-h-[400px] overflow-y-auto">
                  {pendingReviewRequests.map((request) => (
                    <ReviewRequestCard
                      key={request.id}
                      request={request}
                      nodes={nodes}
                      onApprove={() => completeReviewRequest(request.id, "APPROVED")}
                      onReject={() => completeReviewRequest(request.id, "NEEDS_CHANGES")}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Content Review */}
            <div data-tour="content-review">
              <ContentReviewQueue companyFilter={companyFilter} onNavigate={onNavigate} />
            </div>
            
            {/* Page Review */}
            <div data-tour="page-review">
              <PageReviewQueue companyFilter={companyFilter} onNavigate={onNavigate} />
            </div>
            
            {/* Roadmap Review */}
            <div data-tour="roadmap-review">
              <RoadmapReviewQueue companyFilter={companyFilter} onNavigate={onNavigate} />
            </div>
            
            {/* Suggestions */}
            <div data-tour="suggestions-inbox">
              <SuggestionsInbox companyFilter={companyFilter} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat card component
function StatCard({
  icon,
  label,
  value,
  color,
  highlight = false,
  onClick,
}: {
  icon: string;
  label: string;
  value: number;
  color: "blue" | "amber" | "purple" | "emerald";
  highlight?: boolean;
  onClick?: () => void;
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  };

  const textColors = {
    blue: "text-blue-400",
    amber: "text-amber-400",
    purple: "text-purple-400",
    emerald: "text-emerald-400",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border bg-gradient-to-br text-left w-full
        ${colorClasses[color]}
        ${highlight ? "ring-2 ring-offset-2 ring-offset-slate-950 ring-" + color + "-500/50" : ""}
        ${onClick ? "cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200" : ""}
      `}
    >
      {highlight && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
      )}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className={`text-2xl font-bold ${textColors[color]}`}>{value}</div>
          <div className="text-slate-300 text-xs">{label}</div>
        </div>
      </div>
      {onClick && (
        <span className="absolute bottom-2 right-2 text-xs text-slate-400 opacity-0 group-hover:opacity-100">→</span>
      )}
    </Component>
  );
}

// Review Request Card - Shows full context for review requests
function ReviewRequestCard({
  request,
  nodes,
  onApprove,
  onReject,
  onNavigate,
}: {
  request: ReviewRequest;
  nodes: { id: string; data: BlockData }[];
  onApprove: () => void;
  onReject: () => void;
  onNavigate?: (tab: TabType) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  
  // Get block details
  const blocks = nodes.filter((n) => request.blockIds.includes(n.id));
  const isOverdue = isPast(new Date(request.dueBy));
  
  return (
    <div className={`p-4 ${isOverdue ? "bg-red-500/5" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
            {request.requestedBy.avatar || request.requestedBy.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{request.requestedBy.name}</span>
              <span className="text-slate-400 text-sm">•</span>
              <span className="text-slate-300 text-sm">
                {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
              </span>
            </div>
            <div className="text-slate-300 text-sm">
              {blocks.length} block{blocks.length !== 1 ? "s" : ""} for review
            </div>
          </div>
        </div>
        
        {/* Due date badge */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
          isOverdue 
            ? "bg-red-500/20 text-red-400" 
            : "bg-slate-700 text-slate-300"
        }`}>
          {isOverdue && <span>⚠️</span>}
          <span>Due {formatDistanceToNow(new Date(request.dueBy), { addSuffix: true })}</span>
        </div>
      </div>
      
      {/* Context message */}
      {request.context && (
        <div className="mb-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <p className="text-slate-300 text-sm">&ldquo;{request.context}&rdquo;</p>
        </div>
      )}
      
      {/* Blocks preview */}
      <div className="flex flex-wrap gap-2 mb-3">
        {blocks.slice(0, expanded ? undefined : 3).map((block) => (
          <button
            key={block.id}
            onClick={() => {
              useCanvasStore.getState().focusOnNode(block.id);
              onNavigate?.("schema");
            }}
            className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-700/50 hover:bg-slate-600/50 rounded text-xs transition-colors cursor-pointer"
            title="Click to view in Architecture"
          >
            <span className="text-slate-300">📦</span>
            <span className="text-slate-200 max-w-[150px] truncate">{block.data.title}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              block.data.company === "CERE" 
                ? "bg-blue-500/20 text-blue-400" 
                : block.data.company === "CEF" 
                ? "bg-purple-500/20 text-purple-400"
                : "bg-green-500/20 text-green-400"
            }`}>
              {block.data.company}
            </span>
          </button>
        ))}
        {!expanded && blocks.length > 3 && (
          <button 
            onClick={() => setExpanded(true)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            +{blocks.length - 3} more
          </button>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            onApprove();
          }}
          className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          ✅ Approve All
        </button>
        <button
          onClick={onReject}
          className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          🔄 Request Changes
        </button>
        <button
          onClick={() => {
            // Focus on the first block when viewing in architecture
            if (blocks.length > 0) {
              useCanvasStore.getState().focusOnNode(blocks[0].id);
            }
            onNavigate?.("schema");
          }}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
          title="View in Architecture"
        >
          👁️
        </button>
      </div>
    </div>
  );
}

