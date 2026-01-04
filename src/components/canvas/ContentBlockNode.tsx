"use client";

import React, { memo, useCallback, useMemo } from "react";
import { Handle, Position, useStore, type NodeProps } from "@xyflow/react";
import { useCanvasStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import {
  BLOCK_CONFIGS,
  COMPANY_COLORS,
  type BlockData,
  type Company,
  type BlockStatus,
} from "@/lib/types";

// Detail level based on zoom
type DetailLevel = "minimal" | "compact" | "full";

function getDetailLevel(zoom: number): DetailLevel {
  if (zoom < 0.4) return "minimal";
  if (zoom < 0.7) return "compact";
  return "full";
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: BlockStatus }) {
  const statusConfig: Record<BlockStatus, { label: string; className: string }> = {
    LIVE: {
      label: "Live",
      className: "bg-green-500 text-white status-badge-live",
    },
    VISION: {
      label: "Vision",
      className: "bg-purple-500 text-white",
    },
    DRAFT: {
      label: "Draft",
      className: "bg-gray-400 text-white",
    },
    ARCHIVED: {
      label: "Archived",
      className: "bg-gray-600 text-white",
    },
    PENDING_REVIEW: {
      label: "⏳ Review",
      className: "bg-amber-500 text-white animate-pulse",
    },
    APPROVED: {
      label: "✅ Approved",
      className: "bg-emerald-500 text-white",
    },
    NEEDS_CHANGES: {
      label: "🔄 Changes",
      className: "bg-red-500 text-white",
    },
  };

  const config = statusConfig[status] || statusConfig.DRAFT;

  return (
    <span
      className={`absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-semibold rounded-full shadow-sm ${config.className}`}
    >
      {config.label}
    </span>
  );
}

/**
 * Company indicator strip
 */
function CompanyStrip({ company }: { company: Company }) {
  const colors = COMPANY_COLORS[company];
  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
      style={{ backgroundColor: colors.primary }}
    />
  );
}

/**
 * ContentBlockNode - Visual block for content schema
 * Supports zoom-dependent detail levels for better performance
 */
function ContentBlockNode({ data, selected }: NodeProps) {
  const blockData = data as unknown as BlockData;
  const config = BLOCK_CONFIGS[blockData.type];
  const { selectNode, isConnecting, connectingFromId, finishConnecting } = useCanvasStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  // Get current zoom level from ReactFlow store
  const zoom = useStore((state) => state.transform[2]);
  const detailLevel = useMemo(() => getDetailLevel(zoom), [zoom]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isConnecting && connectingFromId !== blockData.id) {
        finishConnecting(blockData.id);
      } else {
        selectNode(blockData.id);
      }
    },
    [blockData.id, isConnecting, connectingFromId, finishConnecting, selectNode]
  );

  return (
    <div
      onClick={handleClick}
      className={`
        content-block
        relative
        rounded-xl
        border-2
        transition-all
        duration-150
        min-w-[200px]
        max-w-[400px]
        ${selected ? "ring-2 ring-blue-500 ring-offset-2" : ""}
        ${isConnecting && connectingFromId !== blockData.id ? "cursor-pointer ring-2 ring-blue-300 ring-opacity-50" : ""}
      `}
      style={{
        borderColor: config.borderColor,
        backgroundColor: isDark ? "#1c1917" : "#ffffff",
        boxShadow: isDark ? "0 10px 25px -5px rgba(0, 0, 0, 0.5)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* Company color strip */}
      <CompanyStrip company={blockData.company} />

      {/* Status badge */}
      <StatusBadge status={blockData.status} />

      {/* Content - adapts to zoom level */}
      <div className={`pl-4 pr-3 ${detailLevel === "minimal" ? "py-2" : "py-3"}`}>
        {/* Minimal view - just icon, type badge, and title */}
        {detailLevel === "minimal" ? (
          <div className="flex items-center gap-2">
            <span className="text-xl flex-shrink-0">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <h3 
                className="font-semibold text-sm leading-tight truncate"
                style={{ color: isDark ? "#ffffff" : "#111827" }}
              >
                {blockData.title}
              </h3>
            </div>
          </div>
        ) : (
          <>
            {/* Header - shown in compact and full */}
        <div className="flex items-start gap-2 mb-1">
          <span className="text-lg flex-shrink-0">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  borderLeftWidth: 2,
                  borderLeftColor: config.borderColor,
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                  color: isDark ? "#e5e7eb" : "#374151",
                }}
              >
                {config.label}
              </span>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                  color: isDark ? "#d1d5db" : "#374151",
                }}
              >
                {blockData.company}
              </span>
            </div>
            <h3 
                  className={`font-semibold text-sm mt-1 leading-tight ${detailLevel === "compact" ? "line-clamp-1" : "line-clamp-2"}`}
              style={{ color: isDark ? "#ffffff" : "#111827" }}
            >
              {blockData.title}
            </h3>
          </div>
        </div>

            {/* Subtitle - always show in both compact and full views */}
            {blockData.subtitle && (
          <p 
            className="text-xs mt-1 line-clamp-1 pl-7"
            style={{ color: isDark ? "#9ca3af" : "#4b5563" }}
          >
            {blockData.subtitle}
          </p>
        )}

            {/* Content preview - only in full view */}
            {blockData.content && detailLevel === "full" && (
          <p 
            className="text-xs mt-2 line-clamp-2 pl-7"
            style={{ color: isDark ? "#6b7280" : "#6b7280" }}
          >
            {blockData.content}
          </p>
        )}

            {/* Tags - only in full view */}
            {blockData.tags && blockData.tags.length > 0 && detailLevel === "full" && (
          <div className="flex flex-wrap gap-1 mt-2 pl-7">
            {blockData.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                  color: isDark ? "#9ca3af" : "#4b5563",
                }}
              >
                {tag}
              </span>
            ))}
            {blockData.tags.length > 3 && (
              <span className="text-[10px] text-gray-400">
                +{blockData.tags.length - 3}
              </span>
            )}
          </div>
        )}

            {/* External link indicator - only in full view */}
            {blockData.externalUrl && detailLevel === "full" && (
          <div className="flex items-center gap-1 mt-2 pl-7">
            <svg
              className="w-3 h-3 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
              {blockData.externalUrl}
            </span>
          </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default memo(ContentBlockNode);

