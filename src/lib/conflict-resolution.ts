/**
 * Conflict Resolution System for Real-time Collaboration
 * Implements operational transform (OT) concepts for concurrent edits
 */

import type { BlockData } from "./types";
import type { Node } from "@xyflow/react";

export interface EditOperation {
  id: string;
  type: "update" | "create" | "delete" | "move";
  blockId: string;
  userId: string;
  timestamp: number;
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
  position?: { x: number; y: number };
  version: number;
}

export interface ConflictInfo {
  id: string;
  blockId: string;
  blockTitle: string;
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  localUser: string;
  remoteUser: string;
  localTimestamp: number;
  remoteTimestamp: number;
  resolved: boolean;
  resolution?: "local" | "remote" | "merged";
}

export interface VersionVector {
  [userId: string]: number;
}

/**
 * Generate unique operation ID
 */
function generateOpId(): string {
  return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create an edit operation
 */
export function createOperation(
  type: EditOperation["type"],
  blockId: string,
  userId: string,
  field?: string,
  oldValue?: unknown,
  newValue?: unknown,
  position?: { x: number; y: number }
): EditOperation {
  return {
    id: generateOpId(),
    type,
    blockId,
    userId,
    timestamp: Date.now(),
    field,
    oldValue,
    newValue,
    position,
    version: 1,
  };
}

/**
 * Detect conflicts between two operations on the same block
 */
export function detectConflict(
  localOp: EditOperation,
  remoteOp: EditOperation,
  localUserName: string,
  remoteUserName: string,
  blockTitle: string
): ConflictInfo | null {
  // Only check updates to the same field
  if (
    localOp.type !== "update" ||
    remoteOp.type !== "update" ||
    localOp.blockId !== remoteOp.blockId ||
    localOp.field !== remoteOp.field
  ) {
    return null;
  }

  // No conflict if same value
  if (JSON.stringify(localOp.newValue) === JSON.stringify(remoteOp.newValue)) {
    return null;
  }

  return {
    id: `conflict-${localOp.id}-${remoteOp.id}`,
    blockId: localOp.blockId,
    blockTitle,
    field: localOp.field || "unknown",
    localValue: localOp.newValue,
    remoteValue: remoteOp.newValue,
    localUser: localUserName,
    remoteUser: remoteUserName,
    localTimestamp: localOp.timestamp,
    remoteTimestamp: remoteOp.timestamp,
    resolved: false,
  };
}

/**
 * Auto-resolve conflict based on strategy
 */
export function autoResolveConflict(
  conflict: ConflictInfo,
  strategy: "last-write-wins" | "first-write-wins" | "server-wins" = "last-write-wins"
): ConflictInfo & { winningValue: unknown } {
  let resolution: "local" | "remote";
  let winningValue: unknown;

  switch (strategy) {
    case "last-write-wins":
      if (conflict.localTimestamp > conflict.remoteTimestamp) {
        resolution = "local";
        winningValue = conflict.localValue;
      } else {
        resolution = "remote";
        winningValue = conflict.remoteValue;
      }
      break;
    case "first-write-wins":
      if (conflict.localTimestamp < conflict.remoteTimestamp) {
        resolution = "local";
        winningValue = conflict.localValue;
      } else {
        resolution = "remote";
        winningValue = conflict.remoteValue;
      }
      break;
    case "server-wins":
      resolution = "remote";
      winningValue = conflict.remoteValue;
      break;
  }

  return {
    ...conflict,
    resolved: true,
    resolution,
    winningValue,
  };
}

/**
 * Merge text values (simple character-level merge)
 */
export function mergeTextValues(local: string, remote: string, base: string): string {
  // Simple merge: if local and remote differ, show both with separator
  if (local === remote) return local;
  if (local === base) return remote;
  if (remote === base) return local;

  // Both changed - attempt a simple merge
  // For content editing, we concatenate with a visual separator
  return `${local}\n---\n${remote}`;
}

/**
 * Transform operation against concurrent operations
 * (Simplified OT - for production, use a proper OT library like ShareDB)
 */
export function transformOperation(
  operation: EditOperation,
  against: EditOperation
): EditOperation {
  // If operations are on different blocks, no transform needed
  if (operation.blockId !== against.blockId) {
    return operation;
  }

  // If same field, and remote was applied first, we may need to adjust
  if (operation.field === against.field && against.timestamp < operation.timestamp) {
    // Our operation was based on older state - adjust
    return {
      ...operation,
      oldValue: against.newValue, // Our old value was actually the result of remote's change
    };
  }

  return operation;
}

/**
 * ConflictResolutionStore - Manages pending conflicts
 */
export class ConflictResolutionStore {
  private conflicts: Map<string, ConflictInfo> = new Map();
  private operationHistory: EditOperation[] = [];
  private versionVector: VersionVector = {};
  private listeners: Set<(conflicts: ConflictInfo[]) => void> = new Set();

  addOperation(op: EditOperation): void {
    this.operationHistory.push(op);
    this.versionVector[op.userId] = (this.versionVector[op.userId] || 0) + 1;

    // Limit history size
    if (this.operationHistory.length > 1000) {
      this.operationHistory = this.operationHistory.slice(-500);
    }
  }

  addConflict(conflict: ConflictInfo): void {
    this.conflicts.set(conflict.id, conflict);
    this.notifyListeners();
  }

  resolveConflict(conflictId: string, resolution: "local" | "remote" | "merged"): ConflictInfo | undefined {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return undefined;

    const resolved: ConflictInfo = {
      ...conflict,
      resolved: true,
      resolution,
    };
    this.conflicts.delete(conflictId);
    this.notifyListeners();
    return resolved;
  }

  getConflicts(): ConflictInfo[] {
    return Array.from(this.conflicts.values());
  }

  getPendingConflicts(): ConflictInfo[] {
    return this.getConflicts().filter((c) => !c.resolved);
  }

  getRecentOperations(since: number): EditOperation[] {
    return this.operationHistory.filter((op) => op.timestamp >= since);
  }

  subscribe(listener: (conflicts: ConflictInfo[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const conflicts = this.getConflicts();
    this.listeners.forEach((listener) => listener(conflicts));
  }

  clear(): void {
    this.conflicts.clear();
    this.notifyListeners();
  }
}

// Global instance
export const conflictStore = new ConflictResolutionStore();

/**
 * React hook for conflict resolution
 */
import { useState, useEffect, useCallback } from "react";

export function useConflictResolution() {
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);

  useEffect(() => {
    // Initial load
    setConflicts(conflictStore.getPendingConflicts());

    // Subscribe to updates
    const unsubscribe = conflictStore.subscribe(setConflicts);
    return unsubscribe;
  }, []);

  const resolveConflict = useCallback((conflictId: string, resolution: "local" | "remote" | "merged") => {
    return conflictStore.resolveConflict(conflictId, resolution);
  }, []);

  const addConflict = useCallback((conflict: ConflictInfo) => {
    conflictStore.addConflict(conflict);
  }, []);

  const clearConflicts = useCallback(() => {
    conflictStore.clear();
  }, []);

  return {
    conflicts,
    hasPendingConflicts: conflicts.some((c) => !c.resolved),
    pendingCount: conflicts.filter((c) => !c.resolved).length,
    resolveConflict,
    addConflict,
    clearConflicts,
  };
}


