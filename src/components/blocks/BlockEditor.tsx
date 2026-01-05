"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/lib/store";
import {
  BLOCK_CONFIGS,
  RELATIONSHIP_CONFIGS,
  type BlockType,
  type Company,
  type BlockStatus,
  type RelationshipType,
  type BlockData,
  getAvailableTransitions,
  STATUS_CONFIGS,
} from "@/lib/types";
import { calculateSLAStatus } from "@/lib/content-scoring";
import CommentsPanel from "./CommentsPanel";
import ContentScorePanel from "./ContentScorePanel";
import DependencyPanel from "./DependencyPanel";
import ReviewCommentsPanel from "./ReviewCommentsPanel";
import { ImpactAnalysisModal, UsageBadge } from "./ImpactAnalysisModal";

/**
 * BlockEditor - Sidebar panel for editing selected block properties
 * Supports single selection editing. For multi-select, use the floating toolbar.
 */
export default function BlockEditor() {
  const { 
    nodes, 
    edges, 
    selectedNodeIds, 
    updateNode, 
    removeNode, 
    clearSelection, 
    toggleSidebar,
    transitionBlockStatus,
    publishBlock,
    createRevision,
    getBlockUsage,
    hasBlockUsage,
    wireframeSections,
    selectSection,
    selectWireframePage,
    isFavorite,
    toggleFavorite,
  } = useCanvasStore();
  
  const router = useRouter();

  // Get the first selected node for editing (single selection mode)
  const selectedNodeId = selectedNodeIds.length === 1 ? selectedNodeIds[0] : null;
  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  const blockData = selectedNode?.data as BlockData | undefined;

  // Local state for editing
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [company, setCompany] = useState<Company>("SHARED");
  const [status, setStatus] = useState<BlockStatus>("DRAFT");
  const [type, setType] = useState<BlockType>("FEATURE");
  const [externalUrl, setExternalUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  
  // Impact analysis state
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  // Get block usage for impact analysis
  const blockUsage = selectedNodeId ? getBlockUsage(selectedNodeId) : null;
  const hasUsage = selectedNodeId ? hasBlockUsage(selectedNodeId) : false;

  // Sync local state with selected block
  useEffect(() => {
    if (blockData) {
      setTitle(blockData.title || "");
      setSubtitle(blockData.subtitle || "");
      setContent(blockData.content || "");
      setCompany(blockData.company);
      setStatus(blockData.status);
      setType(blockData.type);
      setExternalUrl(blockData.externalUrl || "");
      setTagsInput((blockData.tags || []).join(", "));
    }
  }, [blockData]);

  // Save changes with optional impact check
  const doSave = useCallback(() => {
    if (!selectedNodeId) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    updateNode(selectedNodeId, {
      title,
      subtitle: subtitle || null,
      content: content || null,
      company,
      status,
      type,
      externalUrl: externalUrl || null,
      tags,
    });
  }, [
    selectedNodeId,
    title,
    subtitle,
    content,
    company,
    status,
    type,
    externalUrl,
    tagsInput,
    updateNode,
  ]);

  // Save changes with impact analysis check
  const saveChanges = useCallback(() => {
    if (!selectedNodeId) return;
    
    // If block has usage, show impact modal first
    if (hasUsage) {
      setPendingAction(() => doSave);
      setShowImpactModal(true);
    } else {
      doSave();
    }
  }, [selectedNodeId, hasUsage, doSave]);
  
  // Handle status transition with lifecycle enforcement
  const handleStatusTransition = useCallback((newStatus: BlockStatus) => {
    if (!selectedNodeId) return;
    
    const result = transitionBlockStatus(selectedNodeId, newStatus);
    if (result.success) {
      setStatus(newStatus);
    } else {
      // Show error (the transition is not allowed)
      alert(result.error || "Status transition not allowed");
    }
  }, [selectedNodeId, transitionBlockStatus]);
  
  // Handle publish (APPROVED -> LIVE)
  const handlePublish = useCallback(() => {
    if (!selectedNodeId) return;
    
    const result = publishBlock(selectedNodeId);
    if (result.success) {
      setStatus("LIVE");
    } else {
      alert(result.error || "Cannot publish block");
    }
  }, [selectedNodeId, publishBlock]);
  
  // Handle create revision (for LIVE blocks)
  const handleCreateRevision = useCallback(() => {
    if (!selectedNodeId) return;
    
    const revision = createRevision(selectedNodeId, "user-1", "Current User");
    if (revision) {
      alert(`Revision v${revision.version} created. The block is now editable as a draft.`);
      // Block status is still LIVE, revision stores the snapshot
    }
  }, [selectedNodeId, createRevision]);
  
  // Get available transitions for current status
  const availableTransitions = blockData ? getAvailableTransitions(blockData.status) : [];

  // Auto-save on blur (without impact check to avoid interruption)
  const handleBlur = () => {
    doSave();
  };

  // Delete block
  const handleDelete = () => {
    if (selectedNodeId && confirm("Delete this block? This cannot be undone.")) {
      removeNode(selectedNodeId);
    }
  };

  // Close sidebar
  const handleClose = () => {
    saveChanges();
    clearSelection();
    toggleSidebar(false);
  };

  // Get connected blocks
  const connections = edges.filter(
    (e) => e.source === selectedNodeId || e.target === selectedNodeId
  );

  // Multiple selection - show enhanced summary
  if (selectedNodeIds.length > 1) {
    // Get selected blocks data for summary
    const selectedBlocks = nodes
      .filter((n) => selectedNodeIds.includes(n.id))
      .map((n) => n.data as BlockData);
    
    // Group by company
    const byCompany = selectedBlocks.reduce((acc, b) => {
      acc[b.company] = (acc[b.company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by type
    const byType = selectedBlocks.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-950">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <span className="text-2xl font-black text-white">{selectedNodeIds.length}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-900">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Multiple Selection
                </h3>
                <p className="text-sm text-slate-400">
                  {selectedNodeIds.length} blocks selected
                </p>
              </div>
            </div>
            <button
              onClick={clearSelection}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
              title="Clear selection"
            >
              <svg className="w-5 h-5 text-slate-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Companies</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(byCompany).map(([company, count]) => (
                  <span
                    key={company}
                    className="px-2 py-1 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: company === "CERE" ? "rgba(59, 130, 246, 0.2)" : 
                                      company === "CEF" ? "rgba(168, 85, 247, 0.2)" : 
                                      "rgba(16, 185, 129, 0.2)",
                      color: company === "CERE" ? "#60a5fa" : 
                             company === "CEF" ? "#c084fc" : 
                             "#34d399"
                    }}
                  >
                    {company === "CERE" ? "🔵" : company === "CEF" ? "🟣" : "🟢"} {count}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Types</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(byType).slice(0, 4).map(([type, count]) => {
                  const cfg = BLOCK_CONFIGS[type as BlockType];
                  return (
                    <span
                      key={type}
                      className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300"
                    >
                      {cfg?.icon} {count}
                    </span>
                  );
                })}
                {Object.keys(byType).length > 4 && (
                  <span className="px-2 py-1 text-xs text-slate-500">
                    +{Object.keys(byType).length - 4}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Selected Blocks List */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Selected Blocks</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {selectedBlocks.slice(0, 10).map((block) => {
                const cfg = BLOCK_CONFIGS[block.type];
                return (
                  <div
                    key={block.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                  >
                    <span className="text-lg">{cfg?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{block.title}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {cfg?.label} • {block.company}
                      </p>
                    </div>
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: block.company === "CERE" ? "#3b82f6" : 
                                        block.company === "CEF" ? "#a855f7" : 
                                        "#10b981"
                      }}
                    />
                  </div>
                );
              })}
              {selectedBlocks.length > 10 && (
                <p className="text-center text-xs text-slate-500 py-2">
                  +{selectedBlocks.length - 10} more blocks
                </p>
              )}
            </div>
          </div>

          {/* Actions Hint */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-medium text-white mb-1">Bulk Actions Available</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use the floating toolbar above the canvas to change status or company for all selected blocks at once.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={clearSelection}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Selection
          </button>
        </div>
      </div>
    );
  }

  if (!blockData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center shadow-xl">
            <span className="text-4xl opacity-60">📦</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          No Block Selected
        </h3>
        <p className="text-sm text-slate-400 max-w-[240px] leading-relaxed">
          Click on a block to edit its properties, or drag a new block from the palette.
        </p>
        <div className="mt-6 flex flex-col gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700/50 text-slate-400">Click</kbd>
            <span>Select block</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700/50 text-slate-400">Shift+Click</kbd>
            <span>Multi-select</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700/50 text-slate-400">Drag</kbd>
            <span>Box select</span>
          </div>
        </div>
      </div>
    );
  }

  const config = BLOCK_CONFIGS[type];

  return (
    <div className="h-full flex flex-col" data-tour="block-editor">
      {/* Header */}
      <div
        className="p-4 border-b"
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h2 className="font-bold text-lg" style={{ color: config.color }}>
                Edit {config.label}
              </h2>
              <p className="text-xs text-gray-600">ID: {selectedNodeId?.slice(0, 8)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Favorite/Star Button */}
            {selectedNodeId && (
              <button
                onClick={() => toggleFavorite(selectedNodeId)}
                className={`p-2 rounded-lg transition-all ${
                  isFavorite(selectedNodeId)
                    ? "text-amber-400 hover:text-amber-300 bg-amber-500/10"
                    : "text-gray-400 hover:text-amber-400 hover:bg-white/50"
                }`}
                title={isFavorite(selectedNodeId) ? "Remove from favorites" : "Add to favorites"}
              >
                <svg 
                  className="w-5 h-5" 
                  viewBox="0 0 24 24" 
                  fill={isFavorite(selectedNodeId) ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Block title..."
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
            Subtitle
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            onBlur={handleBlur}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Short description..."
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Detailed content..."
          />
        </div>

        {/* Type and Company row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Block Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Block Type
            </label>
            <select
              value={type}
              onChange={(e) => {
                const newType = e.target.value as BlockType;
                setType(newType);
                // Update directly to avoid async state issues
                if (selectedNodeId) {
                  updateNode(selectedNodeId, { type: newType });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(BLOCK_CONFIGS).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.icon} {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Company
            </label>
            <select
              value={company}
              onChange={(e) => {
                const newCompany = e.target.value as Company;
                setCompany(newCompany);
                // Update directly to avoid async state issues
                if (selectedNodeId) {
                  updateNode(selectedNodeId, { company: newCompany });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="CERE">🔵 CERE</option>
              <option value="CEF">🟣 CEF</option>
              <option value="SHARED">🟢 Shared</option>
            </select>
          </div>
        </div>

        {/* Status with Lifecycle Enforcement */}
        <div data-tour="status">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Status
            </label>
            {blockUsage && <UsageBadge usage={blockUsage} />}
          </div>
          
          {/* Current Status Display */}
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ backgroundColor: STATUS_CONFIGS[status].bgColor }}>
            <span className="text-lg">{STATUS_CONFIGS[status].icon}</span>
            <span className="font-semibold" style={{ color: STATUS_CONFIGS[status].color }}>
              {STATUS_CONFIGS[status].label}
            </span>
          </div>
          
          {/* LIVE Block - Show Create Revision Button */}
          {status === "LIVE" && (
            <div className="mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs text-green-700 dark:text-green-400 mb-2">
                🔒 This block is LIVE. Direct edits are disabled. Create a revision to make changes.
              </p>
              <button
                onClick={handleCreateRevision}
                className="w-full px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Create Revision Draft
              </button>
            </div>
          )}
          
          {/* APPROVED Block - Show Publish Button */}
          {status === "APPROVED" && (
            <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-2">
                ✅ This block is approved and ready to publish.
              </p>
              <button
                onClick={handlePublish}
                className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                🚀 Publish to LIVE
              </button>
            </div>
          )}
          
          {/* Available Transitions */}
          {availableTransitions.length > 0 && status !== "LIVE" && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Available transitions:</p>
              <div className="flex flex-wrap gap-2">
                {availableTransitions.map((targetStatus) => {
                  const config = STATUS_CONFIGS[targetStatus];
                  return (
                    <button
                      key={targetStatus}
                      onClick={() => handleStatusTransition(targetStatus)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border hover:scale-105"
                      style={{
                        backgroundColor: config.bgColor,
                        borderColor: config.color,
                        color: config.color,
                      }}
                    >
                      {config.icon} {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Quick Status Override (for demo/admin purposes) */}
          <details className="text-xs">
            <summary className="text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
              Admin: Override Status
            </summary>
            <div className="mt-2 flex flex-wrap gap-1">
              {(["DRAFT", "PENDING_REVIEW", "APPROVED", "LIVE", "NEEDS_CHANGES", "VISION", "ARCHIVED"] as BlockStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    if (selectedNodeId) {
                      updateNode(selectedNodeId, { status: s });
                    }
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    status === s
                      ? "ring-2 ring-blue-500"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: STATUS_CONFIGS[s].bgColor,
                    color: STATUS_CONFIGS[s].color,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </details>
          
          {status === "PENDING_REVIEW" && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ This will appear on CEO View for review
            </p>
          )}
          {/* SLA Status for pending review */}
          {status === "PENDING_REVIEW" && blockData.submittedForReviewAt && (
            <SLAStatusBadge submittedAt={blockData.submittedForReviewAt} />
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            onBlur={handleBlur}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="tag1, tag2, tag3..."
          />
        </div>

        {/* External URL (for articles) */}
        {type === "ARTICLE" && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              External URL
            </label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>
        )}

        {/* Connections */}
        {connections.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              Connections ({connections.length})
            </label>
            <div className="space-y-2">
              {connections.map((conn) => {
                const isSource = conn.source === selectedNodeId;
                const otherNodeId = isSource ? conn.target : conn.source;
                const otherNode = nodes.find((n) => n.id === otherNodeId);
                const relType = conn.data?.relationshipType as RelationshipType;
                const relConfig = RELATIONSHIP_CONFIGS[relType || "REFERENCES"];

                return (
                  <div
                    key={conn.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs"
                  >
                    <span
                      className="px-2 py-1 rounded-full text-white text-[10px] font-semibold"
                      style={{ backgroundColor: relConfig.color }}
                    >
                      {relConfig.label}
                    </span>
                    <span className="text-gray-400">{isSource ? "→" : "←"}</span>
                    <span className="text-gray-700 dark:text-gray-300 truncate">
                      {(otherNode?.data as unknown as BlockData)?.title || "Unknown"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider */}
        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Content Quality Score */}
        <ContentScorePanel
          content={content}
          title={title}
          subtitle={subtitle}
        />

        {/* Divider */}
        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Dependencies */}
        {selectedNodeId && <DependencyPanel blockId={selectedNodeId} />}

        {/* Wireframe Usage */}
        {selectedNodeId && (
          <WireframeUsagePanel
            blockId={selectedNodeId}
            wireframeSections={wireframeSections}
            selectSection={selectSection}
            selectWireframePage={selectWireframePage}
            router={router}
          />
        )}

        {/* Divider */}
        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Comments */}
        {selectedNodeId && (
          <CommentsPanel
            blockId={selectedNodeId}
            comments={blockData.comments || []}
          />
        )}

        {/* Review Comments Thread */}
        {selectedNodeId && (
          <>
            <hr className="border-gray-200 dark:border-gray-700" />
            <ReviewCommentsPanel blockId={selectedNodeId} />
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        {status !== "LIVE" ? (
          <button
            onClick={saveChanges}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            {hasUsage ? "Save & Update Linked Content" : "Save Changes"}
          </button>
        ) : (
          <button
            onClick={handleCreateRevision}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
          >
            Create Revision to Edit
          </button>
        )}
        <button
          onClick={handleDelete}
          className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-semibold rounded-lg transition-colors"
        >
          Delete Block
        </button>
      </div>
      
      {/* Impact Analysis Modal */}
      {blockUsage && (
        <ImpactAnalysisModal
          isOpen={showImpactModal}
          onClose={() => {
            setShowImpactModal(false);
            setPendingAction(null);
          }}
          onConfirm={() => {
            if (pendingAction) {
              pendingAction();
            }
            setShowImpactModal(false);
            setPendingAction(null);
          }}
          blockTitle={title}
          usage={blockUsage}
          actionLabel="Save Changes"
        />
      )}
    </div>
  );
}

// SLA Status Badge component
function SLAStatusBadge({ submittedAt }: { submittedAt: Date }) {
  const sla = calculateSLAStatus(submittedAt);

  return (
    <div
      className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium"
      style={{
        backgroundColor: `${sla.statusColor}15`,
        color: sla.statusColor,
        borderLeft: `3px solid ${sla.statusColor}`,
      }}
    >
      <span>{sla.statusLabel}</span>
      {sla.isOverdue && (
        <span className="animate-pulse">⏰</span>
      )}
    </div>
  );
}

// Wireframe Usage Panel - shows which wireframe sections use this block
import type { WireframeSection } from "@/lib/wireframe-types";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface WireframeUsagePanelProps {
  blockId: string;
  wireframeSections: WireframeSection[];
  selectSection: (id: string | null) => void;
  selectWireframePage: (pageId: string | null) => void;
  router: AppRouterInstance;
}

function WireframeUsagePanel({
  blockId,
  wireframeSections,
  selectSection,
  selectWireframePage,
  router,
}: WireframeUsagePanelProps) {
  // Find all sections that link to this block
  const sectionsUsingBlock = wireframeSections.filter((section) =>
    section.linkedBlockIds.includes(blockId)
  );

  if (sectionsUsingBlock.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
          Wireframe Usage
        </h3>
        <p className="text-sm text-gray-500">
          Not used in any wireframe sections yet.
        </p>
      </div>
    );
  }

  const handleNavigateToSection = (section: WireframeSection) => {
    // Select the page and section, then navigate
    selectWireframePage(section.pageId || `${section.company}-home`);
    selectSection(section.id);
    router.push("/?tab=wireframe");
  };

  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
        Wireframe Usage
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Used in {sectionsUsingBlock.length} section{sectionsUsingBlock.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-2">
        {sectionsUsingBlock.slice(0, 3).map((section) => (
          <button
            key={section.id}
            onClick={() => handleNavigateToSection(section)}
            className="w-full flex items-center gap-3 p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-left transition-colors group"
          >
            <span className="text-xl">{section.type === "HERO" ? "🦸" : section.type === "CTA" ? "🎯" : "📄"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {section.type.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {section.company} • {section.pageId || "Home Page"}
              </p>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        ))}
        {sectionsUsingBlock.length > 3 && (
          <p className="text-xs text-gray-500 text-center">
            +{sectionsUsingBlock.length - 3} more sections
          </p>
        )}
      </div>
    </div>
  );
}

