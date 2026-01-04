"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useCanvasStore } from "@/lib/store";
import {
  saveWorkspace,
  nodesToBlocks,
  edgesToConnections,
  localPersistence,
  type SyncStatus,
} from "@/lib/persistence";
import { isSupabaseConfigured } from "@/lib/supabase";

const AUTO_SAVE_DELAY = 2000; // 2 seconds after last change

/**
 * Hook for auto-saving workspace changes
 * - Uses Supabase for all workspaces when configured (including guest workspaces)
 * - Falls back to localStorage only when Supabase is not available
 */
export function useAutoSave(enabled: boolean = true) {
  const {
    workspaceId,
    workspaceName,
    nodes,
    edges,
    viewport,
    wireframeSections,
    roadmapPhases,
    roadmapItems,
  } = useCanvasStore();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null,
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedStateRef = useRef<string>("");

  // Create a hash of current state to detect changes
  const getCurrentStateHash = useCallback(() => {
    return JSON.stringify({
      nodes: nodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: n.data,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        data: e.data,
      })),
      viewport,
    });
  }, [nodes, edges, viewport]);

  // Save function - always use Supabase when configured
  const save = useCallback(async () => {
    if (!workspaceId) return;

    const supabaseReady = isSupabaseConfigured();
    const blocks = nodesToBlocks(nodes);
    const connections = edgesToConnections(edges);

    // Only use localStorage fallback when Supabase is NOT configured AND workspace is demo
    if (workspaceId === "demo" && !supabaseReady) {
      localPersistence.save("demo", {
        id: "demo",
        name: workspaceName,
        viewportX: viewport.x,
        viewportY: viewport.y,
        viewportZoom: viewport.zoom,
        blocks,
        connections,
        wireframeSections,
        roadmapPhases,
        roadmapItems,
      });
      setSyncStatus((prev) => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        error: null,
      }));
      lastSavedStateRef.current = getCurrentStateHash();
      return;
    }

    // Use Supabase for all workspaces (including guest workspaces)
    setSyncStatus((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const result = await saveWorkspace(workspaceId, {
        name: workspaceName,
        viewportX: viewport.x,
        viewportY: viewport.y,
        viewportZoom: viewport.zoom,
        blocks,
        connections,
      });

      if (result.success) {
        setSyncStatus({
          isSaving: false,
          lastSaved: result.timestamp,
          hasUnsavedChanges: false,
          error: null,
        });
        lastSavedStateRef.current = getCurrentStateHash();
      } else {
        // On Supabase failure, try localStorage as fallback
        console.warn("Supabase save failed, using localStorage fallback:", result.error);
        localPersistence.save(workspaceId, {
          id: workspaceId,
          name: workspaceName,
          viewportX: viewport.x,
          viewportY: viewport.y,
          viewportZoom: viewport.zoom,
          blocks,
          connections,
          wireframeSections,
          roadmapPhases,
          roadmapItems,
        });
        setSyncStatus((prev) => ({
          ...prev,
          isSaving: false,
          lastSaved: new Date(),
          hasUnsavedChanges: false,
          error: `Saved locally (Supabase unavailable: ${result.error})`,
        }));
        lastSavedStateRef.current = getCurrentStateHash();
      }
    } catch (error) {
      // On error, try localStorage fallback
      console.warn("Save error, using localStorage fallback:", error);
      localPersistence.save(workspaceId, {
        id: workspaceId,
        name: workspaceName,
        viewportX: viewport.x,
        viewportY: viewport.y,
        viewportZoom: viewport.zoom,
        blocks,
        connections,
        wireframeSections,
        roadmapPhases,
        roadmapItems,
      });
      setSyncStatus((prev) => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        error: `Saved locally (${error instanceof Error ? error.message : "Save failed"})`,
      }));
      lastSavedStateRef.current = getCurrentStateHash();
    }
  }, [
    workspaceId,
    workspaceName,
    nodes,
    edges,
    viewport,
    wireframeSections,
    roadmapPhases,
    roadmapItems,
    getCurrentStateHash,
  ]);

  // Manual save trigger
  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    save();
  }, [save]);

  // Detect changes and schedule auto-save
  useEffect(() => {
    if (!enabled) return;

    const currentHash = getCurrentStateHash();
    if (currentHash !== lastSavedStateRef.current) {
      setSyncStatus((prev) => ({ ...prev, hasUnsavedChanges: true }));

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        save();
      }, AUTO_SAVE_DELAY);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, getCurrentStateHash, save]);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (syncStatus.hasUnsavedChanges) {
        save();
      }
    };
  }, [syncStatus.hasUnsavedChanges, save]);

  return {
    syncStatus,
    saveNow,
    save,
  };
}


