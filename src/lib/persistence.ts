/**
 * Persistence Layer - Auto-save and sync with database
 * Handles debounced saves, conflict resolution, and offline support
 */

import type { Node, Edge } from "@xyflow/react";
import type { BlockData, ConnectionData, RelationshipType } from "./types";
import type { WireframeSection } from "./wireframe-types";
import type { RoadmapItem, RoadmapPhase } from "./roadmap-types";

// Types for persistence
export interface WorkspaceData {
  id: string;
  name: string;
  description?: string;
  viewportX: number;
  viewportY: number;
  viewportZoom: number;
  blocks: BlockData[];
  connections: ConnectionData[];
  wireframeSections?: WireframeSection[];
  roadmapPhases?: RoadmapPhase[];
  roadmapItems?: RoadmapItem[];
}

export interface SaveResult {
  success: boolean;
  timestamp: Date;
  error?: string;
}

export interface SyncStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;
}

// Convert React Flow nodes to BlockData for saving
export function nodesToBlocks(nodes: Node[]): BlockData[] {
  return nodes.map((node) => {
    const data = node.data as BlockData;
    return {
      ...data,
      positionX: node.position.x,
      positionY: node.position.y,
      width: node.measured?.width || data.width || 280,
      height: node.measured?.height || data.height || 120,
    };
  });
}

// Convert React Flow edges to ConnectionData for saving
export function edgesToConnections(edges: Edge[]): ConnectionData[] {
  return edges.map((edge) => ({
    id: edge.id,
    fromBlockId: edge.source,
    toBlockId: edge.target,
    relationshipType: ((edge.data as { relationshipType?: string })?.relationshipType || "REFERENCES") as RelationshipType,
    label: (edge.data as { label?: string })?.label || null,
    animated: edge.animated || false,
    style: null,
    workspaceId: "",
  }));
}

// Debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Save workspace to API
 */
export async function saveWorkspace(
  workspaceId: string,
  data: Partial<WorkspaceData>
): Promise<SaveResult> {
  try {
    // Save workspace metadata
    if (data.name || data.viewportX !== undefined) {
      await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          viewportX: data.viewportX,
          viewportY: data.viewportY,
          viewportZoom: data.viewportZoom,
        }),
      });
    }

    // Batch save blocks
    if (data.blocks && data.blocks.length > 0) {
      await fetch(`/api/workspaces/${workspaceId}/blocks/batch`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: data.blocks }),
      });
    }

    // Batch save connections
    if (data.connections && data.connections.length > 0) {
      await fetch(`/api/workspaces/${workspaceId}/connections/batch`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connections: data.connections }),
      });
    }

    return { success: true, timestamp: new Date() };
  } catch (error) {
    console.error("Failed to save workspace:", error);
    return {
      success: false,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Load workspace from API
 */
export async function loadWorkspace(workspaceId: string): Promise<WorkspaceData | null> {
  try {
    const response = await fetch(`/api/workspaces/${workspaceId}`);
    if (!response.ok) {
      throw new Error(`Failed to load workspace: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to load workspace:", error);
    return null;
  }
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
  name: string,
  userId: string
): Promise<{ id: string } | null> {
  try {
    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, userId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create workspace: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to create workspace:", error);
    return null;
  }
}

/**
 * Local storage fallback for offline support
 */
export const localPersistence = {
  save(workspaceId: string, data: WorkspaceData): void {
    try {
      localStorage.setItem(`workspace_${workspaceId}`, JSON.stringify(data));
      localStorage.setItem(`workspace_${workspaceId}_timestamp`, new Date().toISOString());
    } catch (error) {
      console.warn("Failed to save to local storage:", error);
    }
  },

  load(workspaceId: string): WorkspaceData | null {
    try {
      const data = localStorage.getItem(`workspace_${workspaceId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn("Failed to load from local storage:", error);
      return null;
    }
  },

  getTimestamp(workspaceId: string): Date | null {
    try {
      const timestamp = localStorage.getItem(`workspace_${workspaceId}_timestamp`);
      return timestamp ? new Date(timestamp) : null;
    } catch {
      return null;
    }
  },

  clear(workspaceId: string): void {
    localStorage.removeItem(`workspace_${workspaceId}`);
    localStorage.removeItem(`workspace_${workspaceId}_timestamp`);
  },
};


