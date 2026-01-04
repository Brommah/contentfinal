"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNotionSync } from "@/lib/use-notion-sync";
import { getNotionSyncService, type SyncEvent } from "@/lib/notion-sync-service";
import { useCanvasStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import type { NotionSyncConfig } from "@/lib/notion-types";
import type { BlockData, BlockStatus } from "@/lib/types";

type SyncMode = "export_live" | "export_selected" | "import";

interface SyncProgress {
  current: number;
  total: number;
  title: string;
  status: "syncing" | "success" | "error";
}

/**
 * NotionSyncPanel - Selective manual sync with Notion
 * 
 * Features:
 * - Export LIVE content only
 * - Export selected blocks
 * - Import from Notion
 * - No auto-sync (all manual triggers)
 */
export default function NotionSyncPanel() {
  const {
    isConfigured,
    isSyncing,
    lastSyncResult,
    conflicts,
    error,
    configure,
    getConfig,
    syncAll,
    pullFromNotion,
    disableAutoSync,
  } = useNotionSync();

  const { nodes } = useCanvasStore();
  const { success, error: showError } = useToast();
  
  // Sync progress state
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [syncMode, setSyncMode] = useState<SyncMode>("export_live");
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [showConfig, setShowConfig] = useState(false);
  
  // Default config from environment (will be empty if not configured)
  const DEFAULT_CONFIG: Partial<NotionSyncConfig> = {
    apiKey: "", // Will be loaded from server-side env
    contentBlocksDatabaseId: "",
    roadmapItemsDatabaseId: "",
    autoSync: false, // Always manual
    syncDirection: "BIDIRECTIONAL",
    conflictResolution: "MANUAL",
    syncIntervalMs: 3600000,
  };
  
  const [config, setConfig] = useState<Partial<NotionSyncConfig>>(DEFAULT_CONFIG);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get blocks by status
  const blocksByStatus = useMemo(() => {
    const result: Record<string, BlockData[]> = {
      LIVE: [],
      APPROVED: [],
      PENDING_REVIEW: [],
      DRAFT: [],
      OTHER: [],
    };
    
    nodes.forEach((n) => {
      const data = n.data as BlockData;
      const status = data.status as BlockStatus;
      if (result[status]) {
        result[status].push(data);
      } else {
        result.OTHER.push(data);
      }
    });
    
    return result;
  }, [nodes]);

  const liveBlocks = blocksByStatus.LIVE;
  const allBlocks = nodes.map((n) => n.data as BlockData);

  // Load config on mount and disable auto-sync
  useEffect(() => {
    const savedConfig = getConfig();
    
    // Ensure default values are used for any empty/missing fields
    const mergedConfig = {
      apiKey: savedConfig.apiKey || DEFAULT_CONFIG.apiKey || "",
      contentBlocksDatabaseId: savedConfig.contentBlocksDatabaseId || DEFAULT_CONFIG.contentBlocksDatabaseId || "",
      roadmapItemsDatabaseId: savedConfig.roadmapItemsDatabaseId || DEFAULT_CONFIG.roadmapItemsDatabaseId || "",
      syncDirection: savedConfig.syncDirection || DEFAULT_CONFIG.syncDirection || "BIDIRECTIONAL",
      conflictResolution: savedConfig.conflictResolution || DEFAULT_CONFIG.conflictResolution || "MANUAL",
      syncIntervalMs: savedConfig.syncIntervalMs || DEFAULT_CONFIG.syncIntervalMs || 3600000,
      autoSync: false, // Always manual
    };
    
    setConfig(mergedConfig);
    
    // Always ensure auto-sync is disabled
    disableAutoSync();
    
    // Auto-configure on first load - always ensure service has the config
    configure(mergedConfig);
  }, [getConfig, configure, disableAutoSync]);

  // Subscribe to sync events for progress updates
  useEffect(() => {
    const syncService = getNotionSyncService();
    
    const handleSyncEvent = (event: SyncEvent) => {
      if (event.type === "SYNC_PROGRESS") {
        setSyncProgress({
          current: event.current,
          total: event.total,
          title: event.title,
          status: event.status,
        });
      } else if (event.type === "SYNC_COMPLETE") {
        setIsExporting(false);
        setSyncProgress(null);
        
        // Show completion notification
        if (event.result.success) {
          success(`Successfully exported ${event.result.syncedCount} blocks to Notion!`);
        } else if (event.result.syncedCount > 0) {
          showError(`Exported ${event.result.syncedCount} blocks, but ${event.result.failedCount} failed.`);
        } else {
          showError(`Export failed. ${event.result.failedCount} blocks could not be synced.`);
        }
      }
    };
    
    const unsubscribe = syncService.subscribe(handleSyncEvent);
    return () => unsubscribe();
  }, [success, showError]);

  const effectivelyConfigured = !!config.apiKey && 
    !!config.contentBlocksDatabaseId && 
    !!config.roadmapItemsDatabaseId;

  const handleSaveConfig = () => {
    setIsSaving(true);
    configure({ ...config, autoSync: false });
    disableAutoSync();
    
    setTimeout(() => {
      setIsSaving(false);
      setShowConfig(false);
    }, 500);
  };

  const handleSync = async () => {
    try {
      // Get the blocks to sync based on sync mode
      let blocksToSync: BlockData[] = [];
      
      if (syncMode === "export_live") {
        blocksToSync = liveBlocks;
      } else if (syncMode === "export_selected") {
        blocksToSync = allBlocks.filter((b) => selectedBlockIds.has(b.id));
      }
      
      if (blocksToSync.length === 0) {
        console.log("No blocks to sync");
        return;
      }
      
      // Set exporting state
      setIsExporting(true);
      setSyncProgress({ current: 0, total: blocksToSync.length, title: "Starting...", status: "syncing" });
      
      console.log(`Syncing ${blocksToSync.length} blocks...`);
      
      // Use the sync service directly to sync only the filtered blocks
      const syncService = getNotionSyncService();
      const result = await syncService.pushAllBlocksToNotion(blocksToSync);
      
      console.log(`Sync complete: ${result.syncedCount} synced, ${result.failedCount} failed`);
    } catch (err) {
      console.error("Sync failed:", err);
      setIsExporting(false);
      setSyncProgress(null);
      showError("Export failed. Please try again.");
    }
  };

  const handlePull = async () => {
    try {
      await pullFromNotion();
    } catch (err) {
      console.error("Pull failed:", err);
    }
  };

  const toggleBlockSelection = (blockId: string) => {
    const newSelection = new Set(selectedBlockIds);
    if (newSelection.has(blockId)) {
      newSelection.delete(blockId);
    } else {
      newSelection.add(blockId);
    }
    setSelectedBlockIds(newSelection);
  };

  const selectAllLive = () => {
    setSelectedBlockIds(new Set(liveBlocks.map((b) => b.id)));
  };

  const clearSelection = () => {
    setSelectedBlockIds(new Set());
  };

  const getExportCount = () => {
    if (syncMode === "export_live") return liveBlocks.length;
    if (syncMode === "export_selected") return selectedBlockIds.size;
    return 0;
  };

  return (
    <div className="relative z-[60]">
      {/* Sync Status Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
          transition-all duration-200
          ${effectivelyConfigured || isConfigured
            ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
            : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
          }
          ${isSyncing ? "animate-pulse" : ""}
        `}
      >
        <NotionIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Notion</span>
        {conflicts.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500/30 text-red-300 rounded-full">
            ⚠️ {conflicts.length}
          </span>
        )}
        {isSyncing && (
          <span className="ml-1 w-3 h-3 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-[440px] bg-slate-900 rounded-xl border border-slate-700 shadow-2xl z-[60] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <NotionIcon className="w-5 h-5" />
                  Notion Sync
                  <span className="text-xs text-slate-400 font-normal">(Manual)</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="text-xs text-slate-400 hover:text-slate-300"
                  >
                    ⚙️ Settings
                  </button>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      effectivelyConfigured || isConfigured
                        ? "bg-green-500/20 text-green-300"
                        : "bg-slate-600 text-slate-400"
                    }`}
                  >
                    {effectivelyConfigured || isConfigured ? "Connected" : "Not Connected"}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Last Sync Result */}
              {lastSyncResult && (
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Last Sync</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-300">
                      ✓ {lastSyncResult.syncedCount} synced
                    </span>
                    {lastSyncResult.failedCount > 0 && (
                      <span className="text-red-300">
                        ✗ {lastSyncResult.failedCount} failed
                      </span>
                    )}
                    <span className="text-slate-500 text-xs ml-auto">
                      {lastSyncResult.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Sync Mode Selector */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">
                  Sync Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSyncMode("export_live")}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      syncMode === "export_live"
                        ? "bg-purple-500/20 border-purple-500 text-purple-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <span className="text-lg block mb-1">🚀</span>
                    <span className="text-xs font-medium block">Export LIVE</span>
                    <span className="text-[10px] text-slate-500">{liveBlocks.length} blocks</span>
                  </button>
                  <button
                    onClick={() => setSyncMode("export_selected")}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      syncMode === "export_selected"
                        ? "bg-purple-500/20 border-purple-500 text-purple-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <span className="text-lg block mb-1">☑️</span>
                    <span className="text-xs font-medium block">Export Selected</span>
                    <span className="text-[10px] text-slate-500">{selectedBlockIds.size} selected</span>
                  </button>
                  <button
                    onClick={() => setSyncMode("import")}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      syncMode === "import"
                        ? "bg-purple-500/20 border-purple-500 text-purple-300"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <span className="text-lg block mb-1">📥</span>
                    <span className="text-xs font-medium block">Import</span>
                    <span className="text-[10px] text-slate-500">From Notion</span>
                  </button>
                </div>
              </div>

              {/* Block Selection (for export_selected mode) */}
              {syncMode === "export_selected" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-400 font-medium">
                      Select Blocks to Export
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllLive}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        Select LIVE
                      </button>
                      <button
                        onClick={clearSelection}
                        className="text-xs text-slate-500 hover:text-slate-400"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-700 rounded-lg p-2">
                    {allBlocks.map((block) => (
                      <label
                        key={block.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          selectedBlockIds.has(block.id)
                            ? "bg-purple-500/20"
                            : "hover:bg-slate-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBlockIds.has(block.id)}
                          onChange={() => toggleBlockSelection(block.id)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-300 truncate flex-1">
                          {block.title}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          block.status === "LIVE"
                            ? "bg-green-500/20 text-green-400"
                            : block.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : block.status === "DRAFT"
                            ? "bg-slate-600 text-slate-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {block.status}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Sync Actions */}
              {(effectivelyConfigured || isConfigured) && (
                <div className="flex gap-2">
                  {syncMode === "import" ? (
                    <button
                      onClick={handlePull}
                      disabled={isSyncing}
                      className="flex-1 px-3 py-2.5 bg-purple-500 text-white rounded-lg font-medium text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSyncing ? "Importing..." : "📥 Import from Notion"}
                    </button>
                  ) : (
                    <button
                      onClick={handleSync}
                      disabled={isSyncing || isExporting || getExportCount() === 0}
                      className="flex-1 px-3 py-2.5 bg-purple-500 text-white rounded-lg font-medium text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isExporting ? "Exporting..." : `🚀 Export ${getExportCount()} Block${getExportCount() !== 1 ? "s" : ""}`}
                    </button>
                  )}
                </div>
              )}

              {/* Export Progress Indicator */}
              {isExporting && syncProgress && (
                <div className="p-4 bg-slate-800/80 border border-purple-500/30 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      Exporting to Notion...
                    </span>
                    <span className="text-xs text-purple-300 font-mono">
                      {syncProgress.current}/{syncProgress.total}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300 ease-out"
                      style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                    />
                  </div>
                  
                  {/* Current Block */}
                  <div className="flex items-center gap-2 text-xs">
                    {syncProgress.status === "syncing" && (
                      <span className="text-yellow-400">⏳</span>
                    )}
                    {syncProgress.status === "success" && (
                      <span className="text-green-400">✓</span>
                    )}
                    {syncProgress.status === "error" && (
                      <span className="text-red-400">✗</span>
                    )}
                    <span className="text-slate-400 truncate">
                      {syncProgress.title}
                    </span>
                  </div>
                </div>
              )}

              {/* Info Banner */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-xs">
                  💡 <strong>Manual sync only.</strong> Changes are not automatically synced. 
                  Use this panel to push or pull content when ready.
                </p>
              </div>

              {/* Configuration Form (collapsed by default) */}
              {showConfig && (
                <div className="border-t border-slate-700 pt-4 space-y-3">
                  <h4 className="text-slate-300 text-sm font-medium">
                    Configuration
                  </h4>

                  {/* API Key */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Notion API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={config.apiKey || ""}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
                        }
                        placeholder="secret_..."
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showApiKey ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  {/* Content Blocks Database ID */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Content Blocks Database ID
                    </label>
                    <input
                      type="text"
                      value={config.contentBlocksDatabaseId || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          contentBlocksDatabaseId: e.target.value,
                        }))
                      }
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Roadmap Items Database ID */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Roadmap Items Database ID
                    </label>
                    <input
                      type="text"
                      value={config.roadmapItemsDatabaseId || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          roadmapItemsDatabaseId: e.target.value,
                        }))
                      }
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg font-medium text-sm hover:bg-slate-600 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? "Saving..." : "Save Configuration"}
                  </button>
                </div>
              )}

              {/* Help Link */}
              <div className="text-center">
                <a
                  href="https://developers.notion.com/docs/create-a-notion-integration"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-purple-300 transition-colors"
                >
                  How to get your Notion API key →
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Notion Icon component
 */
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
