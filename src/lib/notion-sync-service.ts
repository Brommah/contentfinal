/**
 * NotionSyncService - Bi-directional sync between Content Visualizer and Notion
 * 
 * Handles:
 * - Fetching data from Notion databases
 * - Pushing updates to Notion
 * - Conflict detection and resolution
 * - Sync status tracking
 */

import type { BlockData } from "./types";
import type { RoadmapItem } from "./roadmap-types";
import type {
  NotionSyncConfig,
  SyncRecord,
  SyncResult,
  SyncStatus,
  NotionPage,
  NotionProperties,
  NotionQueryResponse,
  NotionBlock,
} from "./notion-types";
import {
  blockToNotionProperties,
  notionPageToBlock,
  roadmapItemToNotionProperties,
  notionPageToRoadmapItem,
  blockContentToNotionBlocks,
  notionBlocksToContent,
  CONTENT_BLOCKS_PROPERTIES,
  ROADMAP_ITEMS_PROPERTIES,
  DEFAULT_SYNC_CONFIG,
} from "./notion-types";

// =============================================================================
// SYNC STORE - Track sync state per entity
// =============================================================================

class SyncStore {
  private records: Map<string, SyncRecord> = new Map();
  private storageKey = "notion_sync_records";

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.records = new Map(Object.entries(parsed));
      } catch {
        console.warn("Failed to parse sync records from storage");
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;
    const obj = Object.fromEntries(this.records);
    localStorage.setItem(this.storageKey, JSON.stringify(obj));
  }

  get(appId: string): SyncRecord | undefined {
    return this.records.get(appId);
  }

  set(appId: string, record: SyncRecord): void {
    this.records.set(appId, record);
    this.saveToStorage();
  }

  delete(appId: string): void {
    this.records.delete(appId);
    this.saveToStorage();
  }

  getAll(): SyncRecord[] {
    return Array.from(this.records.values());
  }

  getConflicts(): SyncRecord[] {
    return this.getAll().filter((r) => r.hasConflict);
  }

  getPending(): SyncRecord[] {
    return this.getAll().filter((r) => r.syncStatus === "PENDING");
  }

  clear(): void {
    this.records.clear();
    this.saveToStorage();
  }
}

// =============================================================================
// NOTION API CLIENT
// =============================================================================

class NotionClient {
  private apiKey: string;
  private proxyUrl = "/api/notion"; // Use server-side proxy to avoid CORS

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Use the proxy route to make Notion API calls
    const method = (options.method as "GET" | "POST" | "PATCH" | "DELETE") || "GET";
    let body: object | undefined;
    
    if (options.body && typeof options.body === "string") {
      try {
        body = JSON.parse(options.body);
      } catch {
        body = undefined;
      }
    }

    const response = await fetch(this.proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint,
        method,
        body,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Notion API error: ${response.status} - ${error.message || error.error || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Query a database for all pages
   */
  async queryDatabase(
    databaseId: string,
    filter?: object,
    startCursor?: string
  ): Promise<NotionQueryResponse> {
    return this.request<NotionQueryResponse>(
      `/databases/${databaseId}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          filter,
          start_cursor: startCursor,
          page_size: 100,
        }),
      }
    );
  }

  /**
   * Get all pages from a database (handles pagination)
   */
  async getAllPages(databaseId: string, filter?: object): Promise<NotionPage[]> {
    const pages: NotionPage[] = [];
    let hasMore = true;
    let cursor: string | undefined;

    while (hasMore) {
      const response = await this.queryDatabase(databaseId, filter, cursor);
      pages.push(...response.results);
      hasMore = response.has_more;
      cursor = response.next_cursor || undefined;
    }

    return pages;
  }

  /**
   * Create a new page in a database
   */
  async createPage(
    databaseId: string,
    properties: NotionProperties
  ): Promise<NotionPage> {
    return this.request<NotionPage>("/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    });
  }

  /**
   * Update an existing page
   */
  async updatePage(
    pageId: string,
    properties: NotionProperties
  ): Promise<NotionPage> {
    return this.request<NotionPage>(`/pages/${pageId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
  }

  /**
   * Archive (soft delete) a page
   */
  async archivePage(pageId: string): Promise<NotionPage> {
    return this.request<NotionPage>(`/pages/${pageId}`, {
      method: "PATCH",
      body: JSON.stringify({ archived: true }),
    });
  }

  /**
   * Retrieve a single page
   */
  async getPage(pageId: string): Promise<NotionPage> {
    return this.request<NotionPage>(`/pages/${pageId}`);
  }

  /**
   * Get all blocks (children) of a page
   */
  async getPageBlocks(pageId: string): Promise<NotionBlock[]> {
    const response = await this.request<{ results: NotionBlock[]; has_more: boolean }>(
      `/blocks/${pageId}/children`
    );
    return response.results;
  }

  /**
   * Append blocks to a page
   * Returns the created block IDs
   */
  async appendBlocks(pageId: string, blocks: object[]): Promise<string[]> {
    if (blocks.length === 0) return [];
    
    const response = await this.request<{ results: Array<{ id: string }> }>(
      `/blocks/${pageId}/children`,
      {
        method: "PATCH",
        body: JSON.stringify({ children: blocks }),
      }
    );
    
    return response.results.map(block => block.id);
  }

  /**
   * Delete a block
   */
  async deleteBlock(blockId: string): Promise<void> {
    await this.request(`/blocks/${blockId}`, {
      method: "DELETE",
    });
  }

  /**
   * Update a specific block's content
   */
  async updateBlock(blockId: string, content: string): Promise<void> {
    await this.request(`/blocks/${blockId}`, {
      method: "PATCH",
      body: JSON.stringify({
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: { content },
            },
          ],
        },
      }),
    });
  }

  /**
   * Clear all blocks from a page (for updating content)
   * WARNING: This deletes ALL blocks including synced blocks - use with caution
   */
  async clearPageBlocks(pageId: string): Promise<void> {
    const blocks = await this.getPageBlocks(pageId);
    for (const block of blocks) {
      await this.deleteBlock(block.id);
    }
  }
}

// =============================================================================
// NOTION SYNC SERVICE
// =============================================================================

export class NotionSyncService {
  private config: NotionSyncConfig;
  private client: NotionClient | null = null;
  private syncStore: SyncStore;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(event: SyncEvent) => void> = new Set();

  constructor(config?: Partial<NotionSyncConfig>) {
    // Load saved config from storage first
    const storedConfig = this.loadConfigFromStorageInternal();
    this.config = { ...DEFAULT_SYNC_CONFIG, ...storedConfig, ...config };
    this.syncStore = new SyncStore();
    if (this.config.apiKey) {
      this.client = new NotionClient(this.config.apiKey);
    }
  }

  // Internal method to load config during construction (before this.config is set)
  private loadConfigFromStorageInternal(): Partial<NotionSyncConfig> {
    if (typeof window === "undefined") return {};
    const stored = localStorage.getItem("notion_sync_config");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------

  updateConfig(config: Partial<NotionSyncConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.apiKey) {
      this.client = new NotionClient(config.apiKey);
    }
    this.saveConfigToStorage();
  }

  getConfig(): NotionSyncConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    return !!(
      this.config.apiKey &&
      this.config.contentBlocksDatabaseId &&
      this.config.roadmapItemsDatabaseId
    );
  }

  private saveConfigToStorage(): void {
    if (typeof window === "undefined") return;
    // Don't store API key in localStorage for security
    const { apiKey: _key, ...safeConfig } = this.config;
    localStorage.setItem("notion_sync_config", JSON.stringify(safeConfig));
  }

  loadConfigFromStorage(): Partial<NotionSyncConfig> {
    if (typeof window === "undefined") return {};
    const stored = localStorage.getItem("notion_sync_config");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  }

  // ---------------------------------------------------------------------------
  // SYNC OPERATIONS - CONTENT BLOCKS
  // ---------------------------------------------------------------------------

  /**
   * Fetch all blocks from Notion
   */
  async fetchBlocksFromNotion(): Promise<Partial<BlockData>[]> {
    if (!this.client || !this.config.contentBlocksDatabaseId) {
      throw new Error("Notion sync not configured");
    }

    const pages = await this.client.getAllPages(
      this.config.contentBlocksDatabaseId
    );

    const blocks: Partial<BlockData>[] = [];
    
    for (const page of pages.filter((p) => !p.archived)) {
      const block = notionPageToBlock(page);
      let contentBlockIds: string[] = [];
      
      // Fetch page body content and track block IDs
      try {
        const pageBlocks = await this.client.getPageBlocks(page.id);
        const content = notionBlocksToContent(pageBlocks);
        if (content) {
          block.content = content;
        }
        // Track all paragraph block IDs for future updates
        contentBlockIds = pageBlocks
          .filter(b => b.type === "paragraph")
          .map(b => b.id);
      } catch (error) {
        console.warn(`Failed to fetch page content for ${page.id}:`, error);
      }
      
      // Update sync record with content block IDs
      this.syncStore.set(block.id!, {
        entityType: "BLOCK",
        appId: block.id!,
        notionPageId: page.id,
        contentBlockIds,
        lastAppUpdate: block.updatedAt || new Date(),
        lastNotionUpdate: new Date(page.last_edited_time),
        syncStatus: "SYNCED",
        hasConflict: false,
      });
      
      blocks.push(block);
    }
    
    return blocks;
  }

  /**
   * Push a single block to Notion
   * 
   * Content is stored in the page body as paragraph blocks.
   * On updates, we delete old content blocks and create new ones to ensure
   * the full content is synced correctly (handles multi-paragraph content).
   */
  async pushBlockToNotion(block: BlockData): Promise<void> {
    if (!this.client || !this.config.contentBlocksDatabaseId) {
      throw new Error("Notion sync not configured");
    }

    const properties = blockToNotionProperties(block);
    const existingRecord = this.syncStore.get(block.id);
    let contentBlockIds: string[] = existingRecord?.contentBlockIds || [];

    try {
      let page: NotionPage;

      if (existingRecord?.notionPageId) {
        // Update existing page properties
        page = await this.client.updatePage(existingRecord.notionPageId, properties);
        
        // Update content in page body
        if (block.content) {
          // Delete existing content blocks to replace with new content
          for (const blockId of contentBlockIds) {
            try {
              await this.client.deleteBlock(blockId);
            } catch {
              // Block might already be deleted, ignore
            }
          }
          
          // Create new content blocks
          const contentBlocks = blockContentToNotionBlocks(block.content);
          if (contentBlocks.length > 0) {
            contentBlockIds = await this.client.appendBlocks(page.id, contentBlocks);
            console.log(`Updated content blocks for "${block.title}": ${contentBlockIds.length} blocks`);
          } else {
            contentBlockIds = [];
          }
        } else if (contentBlockIds.length > 0) {
          // Content was removed, delete old blocks
          for (const blockId of contentBlockIds) {
            try {
              await this.client.deleteBlock(blockId);
            } catch {
              // Ignore deletion errors
            }
          }
          contentBlockIds = [];
        }
      } else {
        // Create new page
        page = await this.client.createPage(
          this.config.contentBlocksDatabaseId,
          properties
        );
        
        // Add content as page body and track all block IDs
        if (block.content) {
          const contentBlocks = blockContentToNotionBlocks(block.content);
          if (contentBlocks.length > 0) {
            contentBlockIds = await this.client.appendBlocks(page.id, contentBlocks);
            console.log(`Created content blocks for "${block.title}": ${contentBlockIds.length} blocks`);
          }
        }
      }

      // Update sync record with all content block IDs
      this.syncStore.set(block.id, {
        entityType: "BLOCK",
        appId: block.id,
        notionPageId: page.id,
        contentBlockIds, // Track all content blocks for future updates
        lastAppUpdate: new Date(),
        lastNotionUpdate: new Date(page.last_edited_time),
        syncStatus: "SYNCED",
        hasConflict: false,
      });

      this.emitEvent({ type: "BLOCK_SYNCED", id: block.id });
    } catch (error) {
      this.syncStore.set(block.id, {
        ...existingRecord!,
        entityType: "BLOCK",
        appId: block.id,
        notionPageId: existingRecord?.notionPageId || "",
        contentBlockIds,
        lastAppUpdate: new Date(),
        lastNotionUpdate: existingRecord?.lastNotionUpdate || new Date(),
        syncStatus: "ERROR",
        hasConflict: false,
      });
      throw error;
    }
  }

  /**
   * Delay utility for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Push all blocks to Notion with rate limiting
   * Notion API has a rate limit of ~3 requests/second
   */
  async pushAllBlocksToNotion(blocks: BlockData[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflicts: [],
      errors: [],
      timestamp: new Date(),
    };

    const RATE_LIMIT_DELAY = 350; // ~3 requests per second with buffer

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Emit progress event - syncing
      this.emitEvent({ 
        type: "SYNC_PROGRESS", 
        current: i + 1, 
        total: blocks.length, 
        title: block.title,
        status: "syncing"
      });
      
      try {
        await this.pushBlockToNotion(block);
        result.syncedCount++;
        console.log(`✓ Synced content block (${i + 1}/${blocks.length}): ${block.title}`);
        
        // Emit progress event - success
        this.emitEvent({ 
          type: "SYNC_PROGRESS", 
          current: i + 1, 
          total: blocks.length, 
          title: block.title,
          status: "success"
        });
        
        // Rate limit: wait between requests
        if (i < blocks.length - 1) {
          await this.delay(RATE_LIMIT_DELAY);
        }
      } catch (error) {
        result.failedCount++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`✗ Failed to sync content block "${block.title}":`, errorMessage);
        result.errors.push({
          id: block.id,
          error: errorMessage,
        });
        
        // Emit progress event - error
        this.emitEvent({ 
          type: "SYNC_PROGRESS", 
          current: i + 1, 
          total: blocks.length, 
          title: block.title,
          status: "error"
        });
        
        // On rate limit error, wait longer before retrying
        if (errorMessage.includes("429")) {
          console.log("Rate limited, waiting 2 seconds...");
          await this.delay(2000);
        }
      }
    }

    result.success = result.failedCount === 0;
    this.emitEvent({ type: "SYNC_COMPLETE", result });
    return result;
  }

  /**
   * Delete a block from Notion (archive it)
   */
  async deleteBlockFromNotion(blockId: string): Promise<void> {
    if (!this.client) {
      throw new Error("Notion sync not configured");
    }

    const record = this.syncStore.get(blockId);
    if (record?.notionPageId) {
      await this.client.archivePage(record.notionPageId);
      this.syncStore.delete(blockId);
      this.emitEvent({ type: "BLOCK_DELETED", id: blockId });
    }
  }

  // ---------------------------------------------------------------------------
  // SYNC OPERATIONS - ROADMAP ITEMS
  // ---------------------------------------------------------------------------

  /**
   * Fetch all roadmap items from Notion
   */
  async fetchRoadmapItemsFromNotion(): Promise<Partial<RoadmapItem>[]> {
    if (!this.client || !this.config.roadmapItemsDatabaseId) {
      throw new Error("Notion sync not configured");
    }

    const pages = await this.client.getAllPages(
      this.config.roadmapItemsDatabaseId
    );

    return pages
      .filter((page) => !page.archived)
      .map((page) => {
        const item = notionPageToRoadmapItem(page);
        // Update sync record
        this.syncStore.set(item.id!, {
          entityType: "ROADMAP_ITEM",
          appId: item.id!,
          notionPageId: page.id,
          lastAppUpdate: new Date(),
          lastNotionUpdate: new Date(page.last_edited_time),
          syncStatus: "SYNCED",
          hasConflict: false,
        });
        return item;
      });
  }

  /**
   * Push a single roadmap item to Notion
   */
  async pushRoadmapItemToNotion(item: RoadmapItem): Promise<void> {
    if (!this.client || !this.config.roadmapItemsDatabaseId) {
      throw new Error("Notion sync not configured");
    }

    const properties = roadmapItemToNotionProperties(item);
    const existingRecord = this.syncStore.get(item.id);

    try {
      let page: NotionPage;

      if (existingRecord?.notionPageId) {
        page = await this.client.updatePage(existingRecord.notionPageId, properties);
      } else {
        page = await this.client.createPage(
          this.config.roadmapItemsDatabaseId,
          properties
        );
      }

      this.syncStore.set(item.id, {
        entityType: "ROADMAP_ITEM",
        appId: item.id,
        notionPageId: page.id,
        lastAppUpdate: new Date(),
        lastNotionUpdate: new Date(page.last_edited_time),
        syncStatus: "SYNCED",
        hasConflict: false,
      });

      this.emitEvent({ type: "ROADMAP_ITEM_SYNCED", id: item.id });
    } catch (error) {
      this.syncStore.set(item.id, {
        ...existingRecord!,
        entityType: "ROADMAP_ITEM",
        appId: item.id,
        notionPageId: existingRecord?.notionPageId || "",
        lastAppUpdate: new Date(),
        lastNotionUpdate: existingRecord?.lastNotionUpdate || new Date(),
        syncStatus: "ERROR",
        hasConflict: false,
      });
      throw error;
    }
  }

  /**
   * Push all roadmap items to Notion with rate limiting
   */
  async pushAllRoadmapItemsToNotion(items: RoadmapItem[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflicts: [],
      errors: [],
      timestamp: new Date(),
    };

    const RATE_LIMIT_DELAY = 350; // ~3 requests per second with buffer

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        await this.pushRoadmapItemToNotion(item);
        result.syncedCount++;
        console.log(`✓ Synced roadmap item (${i + 1}/${items.length}): ${item.title}`);
        
        // Rate limit: wait between requests
        if (i < items.length - 1) {
          await this.delay(RATE_LIMIT_DELAY);
        }
      } catch (error) {
        result.failedCount++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`✗ Failed to sync roadmap item "${item.title}":`, errorMessage);
        result.errors.push({
          id: item.id,
          error: errorMessage,
        });
        
        // On rate limit error, wait longer before retrying
        if (errorMessage.includes("429")) {
          console.log("Rate limited, waiting 2 seconds...");
          await this.delay(2000);
        }
      }
    }

    result.success = result.failedCount === 0;
    this.emitEvent({ type: "SYNC_COMPLETE", result });
    return result;
  }

  // ---------------------------------------------------------------------------
  // CONFLICT DETECTION & RESOLUTION
  // ---------------------------------------------------------------------------

  /**
   * Check for conflicts between app and Notion data
   */
  async detectConflicts(
    appBlocks: BlockData[],
    appRoadmapItems: RoadmapItem[]
  ): Promise<SyncRecord[]> {
    const conflicts: SyncRecord[] = [];

    if (!this.client) return conflicts;

    // Check blocks
    for (const block of appBlocks) {
      const record = this.syncStore.get(block.id);
      if (record?.notionPageId) {
        try {
          const notionPage = await this.client.getPage(record.notionPageId);
          const notionUpdated = new Date(notionPage.last_edited_time);
          const appUpdated = block.updatedAt || new Date();

          // If both have changes since last sync
          if (
            notionUpdated > record.lastNotionUpdate &&
            appUpdated > record.lastAppUpdate
          ) {
            const conflictRecord: SyncRecord = {
              ...record,
              hasConflict: true,
              syncStatus: "CONFLICT",
              conflictData: {
                appVersion: block,
                notionVersion: notionPageToBlock(notionPage),
              },
            };
            this.syncStore.set(block.id, conflictRecord);
            conflicts.push(conflictRecord);
          }
        } catch {
          // Page might have been deleted in Notion
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve a conflict by choosing a version
   */
  resolveConflict(
    appId: string,
    resolution: "APP" | "NOTION"
  ): SyncRecord | null {
    const record = this.syncStore.get(appId);
    if (!record || !record.hasConflict) return null;

    const resolvedRecord: SyncRecord = {
      ...record,
      hasConflict: false,
      syncStatus: "PENDING",
      conflictData: undefined,
    };

    this.syncStore.set(appId, resolvedRecord);
    this.emitEvent({ type: "CONFLICT_RESOLVED", id: appId, resolution });

    return resolvedRecord;
  }

  getConflicts(): SyncRecord[] {
    return this.syncStore.getConflicts();
  }

  // ---------------------------------------------------------------------------
  // AUTO-SYNC
  // ---------------------------------------------------------------------------

  startAutoSync(): void {
    if (this.syncInterval) return;
    if (!this.config.autoSync) return;

    this.syncInterval = setInterval(() => {
      this.emitEvent({ type: "AUTO_SYNC_TICK" });
    }, this.config.syncIntervalMs);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ---------------------------------------------------------------------------
  // SYNC STATUS
  // ---------------------------------------------------------------------------

  getSyncStatus(appId: string): SyncStatus | null {
    return this.syncStore.get(appId)?.syncStatus || null;
  }

  markAsPending(appId: string, entityType: "BLOCK" | "ROADMAP_ITEM"): void {
    const existing = this.syncStore.get(appId);
    this.syncStore.set(appId, {
      entityType,
      appId,
      notionPageId: existing?.notionPageId || "",
      lastAppUpdate: new Date(),
      lastNotionUpdate: existing?.lastNotionUpdate || new Date(),
      syncStatus: "PENDING",
      hasConflict: false,
    });
  }

  getPendingCount(): number {
    return this.syncStore.getPending().length;
  }

  getAllRecords(): SyncRecord[] {
    return this.syncStore.getAll();
  }

  // ---------------------------------------------------------------------------
  // EVENTS
  // ---------------------------------------------------------------------------

  subscribe(listener: (event: SyncEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitEvent(event: SyncEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}

// =============================================================================
// SYNC EVENT TYPES
// =============================================================================

export type SyncEvent =
  | { type: "BLOCK_SYNCED"; id: string }
  | { type: "BLOCK_DELETED"; id: string }
  | { type: "ROADMAP_ITEM_SYNCED"; id: string }
  | { type: "SYNC_COMPLETE"; result: SyncResult }
  | { type: "SYNC_PROGRESS"; current: number; total: number; title: string; status: "syncing" | "success" | "error" }
  | { type: "CONFLICT_RESOLVED"; id: string; resolution: "APP" | "NOTION" }
  | { type: "AUTO_SYNC_TICK" }
  | { type: "SYNC_ERROR"; error: string };

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let syncServiceInstance: NotionSyncService | null = null;

export function getNotionSyncService(): NotionSyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new NotionSyncService();
    // Load config from storage on init
    const savedConfig = syncServiceInstance.loadConfigFromStorage();
    if (Object.keys(savedConfig).length > 0) {
      syncServiceInstance.updateConfig(savedConfig);
    }
  }
  return syncServiceInstance;
}

export function resetNotionSyncService(): void {
  if (syncServiceInstance) {
    syncServiceInstance.stopAutoSync();
  }
  syncServiceInstance = null;
}

