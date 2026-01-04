"use client";

import React, { useMemo } from "react";
import type { VersionSnapshot } from "@/lib/version-control";
import type { BlockData } from "@/lib/types";
import { BLOCK_CONFIGS } from "@/lib/types";

interface VisualDiffProps {
  oldSnapshot: VersionSnapshot;
  newSnapshot: VersionSnapshot;
}

interface DiffBlock {
  id: string;
  title: string;
  type: string;
  status: "added" | "removed" | "modified" | "unchanged";
  oldData?: BlockData;
  newData?: BlockData;
  changes?: string[];
}

/**
 * VisualDiff - Side-by-side visual comparison of two version snapshots
 */
export default function VisualDiff({ oldSnapshot, newSnapshot }: VisualDiffProps) {
  // Calculate detailed diff
  const diffBlocks = useMemo(() => {
    const oldMap = new Map(
      oldSnapshot.nodes.map((n) => [n.id, n.data as BlockData])
    );
    const newMap = new Map(
      newSnapshot.nodes.map((n) => [n.id, n.data as BlockData])
    );

    const blocks: DiffBlock[] = [];

    // Check new blocks
    for (const [id, newData] of newMap) {
      const oldData = oldMap.get(id);

      if (!oldData) {
        // Added
        blocks.push({
          id,
          title: newData.title,
          type: newData.type,
          status: "added",
          newData,
        });
      } else {
        // Check for modifications
        const changes: string[] = [];
        if (oldData.title !== newData.title) changes.push("title");
        if (oldData.content !== newData.content) changes.push("content");
        if (oldData.subtitle !== newData.subtitle) changes.push("subtitle");
        if (oldData.status !== newData.status) changes.push("status");
        if (oldData.company !== newData.company) changes.push("company");
        if (oldData.type !== newData.type) changes.push("type");

        if (changes.length > 0) {
          blocks.push({
            id,
            title: newData.title,
            type: newData.type,
            status: "modified",
            oldData,
            newData,
            changes,
          });
        } else {
          blocks.push({
            id,
            title: newData.title,
            type: newData.type,
            status: "unchanged",
            oldData,
            newData,
          });
        }
      }
    }

    // Check removed blocks
    for (const [id, oldData] of oldMap) {
      if (!newMap.has(id)) {
        blocks.push({
          id,
          title: oldData.title,
          type: oldData.type,
          status: "removed",
          oldData,
        });
      }
    }

    // Sort: modifications first, then added, then removed, then unchanged
    const statusOrder = { modified: 0, added: 1, removed: 2, unchanged: 3 };
    blocks.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    return blocks;
  }, [oldSnapshot, newSnapshot]);

  const stats = useMemo(() => {
    return {
      added: diffBlocks.filter((b) => b.status === "added").length,
      removed: diffBlocks.filter((b) => b.status === "removed").length,
      modified: diffBlocks.filter((b) => b.status === "modified").length,
      unchanged: diffBlocks.filter((b) => b.status === "unchanged").length,
    };
  }, [diffBlocks]);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-slate-300">
            <strong className="text-green-400">{stats.added}</strong> added
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-slate-300">
            <strong className="text-red-400">{stats.removed}</strong> removed
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm text-slate-300">
            <strong className="text-amber-400">{stats.modified}</strong> modified
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-500" />
          <span className="text-sm text-slate-300">
            <strong className="text-slate-400">{stats.unchanged}</strong> unchanged
          </span>
        </div>
      </div>

      {/* Diff blocks */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {diffBlocks.filter((b) => b.status !== "unchanged").map((block) => (
          <DiffBlockCard key={block.id} block={block} />
        ))}

        {/* Collapsed unchanged blocks */}
        {stats.unchanged > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-400 flex items-center gap-2 py-2">
              <svg
                className="w-4 h-4 transform group-open:rotate-90 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              {stats.unchanged} unchanged block{stats.unchanged !== 1 ? "s" : ""}
            </summary>
            <div className="mt-2 space-y-2 pl-6">
              {diffBlocks
                .filter((b) => b.status === "unchanged")
                .map((block) => (
                  <div
                    key={block.id}
                    className="text-sm text-slate-500 flex items-center gap-2"
                  >
                    <span>{BLOCK_CONFIGS[block.type as keyof typeof BLOCK_CONFIGS]?.icon || "📄"}</span>
                    <span>{block.title}</span>
                  </div>
                ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function DiffBlockCard({ block }: { block: DiffBlock }) {
  const config = BLOCK_CONFIGS[block.type as keyof typeof BLOCK_CONFIGS];
  const statusColors = {
    added: {
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      badge: "bg-green-500",
      text: "text-green-400",
    },
    removed: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      badge: "bg-red-500",
      text: "text-red-400",
    },
    modified: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      badge: "bg-amber-500",
      text: "text-amber-400",
    },
    unchanged: {
      bg: "bg-slate-800/50",
      border: "border-slate-700",
      badge: "bg-slate-500",
      text: "text-slate-400",
    },
  };

  const colors = statusColors[block.status];

  return (
    <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">{config?.icon || "📄"}</span>
          <div>
            <h4 className="font-medium text-white">{block.title}</h4>
            <span className="text-xs text-slate-500">{config?.label || block.type}</span>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full text-white ${colors.badge}`}
        >
          {block.status.charAt(0).toUpperCase() + block.status.slice(1)}
        </span>
      </div>

      {/* Changes detail */}
      {block.status === "modified" && block.changes && (
        <div className="space-y-2">
          {block.changes.map((field) => (
            <div key={field} className="text-sm">
              <span className="text-slate-500 capitalize">{field}:</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-300 text-xs line-through">
                  {String(block.oldData?.[field as keyof BlockData] || "(empty)").slice(0, 100)}
                </div>
                <div className="p-2 bg-green-500/10 border border-green-500/20 rounded text-green-300 text-xs">
                  {String(block.newData?.[field as keyof BlockData] || "(empty)").slice(0, 100)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Added content preview */}
      {block.status === "added" && block.newData?.content && (
        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded text-green-300 text-xs">
          {block.newData.content.slice(0, 150)}
          {block.newData.content.length > 150 && "..."}
        </div>
      )}

      {/* Removed content preview */}
      {block.status === "removed" && block.oldData?.content && (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-300 text-xs line-through">
          {block.oldData.content.slice(0, 150)}
          {block.oldData.content.length > 150 && "..."}
        </div>
      )}
    </div>
  );
}


