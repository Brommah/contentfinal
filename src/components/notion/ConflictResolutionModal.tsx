"use client";

import React, { useState } from "react";
import type { SyncRecord } from "@/lib/notion-types";
import type { BlockData } from "@/lib/types";
import type { RoadmapItem } from "@/lib/roadmap-types";
import { BLOCK_CONFIGS } from "@/lib/types";

interface ConflictResolutionModalProps {
  conflicts: SyncRecord[];
  onResolve: (id: string, resolution: "APP" | "NOTION") => void;
  onResolveAll: (resolution: "APP" | "NOTION") => void;
  onClose: () => void;
}

/**
 * ConflictResolutionModal - UI for resolving sync conflicts between App and Notion
 */
export default function ConflictResolutionModal({
  conflicts,
  onResolve,
  onResolveAll,
  onClose,
}: ConflictResolutionModalProps) {
  const [selectedConflict, setSelectedConflict] = useState<SyncRecord | null>(
    conflicts[0] || null
  );

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                ⚠️ Resolve Sync Conflicts
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {conflicts.length} item{conflicts.length !== 1 ? "s" : ""} have
                conflicting changes between App and Notion
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conflict List */}
          <div className="w-72 border-r border-slate-700 overflow-y-auto bg-slate-800/30">
            <div className="p-3 border-b border-slate-700/50 sticky top-0 bg-slate-800/90 backdrop-blur-sm">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Conflicting Items
              </p>
            </div>
            <div className="p-2 space-y-1">
              {conflicts.map((conflict) => (
                <button
                  key={conflict.appId}
                  onClick={() => setSelectedConflict(conflict)}
                  className={`
                    w-full p-3 rounded-lg text-left transition-colors
                    ${selectedConflict?.appId === conflict.appId
                      ? "bg-amber-500/20 border border-amber-500/40"
                      : "hover:bg-slate-700/50"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {conflict.entityType === "BLOCK" ? "📦" : "🗺️"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {getConflictTitle(conflict)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {conflict.entityType === "BLOCK"
                          ? "Content Block"
                          : "Roadmap Item"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Comparison View */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedConflict ? (
              <ConflictComparison
                conflict={selectedConflict}
                onResolve={onResolve}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Select a conflict to compare
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Tip: Use "Keep App Version" to preserve your local changes, or
              "Use Notion Version" to sync from Notion.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onResolveAll("APP")}
                className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg font-medium text-sm hover:bg-blue-500/30 transition-colors"
              >
                Keep All App Versions
              </button>
              <button
                onClick={() => onResolveAll("NOTION")}
                className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg font-medium text-sm hover:bg-purple-500/30 transition-colors"
              >
                Use All Notion Versions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ConflictComparison - Side-by-side comparison of app vs notion versions
 */
function ConflictComparison({
  conflict,
  onResolve,
}: {
  conflict: SyncRecord;
  onResolve: (id: string, resolution: "APP" | "NOTION") => void;
}) {
  const appVersion = conflict.conflictData?.appVersion;
  const notionVersion = conflict.conflictData?.notionVersion;

  if (!appVersion || !notionVersion) {
    return (
      <div className="text-slate-400 text-center py-8">
        Unable to compare versions - data missing
      </div>
    );
  }

  const isBlock = conflict.entityType === "BLOCK";
  const fields = isBlock
    ? ["title", "subtitle", "content", "status", "tags"]
    : ["title", "description", "status", "priority", "tags"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {getConflictTitle(conflict)}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onResolve(conflict.appId, "APP")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors"
          >
            Keep App Version
          </button>
          <button
            onClick={() => onResolve(conflict.appId, "NOTION")}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium text-sm hover:bg-purple-600 transition-colors"
          >
            Use Notion Version
          </button>
        </div>
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* App Version */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-blue-500/20 border-b border-blue-500/30">
            <h4 className="text-blue-300 font-medium text-sm flex items-center gap-2">
              📱 App Version
              <span className="text-xs text-blue-400 ml-auto">
                {formatDate(conflict.lastAppUpdate)}
              </span>
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {fields.map((field) => (
              <FieldDisplay
                key={field}
                field={field}
                value={(appVersion as Record<string, unknown>)[field]}
                isChanged={
                  (appVersion as Record<string, unknown>)[field] !==
                  (notionVersion as Record<string, unknown>)[field]
                }
                highlightColor="blue"
              />
            ))}
          </div>
        </div>

        {/* Notion Version */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-purple-500/20 border-b border-purple-500/30">
            <h4 className="text-purple-300 font-medium text-sm flex items-center gap-2">
              <NotionIcon className="w-4 h-4" /> Notion Version
              <span className="text-xs text-purple-400 ml-auto">
                {formatDate(conflict.lastNotionUpdate)}
              </span>
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {fields.map((field) => (
              <FieldDisplay
                key={field}
                field={field}
                value={(notionVersion as Record<string, unknown>)[field]}
                isChanged={
                  (appVersion as Record<string, unknown>)[field] !==
                  (notionVersion as Record<string, unknown>)[field]
                }
                highlightColor="purple"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FieldDisplay - Displays a single field value
 */
function FieldDisplay({
  field,
  value,
  isChanged,
  highlightColor,
}: {
  field: string;
  value: unknown;
  isChanged: boolean;
  highlightColor: "blue" | "purple";
}) {
  const displayValue = formatFieldValue(value);
  const bgClass = isChanged
    ? highlightColor === "blue"
      ? "bg-blue-500/20"
      : "bg-purple-500/20"
    : "";

  return (
    <div className={`rounded-lg p-2 ${bgClass}`}>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
        {formatFieldName(field)}
        {isChanged && (
          <span className="ml-2 text-amber-400 text-[10px]">• Changed</span>
        )}
      </p>
      <p className="text-sm text-white">
        {displayValue || <span className="text-slate-500 italic">Empty</span>}
      </p>
    </div>
  );
}

// Helper functions
function getConflictTitle(conflict: SyncRecord): string {
  if (conflict.conflictData?.appVersion) {
    const version = conflict.conflictData.appVersion as BlockData | RoadmapItem;
    return version.title || conflict.appId;
  }
  return conflict.appId;
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotionIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.886l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.494-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933l3.222-.186zM2.197 1.035l13.544-.793c1.68-.14 2.101.56 2.801 1.12l3.869 2.706c.466.326.606.7.606 1.213v15.064c0 1.4-.513 2.193-2.333 2.333l-15.457.933c-1.353.093-2.007-.14-2.707-1.026L.66 19.655c-.56-.747-.793-1.307-.793-1.96V2.962c0-.84.513-1.68 2.33-1.927z" />
    </svg>
  );
}


