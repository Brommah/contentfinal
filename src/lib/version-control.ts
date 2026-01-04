/**
 * Version Control System for Content Schema
 * Tracks snapshots of the content schema over time
 */

import type { BlockData, ConnectionData } from "@/lib/types";
import type { Node, Edge } from "@xyflow/react";

export interface VersionSnapshot {
  id: string;
  timestamp: Date;
  label: string;
  description?: string;
  nodes: Node<BlockData>[];
  edges: Edge[];
  changes: {
    added: string[];
    modified: string[];
    removed: string[];
  };
}

export interface VersionControlState {
  workspaceId: string;
  currentVersion: number;
  snapshots: VersionSnapshot[];
  lastAutoSave?: Date;
}

const STORAGE_KEY_PREFIX = "content-visualizer-versions";
const MAX_SNAPSHOTS = 50;
const AUTO_SNAPSHOT_INTERVAL = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a unique ID for snapshots
 */
function generateId(): string {
  return `v${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the storage key for a workspace
 */
function getStorageKey(workspaceId: string): string {
  return `${STORAGE_KEY_PREFIX}-${workspaceId}`;
}

/**
 * Load version control state from localStorage
 */
export function loadVersionState(workspaceId: string): VersionControlState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(getStorageKey(workspaceId));
    if (!stored) return null;

    const state = JSON.parse(stored) as VersionControlState;
    // Convert timestamp strings back to Date objects
    state.snapshots = state.snapshots.map((s) => ({
      ...s,
      timestamp: new Date(s.timestamp),
    }));
    if (state.lastAutoSave) {
      state.lastAutoSave = new Date(state.lastAutoSave);
    }
    return state;
  } catch (error) {
    console.error("Failed to load version state:", error);
    return null;
  }
}

/**
 * Save version control state to localStorage
 */
export function saveVersionState(state: VersionControlState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getStorageKey(state.workspaceId), JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save version state:", error);
  }
}

/**
 * Initialize version control for a workspace
 */
export function initVersionControl(
  workspaceId: string,
  nodes: Node<BlockData>[],
  edges: Edge[]
): VersionControlState {
  const existing = loadVersionState(workspaceId);
  
  if (existing && existing.snapshots.length > 0) {
    return existing;
  }

  // Create initial snapshot
  const initialSnapshot: VersionSnapshot = {
    id: generateId(),
    timestamp: new Date(),
    label: "Initial schema",
    description: "Starting point for version tracking",
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
    changes: {
      added: nodes.map((n) => (n.data as BlockData).title),
      modified: [],
      removed: [],
    },
  };

  const state: VersionControlState = {
    workspaceId,
    currentVersion: 0,
    snapshots: [initialSnapshot],
    lastAutoSave: new Date(),
  };

  saveVersionState(state);
  return state;
}

/**
 * Calculate changes between two states
 */
function calculateChanges(
  oldNodes: Node<BlockData>[],
  newNodes: Node<BlockData>[]
): { added: string[]; modified: string[]; removed: string[] } {
  const oldMap = new Map(oldNodes.map((n) => [n.id, n]));
  const newMap = new Map(newNodes.map((n) => [n.id, n]));

  const added: string[] = [];
  const modified: string[] = [];
  const removed: string[] = [];

  // Find added and modified
  for (const [id, newNode] of newMap) {
    const oldNode = oldMap.get(id);
    if (!oldNode) {
      added.push((newNode.data as BlockData).title);
    } else {
      // Check if content changed
      const oldData = oldNode.data as BlockData;
      const newData = newNode.data as BlockData;
      if (
        oldData.title !== newData.title ||
        oldData.content !== newData.content ||
        oldData.subtitle !== newData.subtitle ||
        oldData.status !== newData.status
      ) {
        modified.push(newData.title);
      }
    }
  }

  // Find removed
  for (const [id, oldNode] of oldMap) {
    if (!newMap.has(id)) {
      removed.push((oldNode.data as BlockData).title);
    }
  }

  return { added, modified, removed };
}

/**
 * Create a new snapshot
 */
export function createSnapshot(
  workspaceId: string,
  nodes: Node<BlockData>[],
  edges: Edge[],
  label: string,
  description?: string
): VersionSnapshot {
  let state = loadVersionState(workspaceId);
  
  if (!state) {
    state = initVersionControl(workspaceId, nodes, edges);
    return state.snapshots[0];
  }

  const lastSnapshot = state.snapshots[0];
  const changes = calculateChanges(lastSnapshot?.nodes || [], nodes);

  const snapshot: VersionSnapshot = {
    id: generateId(),
    timestamp: new Date(),
    label,
    description,
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
    changes,
  };

  // Add to front of array (newest first)
  state.snapshots.unshift(snapshot);
  state.currentVersion = 0;
  state.lastAutoSave = new Date();

  // Limit max snapshots
  if (state.snapshots.length > MAX_SNAPSHOTS) {
    state.snapshots = state.snapshots.slice(0, MAX_SNAPSHOTS);
  }

  saveVersionState(state);
  return snapshot;
}

/**
 * Auto-save snapshot if enough time has passed and there are changes
 */
export function autoSnapshot(
  workspaceId: string,
  nodes: Node<BlockData>[],
  edges: Edge[]
): VersionSnapshot | null {
  const state = loadVersionState(workspaceId);
  
  if (!state) {
    const newState = initVersionControl(workspaceId, nodes, edges);
    return newState.snapshots[0];
  }

  const lastAutoSave = state.lastAutoSave ? new Date(state.lastAutoSave) : null;
  const now = new Date();
  
  // Check if enough time has passed
  if (lastAutoSave && now.getTime() - lastAutoSave.getTime() < AUTO_SNAPSHOT_INTERVAL) {
    return null;
  }

  // Check if there are changes
  const lastSnapshot = state.snapshots[0];
  if (lastSnapshot) {
    const changes = calculateChanges(lastSnapshot.nodes, nodes);
    if (changes.added.length === 0 && changes.modified.length === 0 && changes.removed.length === 0) {
      // No changes, just update lastAutoSave
      state.lastAutoSave = now;
      saveVersionState(state);
      return null;
    }
  }

  // Create auto-snapshot
  return createSnapshot(workspaceId, nodes, edges, `Auto-save at ${now.toLocaleTimeString()}`);
}

/**
 * Get all snapshots for a workspace
 */
export function getSnapshots(workspaceId: string): VersionSnapshot[] {
  const state = loadVersionState(workspaceId);
  return state?.snapshots || [];
}

/**
 * Restore to a specific snapshot
 */
export function restoreSnapshot(
  workspaceId: string,
  snapshotId: string,
  currentNodes: Node<BlockData>[],
  currentEdges: Edge[]
): { nodes: Node<BlockData>[]; edges: Edge[] } | null {
  const state = loadVersionState(workspaceId);
  if (!state) return null;

  const snapshotIndex = state.snapshots.findIndex((s) => s.id === snapshotId);
  if (snapshotIndex === -1) return null;

  const snapshot = state.snapshots[snapshotIndex];

  // Create a "before restore" snapshot to allow undoing
  createSnapshot(
    workspaceId,
    currentNodes,
    currentEdges,
    `Before restore to "${snapshot.label}"`
  );

  return {
    nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
    edges: JSON.parse(JSON.stringify(snapshot.edges)),
  };
}

/**
 * Delete a snapshot
 */
export function deleteSnapshot(workspaceId: string, snapshotId: string): boolean {
  const state = loadVersionState(workspaceId);
  if (!state) return false;

  const index = state.snapshots.findIndex((s) => s.id === snapshotId);
  if (index === -1) return false;

  // Don't allow deleting the only snapshot
  if (state.snapshots.length === 1) return false;

  state.snapshots.splice(index, 1);
  saveVersionState(state);
  return true;
}

/**
 * Compare two snapshots
 */
export function compareSnapshots(
  snapshot1: VersionSnapshot,
  snapshot2: VersionSnapshot
): {
  added: string[];
  modified: string[];
  removed: string[];
  nodeCountDiff: number;
  daysDiff: number;
} {
  const older = snapshot1.timestamp < snapshot2.timestamp ? snapshot1 : snapshot2;
  const newer = snapshot1.timestamp < snapshot2.timestamp ? snapshot2 : snapshot1;

  const changes = calculateChanges(older.nodes, newer.nodes);
  const nodeCountDiff = newer.nodes.length - older.nodes.length;
  const daysDiff = Math.round(
    (newer.timestamp.getTime() - older.timestamp.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    ...changes,
    nodeCountDiff,
    daysDiff,
  };
}


