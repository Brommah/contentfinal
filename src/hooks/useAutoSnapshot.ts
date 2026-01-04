"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCanvasStore } from "@/lib/store";
import {
  createSnapshot,
  getSnapshots,
  loadVersionState,
  saveVersionState,
  type VersionSnapshot,
} from "@/lib/version-control";
import type { BlockData } from "@/lib/types";
import type { Node, Edge } from "@xyflow/react";

interface UseAutoSnapshotOptions {
  enabled?: boolean;
  /** Interval between auto-snapshots in milliseconds (default: 5 minutes) */
  interval?: number;
  /** Minimum changes required to trigger auto-snapshot (default: 3) */
  minChanges?: number;
  /** Callback when snapshot is created */
  onSnapshot?: (snapshot: VersionSnapshot) => void;
}

interface ChangeTracker {
  addedBlocks: Set<string>;
  modifiedBlocks: Set<string>;
  removedBlocks: Set<string>;
  lastNodeCount: number;
  lastEdgeCount: number;
}

/**
 * useAutoSnapshot - Automatically creates snapshots when significant changes occur
 */
export function useAutoSnapshot(options: UseAutoSnapshotOptions = {}) {
  const {
    enabled = true,
    interval = 5 * 60 * 1000, // 5 minutes
    minChanges = 3,
    onSnapshot,
  } = options;

  const { nodes, edges, workspaceId } = useCanvasStore();
  const previousNodesRef = useRef<Map<string, BlockData>>(new Map());
  const changeTrackerRef = useRef<ChangeTracker>({
    addedBlocks: new Set(),
    modifiedBlocks: new Set(),
    removedBlocks: new Set(),
    lastNodeCount: 0,
    lastEdgeCount: 0,
  });
  const lastSnapshotRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate changes since last snapshot
  const calculateChanges = useCallback(() => {
    const tracker = changeTrackerRef.current;
    const prevNodes = previousNodesRef.current;
    const currentNodes = new Map(nodes.map((n) => [n.id, n.data as BlockData]));

    // Find added and modified
    for (const [id, data] of currentNodes) {
      const prev = prevNodes.get(id);
      if (!prev) {
        tracker.addedBlocks.add(id);
      } else if (
        prev.title !== data.title ||
        prev.content !== data.content ||
        prev.status !== data.status ||
        prev.subtitle !== data.subtitle
      ) {
        tracker.modifiedBlocks.add(id);
      }
    }

    // Find removed
    for (const id of prevNodes.keys()) {
      if (!currentNodes.has(id)) {
        tracker.removedBlocks.add(id);
      }
    }

    // Update refs
    previousNodesRef.current = currentNodes;
    tracker.lastNodeCount = nodes.length;
    tracker.lastEdgeCount = edges.length;

    return {
      added: tracker.addedBlocks.size,
      modified: tracker.modifiedBlocks.size,
      removed: tracker.removedBlocks.size,
      total: tracker.addedBlocks.size + tracker.modifiedBlocks.size + tracker.removedBlocks.size,
    };
  }, [nodes, edges]);

  // Check if we should create a snapshot
  const shouldSnapshot = useCallback(() => {
    const changes = calculateChanges();
    const timeSinceLastSnapshot = Date.now() - lastSnapshotRef.current;

    // Significant changes OR enough time has passed with some changes
    return (
      changes.total >= minChanges ||
      (changes.total > 0 && timeSinceLastSnapshot >= interval)
    );
  }, [calculateChanges, minChanges, interval]);

  // Create snapshot
  const createAutoSnapshot = useCallback(() => {
    const wsId = workspaceId || "demo";
    const tracker = changeTrackerRef.current;

    // Generate descriptive label
    const parts: string[] = [];
    if (tracker.addedBlocks.size > 0) {
      parts.push(`+${tracker.addedBlocks.size} added`);
    }
    if (tracker.modifiedBlocks.size > 0) {
      parts.push(`${tracker.modifiedBlocks.size} modified`);
    }
    if (tracker.removedBlocks.size > 0) {
      parts.push(`-${tracker.removedBlocks.size} removed`);
    }

    const label = parts.length > 0
      ? `Auto-save: ${parts.join(", ")}`
      : `Auto-save at ${new Date().toLocaleTimeString()}`;

    try {
      const snapshot = createSnapshot(wsId, nodes, edges, label);

      // Reset tracker
      tracker.addedBlocks.clear();
      tracker.modifiedBlocks.clear();
      tracker.removedBlocks.clear();
      lastSnapshotRef.current = Date.now();

      onSnapshot?.(snapshot);
      return snapshot;
    } catch (error) {
      console.error("Failed to create auto-snapshot:", error);
      return null;
    }
  }, [nodes, edges, workspaceId, onSnapshot]);

  // Significant change detection (immediate snapshot triggers)
  const checkSignificantChange = useCallback(() => {
    if (!enabled) return;

    const tracker = changeTrackerRef.current;
    const nodeCountChange = Math.abs(nodes.length - tracker.lastNodeCount);
    const edgeCountChange = Math.abs(edges.length - tracker.lastEdgeCount);

    // Immediate snapshot for large changes
    if (nodeCountChange >= 5 || edgeCountChange >= 10) {
      console.log("[AutoSnapshot] Significant change detected, creating snapshot");
      createAutoSnapshot();
    }
  }, [enabled, nodes.length, edges.length, createAutoSnapshot]);

  // Watch for changes
  useEffect(() => {
    checkSignificantChange();
  }, [nodes.length, edges.length, checkSignificantChange]);

  // Periodic check
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (shouldSnapshot()) {
        console.log("[AutoSnapshot] Periodic check - creating snapshot");
        createAutoSnapshot();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, shouldSnapshot, createAutoSnapshot]);

  // Initialize previous nodes on mount
  useEffect(() => {
    previousNodesRef.current = new Map(
      nodes.map((n) => [n.id, n.data as BlockData])
    );
    changeTrackerRef.current.lastNodeCount = nodes.length;
    changeTrackerRef.current.lastEdgeCount = edges.length;
  }, []); // Only on mount

  return {
    createSnapshot: createAutoSnapshot,
    pendingChanges: calculateChanges(),
  };
}

export default useAutoSnapshot;


