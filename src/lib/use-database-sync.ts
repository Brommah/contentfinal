"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useCanvasStore } from "./store";
import type { BlockData } from "./types";

interface DatabaseSyncOptions {
  workspaceId: string;
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
}

interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  error: string | null;
  pendingChanges: number;
}

/**
 * useDatabaseSync - Hook for syncing local state with the database API
 * Provides bidirectional sync between Zustand store and PostgreSQL database
 */
export function useDatabaseSync({
  workspaceId,
  autoSync = true,
  syncInterval = 30000, // Default 30 seconds
}: DatabaseSyncOptions) {
  const { nodes, edges, updateNode, setNodes, setEdges } = useCanvasStore();
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSynced: null,
    error: null,
    pendingChanges: 0,
  });
  
  const pendingChangesRef = useRef<Set<string>>(new Set());
  const lastSyncedDataRef = useRef<string>("");

  // Fetch blocks from database
  const fetchBlocks = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      const response = await fetch(`/api/blocks?workspaceId=${workspaceId}`);
      if (!response.ok) throw new Error("Failed to fetch blocks");
      
      const dbBlocks = await response.json();
      
      // Convert database blocks to nodes format
      const newNodes = dbBlocks.map((block: Record<string, unknown>) => ({
        id: block.id as string,
        type: "contentBlock",
        position: {
          x: block.positionX as number,
          y: block.positionY as number,
        },
        data: {
          id: block.id,
          type: block.type,
          company: block.company,
          status: block.status,
          title: block.title,
          subtitle: block.subtitle || "",
          content: block.content || "",
          tags: (block.tags as string[]) || [],
          externalUrl: block.externalUrl || undefined,
          createdAt: block.createdAt,
          updatedAt: block.updatedAt,
        } as BlockData,
      }));
      
      if (newNodes.length > 0) {
        setNodes(newNodes);
        lastSyncedDataRef.current = JSON.stringify(newNodes);
      }
      
      return newNodes;
    } catch (error) {
      console.error("Error fetching blocks:", error);
      throw error;
    }
  }, [workspaceId, setNodes]);

  // Fetch connections from database
  const fetchConnections = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      const response = await fetch(`/api/connections?workspaceId=${workspaceId}`);
      if (!response.ok) throw new Error("Failed to fetch connections");
      
      const dbConnections = await response.json();
      
      // Convert database connections to edges format
      const newEdges = dbConnections.map((conn: Record<string, unknown>) => ({
        id: conn.id as string,
        source: conn.fromBlockId as string,
        target: conn.toBlockId as string,
        type: "default",
        animated: conn.animated as boolean,
        label: conn.label as string | undefined,
        data: {
          relationshipType: conn.relationshipType,
        },
      }));
      
      if (newEdges.length > 0) {
        setEdges(newEdges);
      }
      
      return newEdges;
    } catch (error) {
      console.error("Error fetching connections:", error);
      throw error;
    }
  }, [workspaceId, setEdges]);

  // Save a single block to database
  const saveBlock = useCallback(async (blockId: string) => {
    const node = nodes.find((n) => n.id === blockId);
    if (!node) return;
    
    const blockData = node.data as BlockData;
    
    try {
      const response = await fetch(`/api/blocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: blockData.type,
          company: blockData.company,
          status: blockData.status,
          title: blockData.title,
          subtitle: blockData.subtitle,
          content: blockData.content,
          tags: blockData.tags,
          positionX: node.position.x,
          positionY: node.position.y,
          externalUrl: blockData.externalUrl,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to save block");
      
      pendingChangesRef.current.delete(blockId);
      setSyncState((prev) => ({
        ...prev,
        pendingChanges: pendingChangesRef.current.size,
      }));
      
      return await response.json();
    } catch (error) {
      console.error("Error saving block:", error);
      throw error;
    }
  }, [nodes]);

  // Create a new block in database
  const createBlock = useCallback(async (blockData: Partial<BlockData> & { positionX: number; positionY: number }) => {
    if (!workspaceId) return;
    
    try {
      const response = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...blockData,
          workspaceId,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to create block");
      
      return await response.json();
    } catch (error) {
      console.error("Error creating block:", error);
      throw error;
    }
  }, [workspaceId]);

  // Delete a block from database
  const deleteBlock = useCallback(async (blockId: string) => {
    try {
      const response = await fetch(`/api/blocks/${blockId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete block");
      
      pendingChangesRef.current.delete(blockId);
      return true;
    } catch (error) {
      console.error("Error deleting block:", error);
      throw error;
    }
  }, []);

  // Sync all pending changes to database
  const syncToDatabase = useCallback(async () => {
    if (syncState.isSyncing) return;
    
    setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
    
    try {
      // Batch update positions
      const positionUpdates = nodes.map((node) => ({
        id: node.id,
        positionX: node.position.x,
        positionY: node.position.y,
      }));
      
      if (positionUpdates.length > 0) {
        const response = await fetch("/api/blocks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(positionUpdates),
        });
        
        if (!response.ok) throw new Error("Failed to sync positions");
      }
      
      // Save any blocks with pending content changes
      for (const blockId of pendingChangesRef.current) {
        await saveBlock(blockId);
      }
      
      pendingChangesRef.current.clear();
      lastSyncedDataRef.current = JSON.stringify(nodes);
      
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSynced: new Date(),
        pendingChanges: 0,
      }));
    } catch (error) {
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : "Sync failed",
      }));
    }
  }, [nodes, syncState.isSyncing, saveBlock]);

  // Pull latest data from database
  const pullFromDatabase = useCallback(async () => {
    setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
    
    try {
      await Promise.all([fetchBlocks(), fetchConnections()]);
      
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSynced: new Date(),
        pendingChanges: 0,
      }));
    } catch (error) {
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : "Failed to pull data",
      }));
    }
  }, [fetchBlocks, fetchConnections]);

  // Mark a block as having pending changes
  const markPendingChange = useCallback((blockId: string) => {
    pendingChangesRef.current.add(blockId);
    setSyncState((prev) => ({
      ...prev,
      pendingChanges: pendingChangesRef.current.size,
    }));
  }, []);

  // Auto-sync effect
  useEffect(() => {
    if (!autoSync || !workspaceId) return;
    
    const interval = setInterval(() => {
      if (pendingChangesRef.current.size > 0) {
        syncToDatabase();
      }
    }, syncInterval);
    
    return () => clearInterval(interval);
  }, [autoSync, workspaceId, syncInterval, syncToDatabase]);

  // Initial fetch
  useEffect(() => {
    if (workspaceId) {
      pullFromDatabase();
    }
  }, [workspaceId, pullFromDatabase]);

  return {
    syncState,
    syncToDatabase,
    pullFromDatabase,
    createBlock,
    saveBlock,
    deleteBlock,
    markPendingChange,
  };
}


