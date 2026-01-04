"use client";

import React, { useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import type { BlockData } from "@/lib/types";

interface DependencyPanelProps {
  blockId: string;
}

interface DependencyItem {
  id: string;
  name: string;
  type: "wireframe" | "roadmap" | "block";
  subtype?: string;
  icon: string;
}

/**
 * DependencyPanel - Shows where this block is used across the system
 * Displays linked wireframe sections, roadmap items, and connected blocks
 */
export default function DependencyPanel({ blockId }: DependencyPanelProps) {
  const { nodes, edges, wireframeSections, roadmapItems } = useCanvasStore();

  const dependencies = useMemo(() => {
    const deps: DependencyItem[] = [];

    // Find wireframe sections that link to this block
    wireframeSections.forEach((section) => {
      if (section.linkedBlockIds.includes(blockId)) {
        deps.push({
          id: section.id,
          name: `${section.type} Section`,
          type: "wireframe",
          subtype: section.pageId,
          icon: "🎨",
        });
      }
    });

    // Find roadmap items that link to this block
    roadmapItems.forEach((item) => {
      if (item.linkedBlockIds.includes(blockId)) {
        deps.push({
          id: item.id,
          name: item.title,
          type: "roadmap",
          subtype: item.phaseId,
          icon: "📅",
        });
      }
    });

    // Find connected blocks (edges)
    const outgoing = edges
      .filter((e) => e.source === blockId)
      .map((e) => {
        const targetNode = nodes.find((n) => n.id === e.target);
        const targetData = targetNode?.data as BlockData | undefined;
        return {
          id: e.target,
          name: targetData?.title || "Unknown Block",
          type: "block" as const,
          subtype: `→ ${(e.data as { relationshipType?: string })?.relationshipType || "REFERENCES"}`,
          icon: "📦",
        };
      });

    const incoming = edges
      .filter((e) => e.target === blockId)
      .map((e) => {
        const sourceNode = nodes.find((n) => n.id === e.source);
        const sourceData = sourceNode?.data as BlockData | undefined;
        return {
          id: e.source,
          name: sourceData?.title || "Unknown Block",
          type: "block" as const,
          subtype: `← ${(e.data as { relationshipType?: string })?.relationshipType || "REFERENCES"}`,
          icon: "📦",
        };
      });

    deps.push(...outgoing, ...incoming);

    return deps;
  }, [blockId, wireframeSections, roadmapItems, edges, nodes]);

  const wireframeDeps = dependencies.filter((d) => d.type === "wireframe");
  const roadmapDeps = dependencies.filter((d) => d.type === "roadmap");
  const blockDeps = dependencies.filter((d) => d.type === "block");

  const isHighImpact = dependencies.length >= 5;

  if (dependencies.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          Dependencies
        </h3>
        <div className="text-center py-3 text-gray-500 text-xs">
          <span className="text-lg block mb-1">🔗</span>
          Not linked to any sections or roadmap items
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with impact warning */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          Dependencies
        </h3>
        {isHighImpact && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full animate-pulse">
            ⚠️ HIGH IMPACT
          </span>
        )}
      </div>

      {isHighImpact && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
          This block is used in {dependencies.length}+ places. Changes will have wide impact!
        </div>
      )}

      {/* Wireframe sections */}
      {wireframeDeps.length > 0 && (
        <DependencyGroup
          title="Wireframe Sections"
          icon="🎨"
          items={wireframeDeps}
          color="#8b5cf6"
        />
      )}

      {/* Roadmap items */}
      {roadmapDeps.length > 0 && (
        <DependencyGroup
          title="Roadmap Items"
          icon="📅"
          items={roadmapDeps}
          color="#3b82f6"
        />
      )}

      {/* Connected blocks */}
      {blockDeps.length > 0 && (
        <DependencyGroup
          title="Connected Blocks"
          icon="📦"
          items={blockDeps}
          color="#22c55e"
        />
      )}

      {/* Summary */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
        <span>Total: {dependencies.length} dependencies</span>
      </div>
    </div>
  );
}

// Dependency group component
function DependencyGroup({
  title,
  icon,
  items,
  color,
}: {
  title: string;
  icon: string;
  items: DependencyItem[];
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
        <span>{icon}</span>
        <span>{title}</span>
        <span
          className="ml-auto px-1.5 py-0.5 text-[10px] rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {items.length}
        </span>
      </div>
      <div className="space-y-1 pl-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded text-xs"
          >
            <span className="truncate flex-1 text-gray-700 dark:text-gray-300">
              {item.name}
            </span>
            {item.subtype && (
              <span className="text-[10px] text-gray-400 truncate max-w-20">
                {item.subtype}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


