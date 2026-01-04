"use client";

import React, { useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { STATUS_CONFIGS, PRIORITY_CONFIGS, PHASE_CONFIGS } from "@/lib/roadmap-types";
import type { RoadmapStatus } from "@/lib/roadmap-types";
import type { BlockData, BlockStatus } from "@/lib/types";
import { STATUS_CONFIGS as BLOCK_STATUS_CONFIGS } from "@/lib/types";

/**
 * RoadmapItemEditor - Sidebar for editing selected roadmap item
 */
export default function RoadmapItemEditor() {
  const {
    roadmapItems,
    roadmapPhases,
    selectedRoadmapItemId,
    nodes,
    updateRoadmapItem,
    removeRoadmapItem,
    selectRoadmapItem,
    linkBlockToRoadmapItem,
    unlinkBlockFromRoadmapItem,
    getLinkedBlocksStatus,
    publishAllLinkedBlocks,
    getSuggestedRoadmapStatus,
  } = useCanvasStore();

  const item = roadmapItems.find((i) => i.id === selectedRoadmapItemId);

  if (!item) return null;

  // Get linked blocks status for roadmap-content sync
  const linkedBlocksStatus = getLinkedBlocksStatus(item.id);
  const suggestedStatus = getSuggestedRoadmapStatus(item.id);

  const linkedBlocks = item.linkedBlockIds
    .map((id) => {
      const node = nodes.find((n) => n.id === id);
      return node ? (node.data as unknown as BlockData) : null;
    })
    .filter((b): b is BlockData => b !== null);

  const availableBlocks = nodes
    .filter((n) => {
      const data = n.data as unknown as BlockData;
      return data.company === item.company || data.company === "SHARED";
    })
    .map((n) => n.data as unknown as BlockData);

  const handleToggleBlock = (blockId: string) => {
    if (item.linkedBlockIds.includes(blockId)) {
      unlinkBlockFromRoadmapItem(item.id, blockId);
    } else {
      linkBlockToRoadmapItem(item.id, blockId);
    }
  };

  return (
    <aside className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <span
            className={`
              px-2 py-0.5 rounded text-[10px] font-semibold
              ${item.company === "CERE"
                ? "bg-cyan-500/20 text-cyan-400"
                : "bg-emerald-500/20 text-emerald-400"
              }
            `}
          >
            {item.company}
          </span>
          <h2 className="font-semibold text-gray-900 dark:text-white mt-1 text-sm">
            Edit Content Item
          </h2>
        </div>
        <button
          onClick={() => selectRoadmapItem(null)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
            Title
          </label>
          <input
            type="text"
            value={item.title}
            onChange={(e) => updateRoadmapItem(item.id, { title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm border-0 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            value={item.description}
            onChange={(e) => updateRoadmapItem(item.id, { description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm border-0 focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Phase */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
            Phase
          </label>
          <select
            value={item.phaseId}
            onChange={(e) => updateRoadmapItem(item.id, { phaseId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm border-0 focus:ring-2 focus:ring-blue-500"
          >
            {roadmapPhases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {PHASE_CONFIGS[phase.type].icon} {phase.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_CONFIGS) as RoadmapStatus[]).map((status) => {
              const config = STATUS_CONFIGS[status];
              return (
                <button
                  key={status}
                  onClick={() => updateRoadmapItem(item.id, { status })}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1
                    ${item.status === status
                      ? "ring-2 ring-offset-1 ring-blue-500"
                      : ""
                    }
                  `}
                  style={{
                    backgroundColor: `${config.color}20`,
                    color: config.color,
                  }}
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
            Priority
          </label>
          <div className="flex gap-2">
            {(Object.keys(PRIORITY_CONFIGS) as (keyof typeof PRIORITY_CONFIGS)[]).map((priority) => {
              const config = PRIORITY_CONFIGS[priority];
              return (
                <button
                  key={priority}
                  onClick={() => updateRoadmapItem(item.id, { priority })}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                    ${item.priority === priority
                      ? "ring-2 ring-offset-1 ring-blue-500"
                      : ""
                    }
                  `}
                  style={{
                    backgroundColor: `${config.color}20`,
                    color: config.color,
                  }}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
            Target Date
          </label>
          <input
            type="date"
            value={new Date(item.targetDate).toISOString().split("T")[0]}
            onChange={(e) => updateRoadmapItem(item.id, { targetDate: new Date(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm border-0 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Linked Blocks with Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
            Linked Content Blocks ({linkedBlocks.length})
          </label>
          
          {/* Block Status Summary */}
          {linkedBlocks.length > 0 && (
            <div className="mb-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Content Status</span>
                {linkedBlocksStatus.hasIssues && (
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <span>⚠️</span> Issues detected
                  </span>
                )}
              </div>
              
              {/* Status breakdown */}
              <div className="flex flex-wrap gap-1 mb-2">
                {Object.entries(linkedBlocksStatus.byStatus).map(([status, count]) => {
                  const config = BLOCK_STATUS_CONFIGS[status as BlockStatus];
                  return (
                    <span
                      key={status}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ backgroundColor: `${config.color}20`, color: config.color }}
                    >
                      {config.icon} {count} {config.label}
                    </span>
                  );
                })}
              </div>
              
              {/* Suggested Status */}
              {suggestedStatus && suggestedStatus !== item.status && (
                <div className="mt-2 p-2 rounded bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs text-blue-300 mb-1">
                    💡 Based on linked blocks, consider status:
                  </p>
                  <button
                    onClick={() => updateRoadmapItem(item.id, { status: suggestedStatus })}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 underline"
                  >
                    Set to {STATUS_CONFIGS[suggestedStatus].label}
                  </button>
                </div>
              )}
              
              {/* Publish All Button */}
              {linkedBlocksStatus.readyToPublish && (
                <button
                  onClick={() => {
                    const result = publishAllLinkedBlocks(item.id);
                    alert(`Published ${result.published} blocks. ${result.failed} failed.`);
                  }}
                  className="mt-2 w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>🚀</span>
                  Publish All Approved Blocks
                </button>
              )}
            </div>
          )}
          
          <p className="text-[10px] text-gray-500 mb-2">
            Connect this item to content in the schema
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {availableBlocks.slice(0, 20).map((block) => {
              const isLinked = item.linkedBlockIds.includes(block.id);
              const blockStatusConfig = BLOCK_STATUS_CONFIGS[block.status];
              return (
                <button
                  key={block.id}
                  onClick={() => handleToggleBlock(block.id)}
                  className={`
                    w-full text-left p-2 rounded text-xs transition-colors flex items-center gap-2
                    ${isLinked
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${isLinked ? "bg-blue-500 text-white" : "bg-gray-300 dark:bg-gray-600"}`}>
                    {isLinked ? "✓" : ""}
                  </span>
                  <span className="truncate flex-1">{block.title}</span>
                  {isLinked && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                      style={{ backgroundColor: `${blockStatusConfig.color}20`, color: blockStatusConfig.color }}
                    >
                      {blockStatusConfig.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* External Links */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
            External Links
          </label>
          <div className="space-y-3">
            {/* Google Docs */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z"/>
                  <path d="M8 12h8v2H8zm0 4h5v2H8z"/>
                </svg>
              </div>
              <input
                type="url"
                value={item.googleDocsUrl || ""}
                onChange={(e) => updateRoadmapItem(item.id, { googleDocsUrl: e.target.value || undefined })}
                placeholder="Google Docs URL"
                className="flex-1 px-2 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs border-0 focus:ring-2 focus:ring-blue-500"
              />
              {item.googleDocsUrl && (
                <a
                  href={item.googleDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                  title="Open Google Doc"
                >
                  <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>

            {/* Notion */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-slate-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h6v2H8v-2z"/>
                </svg>
              </div>
              <input
                type="url"
                value={item.notionPageUrl || ""}
                onChange={(e) => updateRoadmapItem(item.id, { notionPageUrl: e.target.value || undefined })}
                placeholder="Notion Page URL"
                className="flex-1 px-2 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs border-0 focus:ring-2 focus:ring-slate-500"
              />
              {item.notionPageUrl && (
                <a
                  href={item.notionPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded bg-slate-500/20 hover:bg-slate-500/30 transition-colors"
                  title="Open Notion Page"
                >
                  <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>

            {/* Figma */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2H8a4 4 0 000 8 4 4 0 004 4h4a4 4 0 100-8 4 4 0 00-4-4zm0 12a4 4 0 104 4v-4h-4z"/>
                </svg>
              </div>
              <input
                type="url"
                value={item.figmaUrl || ""}
                onChange={(e) => updateRoadmapItem(item.id, { figmaUrl: e.target.value || undefined })}
                placeholder="Figma Design URL"
                className="flex-1 px-2 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs border-0 focus:ring-2 focus:ring-purple-500"
              />
              {item.figmaUrl && (
                <a
                  href={item.figmaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
                  title="Open Figma Design"
                >
                  <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => {
            removeRoadmapItem(item.id);
            selectRoadmapItem(null);
          }}
          className="w-full px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
        >
          Delete Item
        </button>
      </div>
    </aside>
  );
}

