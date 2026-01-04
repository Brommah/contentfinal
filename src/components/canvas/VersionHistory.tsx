"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/lib/store";
import type { BlockData, ConnectionData, RelationshipType } from "@/lib/types";
import {
  getSnapshots,
  createSnapshot,
  restoreSnapshot,
  compareSnapshots,
  initVersionControl,
  type VersionSnapshot,
} from "@/lib/version-control";

interface VersionHistoryProps {
  onClose: () => void;
}

/**
 * VersionHistory - Visual diff mode with timeline slider
 * Tracks content changes over time and allows comparison
 */
export default function VersionHistory({ onClose }: VersionHistoryProps) {
  const { nodes, edges, workspaceId, loadFromData } = useCanvasStore();
  const { setNodes, setEdges, fitView } = useReactFlow();
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [compareIndex, setCompareIndex] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load snapshots on mount
  useEffect(() => {
    const wsId = workspaceId || "demo";
    
    // Initialize version control if not exists
    let storedSnapshots = getSnapshots(wsId);
    
    if (storedSnapshots.length === 0) {
      // Create initial snapshot from current state
      initVersionControl(wsId, nodes, edges);
      storedSnapshots = getSnapshots(wsId);
    }
    
    setSnapshots(storedSnapshots);
  }, [workspaceId, nodes.length, edges.length]);

  const selectedSnapshot = snapshots[selectedIndex];
  const compareSnapshot = compareIndex !== null ? snapshots[compareIndex] : null;

  // Calculate diff between versions
  const diff = useMemo(() => {
    if (!compareSnapshot || !selectedSnapshot) return null;
    return compareSnapshots(selectedSnapshot, compareSnapshot);
  }, [selectedSnapshot, compareSnapshot]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  // Handle create snapshot
  const handleCreateSnapshot = useCallback(() => {
    if (!newLabel.trim()) return;
    
    setIsCreating(true);
    const wsId = workspaceId || "demo";
    
    try {
      createSnapshot(wsId, nodes, edges, newLabel.trim());
      setSnapshots(getSnapshots(wsId));
      setNewLabel("");
      setShowCreateForm(false);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Failed to create snapshot:", error);
    } finally {
      setIsCreating(false);
    }
  }, [nodes, edges, workspaceId, newLabel]);

  // Handle restore snapshot
  const handleRestore = useCallback(() => {
    if (!selectedSnapshot || selectedIndex === 0) return;
    
    setIsRestoring(true);
    const wsId = workspaceId || "demo";
    
    try {
      const restored = restoreSnapshot(wsId, selectedSnapshot.id, nodes, edges);
      
      if (restored) {
        // Update React Flow state
        setNodes(restored.nodes);
        setEdges(restored.edges);
        
        // Update Zustand store
        const blocks = restored.nodes.map((n) => n.data as BlockData);
        const connections: ConnectionData[] = restored.edges.map((e) => ({
          id: e.id,
          fromBlockId: e.source,
          toBlockId: e.target,
          relationshipType: ((e.data as { relationshipType?: string })?.relationshipType || "FLOWS_INTO") as RelationshipType,
          label: e.label as string | null,
          animated: e.animated || false,
          style: null,
          workspaceId: wsId,
        }));
        
        loadFromData(blocks, connections);
        
        // Refresh snapshots
        setSnapshots(getSnapshots(wsId));
        setSelectedIndex(0);
        
        // Fit view after restore
        setTimeout(() => fitView({ padding: 0.2 }), 100);
      }
    } catch (error) {
      console.error("Failed to restore snapshot:", error);
    } finally {
      setIsRestoring(false);
      onClose();
    }
  }, [selectedSnapshot, selectedIndex, nodes, edges, workspaceId, setNodes, setEdges, loadFromData, fitView, onClose]);

  // Quick snapshot with auto-generated label
  const handleQuickSnapshot = useCallback(() => {
    const wsId = workspaceId || "demo";
    const label = `Snapshot at ${new Date().toLocaleTimeString()}`;
    
    try {
      createSnapshot(wsId, nodes, edges, label);
      setSnapshots(getSnapshots(wsId));
      setSelectedIndex(0);
    } catch (error) {
      console.error("Failed to create quick snapshot:", error);
    }
  }, [nodes, edges, workspaceId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🕐</span>
              Version History
            </h2>
            <p className="text-sm text-gray-500">
              {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickSnapshot}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📸 Quick Save
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          {snapshots.length > 0 ? (
            <>
              {/* Timeline track */}
              <div className="relative mb-8">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div
                    className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                    style={{
                      width: snapshots.length > 1
                        ? `${((snapshots.length - 1 - selectedIndex) / (snapshots.length - 1)) * 100}%`
                        : "100%",
                    }}
                  />
                </div>
              </div>

              {/* Timeline markers */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
                {snapshots.map((snapshot, index) => (
                  <button
                    key={snapshot.id}
                    onClick={() => {
                      if (compareIndex === null) {
                        setSelectedIndex(index);
                      } else {
                        setCompareIndex(index);
                      }
                    }}
                    className={`
                      flex-shrink-0 p-3 rounded-lg border-2 transition-all text-left min-w-[160px]
                      ${selectedIndex === index
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : compareIndex === index
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          selectedIndex === index
                            ? "bg-blue-500"
                            : compareIndex === index
                            ? "bg-purple-500"
                            : "bg-gray-400"
                        }`}
                      />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(snapshot.timestamp)}
                      </span>
                      {index === 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {snapshot.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {snapshot.nodes.length} blocks
                    </p>
                  </button>
                ))}
              </div>

              {/* Compare toggle */}
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() =>
                    setCompareIndex(
                      compareIndex === null
                        ? Math.min(selectedIndex + 1, snapshots.length - 1)
                        : null
                    )
                  }
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${compareIndex !== null
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  {compareIndex !== null ? "✓ Comparing" : "Compare versions"}
                </button>

                {diff && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span
                      className={
                        diff.nodeCountDiff >= 0 ? "text-green-500" : "text-red-500"
                      }
                    >
                      {diff.nodeCountDiff >= 0 ? "+" : ""}
                      {diff.nodeCountDiff} blocks
                    </span>
                    {diff.daysDiff > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{diff.daysDiff} day{diff.daysDiff !== 1 ? "s" : ""} apart</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No snapshots yet</p>
              <p className="text-sm mt-1">Create your first snapshot to start tracking changes</p>
            </div>
          )}
        </div>

        {/* Version Details */}
        <div className="flex-1 overflow-auto p-6">
          <div className={`grid gap-6 ${compareSnapshot ? "grid-cols-2" : "grid-cols-1"}`}>
            {/* Selected version */}
            {selectedSnapshot && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedSnapshot.label}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  {formatDate(selectedSnapshot.timestamp)}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total blocks</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedSnapshot.nodes.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Connections</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedSnapshot.edges.length}
                    </span>
                  </div>

                  {selectedSnapshot.changes.added.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-green-500 uppercase mb-2">
                        Added ({selectedSnapshot.changes.added.length})
                      </p>
                      <div className="space-y-1 max-h-24 overflow-auto">
                        {selectedSnapshot.changes.added.slice(0, 5).map((item, i) => (
                          <div
                            key={i}
                            className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                          >
                            <span className="text-green-500">+</span>
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                        {selectedSnapshot.changes.added.length > 5 && (
                          <p className="text-xs text-gray-400">
                            +{selectedSnapshot.changes.added.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedSnapshot.changes.modified.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-amber-500 uppercase mb-2">
                        Modified ({selectedSnapshot.changes.modified.length})
                      </p>
                      <div className="space-y-1 max-h-24 overflow-auto">
                        {selectedSnapshot.changes.modified.slice(0, 5).map((item, i) => (
                          <div
                            key={i}
                            className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                          >
                            <span className="text-amber-500">~</span>
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                        {selectedSnapshot.changes.modified.length > 5 && (
                          <p className="text-xs text-gray-400">
                            +{selectedSnapshot.changes.modified.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedSnapshot.changes.removed.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-red-500 uppercase mb-2">
                        Removed ({selectedSnapshot.changes.removed.length})
                      </p>
                      <div className="space-y-1 max-h-24 overflow-auto">
                        {selectedSnapshot.changes.removed.slice(0, 5).map((item, i) => (
                          <div
                            key={i}
                            className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                          >
                            <span className="text-red-500">-</span>
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                        {selectedSnapshot.changes.removed.length > 5 && (
                          <p className="text-xs text-gray-400">
                            +{selectedSnapshot.changes.removed.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Compare version */}
            {compareSnapshot && (
              <div className="border border-purple-500/50 rounded-xl p-4 bg-purple-500/5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {compareSnapshot.label}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  {formatDate(compareSnapshot.timestamp)}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total blocks</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {compareSnapshot.nodes.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Connections</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {compareSnapshot.edges.length}
                    </span>
                  </div>

                  {/* Diff summary */}
                  {diff && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-2">
                        Changes between versions
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold text-green-500">+{diff.added.length}</p>
                          <p className="text-xs text-gray-500">Added</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-amber-500">{diff.modified.length}</p>
                          <p className="text-xs text-gray-500">Modified</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-500">-{diff.removed.length}</p>
                          <p className="text-xs text-gray-500">Removed</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Snapshot Form */}
        {showCreateForm && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Snapshot name (e.g., 'Before major update')"
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSnapshot();
                  if (e.key === "Escape") setShowCreateForm(false);
                }}
                autoFocus
              />
              <button
                onClick={handleCreateSnapshot}
                disabled={!newLabel.trim() || isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Saving..." : "Save Snapshot"}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm"
          >
            Close
          </button>
          <div className="flex gap-2">
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Create Named Snapshot
              </button>
            )}
            <button
              onClick={handleRestore}
              disabled={selectedIndex === 0 || isRestoring || !selectedSnapshot}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRestoring ? "Restoring..." : "Restore This Version"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
