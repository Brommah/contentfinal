/**
 * useNotionSync - React hook for Notion sync integration
 * 
 * Provides:
 * - Sync state and status
 * - Manual sync triggers
 * - Auto-sync management
 * - Conflict handling
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCanvasStore } from "./store";
import {
  getNotionSyncService,
  type SyncEvent,
  type NotionSyncService,
} from "./notion-sync-service";
import type { NotionSyncConfig, SyncRecord, SyncResult, SyncStatus } from "./notion-types";
import type { BlockData } from "./types";
import type { RoadmapItem } from "./roadmap-types";

interface NotionSyncState {
  isConfigured: boolean;
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
  pendingCount: number;
  conflicts: SyncRecord[];
  error: string | null;
}

interface UseNotionSyncReturn extends NotionSyncState {
  // Configuration
  configure: (config: Partial<NotionSyncConfig>) => void;
  getConfig: () => NotionSyncConfig;
  
  // Sync operations
  syncAll: () => Promise<SyncResult>;
  syncBlocks: () => Promise<SyncResult>;
  syncRoadmapItems: () => Promise<SyncResult>;
  pullFromNotion: () => Promise<void>;
  
  // Individual sync
  syncBlock: (blockId: string) => Promise<void>;
  syncRoadmapItem: (itemId: string) => Promise<void>;
  
  // Status
  getSyncStatus: (id: string) => SyncStatus | null;
  
  // Conflict resolution
  resolveConflict: (id: string, resolution: "APP" | "NOTION") => void;
  
  // Auto-sync
  enableAutoSync: () => void;
  disableAutoSync: () => void;
}

export function useNotionSync(): UseNotionSyncReturn {
  const syncService = useRef<NotionSyncService>(getNotionSyncService());
  
  const [state, setState] = useState<NotionSyncState>({
    isConfigured: false,
    isSyncing: false,
    lastSyncResult: null,
    pendingCount: 0,
    conflicts: [],
    error: null,
  });

  // Get store data
  const nodes = useCanvasStore((s) => s.nodes);
  const roadmapItems = useCanvasStore((s) => s.roadmapItems);
  const updateNode = useCanvasStore((s) => s.updateNode);
  const updateRoadmapItem = useCanvasStore((s) => s.updateRoadmapItem);
  const setNodes = useCanvasStore((s) => s.setNodes);

  // Initialize and subscribe to sync events
  useEffect(() => {
    const service = syncService.current;
    
    setState((prev) => ({
      ...prev,
      isConfigured: service.isConfigured(),
      pendingCount: service.getPendingCount(),
      conflicts: service.getConflicts(),
    }));

    const unsubscribe = service.subscribe((event: SyncEvent) => {
      switch (event.type) {
        case "SYNC_COMPLETE":
          setState((prev) => ({
            ...prev,
            isSyncing: false,
            lastSyncResult: event.result,
            pendingCount: service.getPendingCount(),
            conflicts: service.getConflicts(),
          }));
          break;
        case "CONFLICT_RESOLVED":
          setState((prev) => ({
            ...prev,
            conflicts: service.getConflicts(),
          }));
          break;
        case "SYNC_ERROR":
          setState((prev) => ({
            ...prev,
            isSyncing: false,
            error: event.error,
          }));
          break;
        case "AUTO_SYNC_TICK":
          // Trigger auto-sync if there are pending items
          if (service.getPendingCount() > 0) {
            // Auto-sync logic would go here
          }
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  // Configuration
  const configure = useCallback((config: Partial<NotionSyncConfig>) => {
    syncService.current.updateConfig(config);
    setState((prev) => ({
      ...prev,
      isConfigured: syncService.current.isConfigured(),
    }));
  }, []);

  const getConfig = useCallback(() => {
    return syncService.current.getConfig();
  }, []);

  // Extract blocks from nodes
  const getBlocks = useCallback((): BlockData[] => {
    return nodes.map((node) => node.data as BlockData);
  }, [nodes]);

  // Sync all content
  const syncAll = useCallback(async (): Promise<SyncResult> => {
    setState((prev) => ({ ...prev, isSyncing: true, error: null }));
    
    try {
      const blocks = getBlocks();
      const blockResult = await syncService.current.pushAllBlocksToNotion(blocks);
      const roadmapResult = await syncService.current.pushAllRoadmapItemsToNotion(roadmapItems);
      
      const combinedResult: SyncResult = {
        success: blockResult.success && roadmapResult.success,
        syncedCount: blockResult.syncedCount + roadmapResult.syncedCount,
        failedCount: blockResult.failedCount + roadmapResult.failedCount,
        conflicts: [...blockResult.conflicts, ...roadmapResult.conflicts],
        errors: [...blockResult.errors, ...roadmapResult.errors],
        timestamp: new Date(),
      };
      
      return combinedResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Sync failed";
      setState((prev) => ({ ...prev, isSyncing: false, error: errorMessage }));
      throw error;
    }
  }, [getBlocks, roadmapItems]);

  // Sync only blocks
  const syncBlocks = useCallback(async (): Promise<SyncResult> => {
    setState((prev) => ({ ...prev, isSyncing: true, error: null }));
    
    try {
      const blocks = getBlocks();
      return await syncService.current.pushAllBlocksToNotion(blocks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Block sync failed";
      setState((prev) => ({ ...prev, isSyncing: false, error: errorMessage }));
      throw error;
    }
  }, [getBlocks]);

  // Sync only roadmap items
  const syncRoadmapItems = useCallback(async (): Promise<SyncResult> => {
    setState((prev) => ({ ...prev, isSyncing: true, error: null }));
    
    try {
      return await syncService.current.pushAllRoadmapItemsToNotion(roadmapItems);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Roadmap sync failed";
      setState((prev) => ({ ...prev, isSyncing: false, error: errorMessage }));
      throw error;
    }
  }, [roadmapItems]);

  // Pull data from Notion
  const pullFromNotion = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isSyncing: true, error: null }));
    
    try {
      const notionBlocks = await syncService.current.fetchBlocksFromNotion();
      
      // Update existing nodes with Notion data
      for (const notionBlock of notionBlocks) {
        if (notionBlock.id) {
          const existingNode = nodes.find((n) => n.id === notionBlock.id);
          if (existingNode) {
            updateNode(notionBlock.id, notionBlock);
          }
        }
      }
      
      // Also pull roadmap items
      const notionRoadmapItems = await syncService.current.fetchRoadmapItemsFromNotion();
      for (const notionItem of notionRoadmapItems) {
        if (notionItem.id) {
          updateRoadmapItem(notionItem.id, notionItem);
        }
      }
      
      setState((prev) => ({ ...prev, isSyncing: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Pull failed";
      setState((prev) => ({ ...prev, isSyncing: false, error: errorMessage }));
      throw error;
    }
  }, [nodes, updateNode, updateRoadmapItem]);

  // Sync individual block
  const syncBlock = useCallback(async (blockId: string): Promise<void> => {
    const block = nodes.find((n) => n.id === blockId)?.data as BlockData | undefined;
    if (!block) throw new Error("Block not found");
    
    await syncService.current.pushBlockToNotion(block);
  }, [nodes]);

  // Sync individual roadmap item
  const syncRoadmapItem = useCallback(async (itemId: string): Promise<void> => {
    const item = roadmapItems.find((i) => i.id === itemId);
    if (!item) throw new Error("Roadmap item not found");
    
    await syncService.current.pushRoadmapItemToNotion(item);
  }, [roadmapItems]);

  // Get sync status
  const getSyncStatus = useCallback((id: string): SyncStatus | null => {
    return syncService.current.getSyncStatus(id);
  }, []);

  // Resolve conflict
  const resolveConflict = useCallback((id: string, resolution: "APP" | "NOTION"): void => {
    const record = syncService.current.resolveConflict(id, resolution);
    
    if (record && resolution === "NOTION" && record.conflictData?.notionVersion) {
      // Apply Notion version to app
      if (record.entityType === "BLOCK") {
        updateNode(id, record.conflictData.notionVersion as Partial<BlockData>);
      } else {
        updateRoadmapItem(id, record.conflictData.notionVersion as Partial<RoadmapItem>);
      }
    }
    
    setState((prev) => ({
      ...prev,
      conflicts: syncService.current.getConflicts(),
    }));
  }, [updateNode, updateRoadmapItem]);

  // Auto-sync controls
  const enableAutoSync = useCallback(() => {
    syncService.current.startAutoSync();
  }, []);

  const disableAutoSync = useCallback(() => {
    syncService.current.stopAutoSync();
  }, []);

  return {
    ...state,
    configure,
    getConfig,
    syncAll,
    syncBlocks,
    syncRoadmapItems,
    pullFromNotion,
    syncBlock,
    syncRoadmapItem,
    getSyncStatus,
    resolveConflict,
    enableAutoSync,
    disableAutoSync,
  };
}

// Export type for external use
export type { UseNotionSyncReturn, NotionSyncState };


