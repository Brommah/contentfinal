/**
 * Notion Integration Type Definitions
 * Types for bi-directional sync between Content Visualizer and Notion
 */

import type { BlockData, BlockType, BlockStatus, Company } from "./types";
import type { RoadmapItem, RoadmapStatus } from "./roadmap-types";

// =============================================================================
// NOTION DATABASE FIELD MAPPINGS
// =============================================================================

/**
 * Content Blocks Database - Property IDs
 * Use these when querying/updating the Notion API
 */
export const CONTENT_BLOCKS_PROPERTIES = {
  // Required Fields
  title: "title",
  id: "cv_id",
  type: "block_type",
  company: "company",
  status: "status",
  subtitle: "subtitle",
  content: "content",
  tags: "tags",
  externalUrl: "external_url",
  owner: "owner",
  ownerName: "owner_name",

  // Review Workflow
  submittedForReviewAt: "submitted_for_review_at",
  reviewComments: "review_comments",

  // Position (Canvas)
  positionX: "position_x",
  positionY: "position_y",
  width: "width",
  height: "height",

  // Metadata
  workspaceId: "workspace_id",
  parentBlock: "parent_block",
  createdAt: "created_at",
  updatedAt: "updated_at",
  syncStatus: "sync_status",
  lastSyncAt: "last_sync_at",
} as const;

/**
 * Roadmap Items Database - Property IDs
 */
export const ROADMAP_ITEMS_PROPERTIES = {
  // Required Fields
  title: "title",
  id: "cv_id",
  description: "description",
  company: "company",
  contentType: "content_type",
  status: "status",
  priority: "priority",
  tags: "tags",

  // Timeline
  targetDate: "target_date",
  endDate: "end_date",
  phase: "phase",
  phaseId: "phase_id",

  // Assignment
  assignee: "assignee",
  assigneeId: "assignee_id",

  // Relationships
  linkedBlocks: "linked_blocks",
  dependsOn: "depends_on",
  milestoneId: "milestone_id",

  // Metadata
  createdAt: "created_at",
  updatedAt: "updated_at",
  syncStatus: "sync_status",
  lastSyncAt: "last_sync_at",
} as const;

// =============================================================================
// SYNC STATUS & CONFIGURATION
// =============================================================================

export type SyncStatus = "SYNCED" | "PENDING" | "CONFLICT" | "ERROR";

export type SyncDirection = "APP_TO_NOTION" | "NOTION_TO_APP" | "BIDIRECTIONAL";

export interface NotionSyncConfig {
  contentBlocksDatabaseId: string;
  roadmapItemsDatabaseId: string;
  apiKey: string;
  syncDirection: SyncDirection;
  autoSync: boolean;
  syncIntervalMs: number;
  conflictResolution: "APP_WINS" | "NOTION_WINS" | "MANUAL";
}

/**
 * Get default Notion sync configuration from environment variables.
 * Falls back to empty strings if not configured.
 */
export function getDefaultSyncConfig(): NotionSyncConfig {
  return {
    contentBlocksDatabaseId: process.env.NOTION_CONTENT_BLOCKS_DATABASE_ID || "",
    roadmapItemsDatabaseId: process.env.NOTION_ROADMAP_DATABASE_ID || "",
    apiKey: process.env.NOTION_API_KEY || "",
    syncDirection: "BIDIRECTIONAL",
    autoSync: false, // Manual sync only
    syncIntervalMs: 3600000, // 1 hour
    conflictResolution: "MANUAL",
  };
}

// Default configuration - requires environment variables
export const DEFAULT_SYNC_CONFIG: NotionSyncConfig = {
  contentBlocksDatabaseId: process.env.NOTION_CONTENT_BLOCKS_DATABASE_ID || "",
  roadmapItemsDatabaseId: process.env.NOTION_ROADMAP_DATABASE_ID || "",
  apiKey: process.env.NOTION_API_KEY || "",
  syncDirection: "BIDIRECTIONAL",
  autoSync: false,
  syncIntervalMs: 3600000,
  conflictResolution: "MANUAL",
};

// =============================================================================
// SYNC RECORD TYPES
// =============================================================================

export interface SyncRecord {
  entityType: "BLOCK" | "ROADMAP_ITEM";
  appId: string;
  notionPageId: string;
  contentBlockIds?: string[]; // IDs of content blocks in page body (for updating)
  lastAppUpdate: Date;
  lastNotionUpdate: Date;
  syncStatus: SyncStatus;
  hasConflict: boolean;
  conflictData?: {
    appVersion: Partial<BlockData> | Partial<RoadmapItem>;
    notionVersion: Partial<BlockData> | Partial<RoadmapItem>;
  };
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflicts: SyncRecord[];
  errors: Array<{ id: string; error: string }>;
  timestamp: Date;
}

// =============================================================================
// NOTION API PAYLOAD TYPES
// =============================================================================

/**
 * Notion property value types for API requests
 */
export interface NotionPropertyValue {
  title?: Array<{ text: { content: string } }>;
  rich_text?: Array<{ text: { content: string } }>;
  select?: { name: string } | null;
  multi_select?: Array<{ name: string }>;
  number?: number | null;
  date?: { start: string; end?: string } | null;
  url?: string | null;
  checkbox?: boolean;
  relation?: Array<{ id: string }>;
  people?: Array<{ id: string }>;
  created_time?: string;
  last_edited_time?: string;
}

export type NotionProperties = Record<string, NotionPropertyValue>;

/**
 * Notion page response structure
 */
export interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  properties: NotionProperties;
  url: string;
}

export interface NotionQueryResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

// =============================================================================
// CONVERSION UTILITIES
// =============================================================================

/**
 * Convert BlockData to Notion properties format
 */
export function blockToNotionProperties(block: BlockData): NotionProperties {
  return {
    [CONTENT_BLOCKS_PROPERTIES.title]: {
      title: [{ text: { content: block.title } }],
    },
    [CONTENT_BLOCKS_PROPERTIES.id]: {
      rich_text: [{ text: { content: block.id } }],
    },
    [CONTENT_BLOCKS_PROPERTIES.type]: {
      select: { name: block.type },
    },
    [CONTENT_BLOCKS_PROPERTIES.company]: {
      select: { name: block.company },
    },
    [CONTENT_BLOCKS_PROPERTIES.status]: {
      select: { name: block.status },
    },
    [CONTENT_BLOCKS_PROPERTIES.subtitle]: {
      rich_text: block.subtitle ? [{ text: { content: block.subtitle } }] : [],
    },
    // Note: content is stored in page body, not as a property
    [CONTENT_BLOCKS_PROPERTIES.tags]: {
      multi_select: block.tags.map((tag) => ({ name: tag })),
    },
    [CONTENT_BLOCKS_PROPERTIES.externalUrl]: {
      url: block.externalUrl || null,
    },
    [CONTENT_BLOCKS_PROPERTIES.ownerName]: {
      rich_text: block.ownerName ? [{ text: { content: block.ownerName } }] : [],
    },
    [CONTENT_BLOCKS_PROPERTIES.positionX]: {
      number: block.positionX,
    },
    [CONTENT_BLOCKS_PROPERTIES.positionY]: {
      number: block.positionY,
    },
    [CONTENT_BLOCKS_PROPERTIES.width]: {
      number: block.width,
    },
    [CONTENT_BLOCKS_PROPERTIES.height]: {
      number: block.height,
    },
    [CONTENT_BLOCKS_PROPERTIES.workspaceId]: {
      rich_text: [{ text: { content: block.workspaceId } }],
    },
    [CONTENT_BLOCKS_PROPERTIES.submittedForReviewAt]: {
      date: block.submittedForReviewAt
        ? { start: block.submittedForReviewAt.toISOString().split("T")[0] }
        : null,
    },
  };
}

/**
 * Notion block type for page body content
 */
export interface NotionBlock {
  object: "block";
  id: string;
  type: string;
  paragraph?: {
    rich_text: Array<{ text: { content: string }; plain_text?: string }>;
  };
  callout?: {
    rich_text: Array<{ text: { content: string }; plain_text?: string }>;
    icon?: { emoji: string };
  };
  quote?: {
    rich_text: Array<{ text: { content: string }; plain_text?: string }>;
  };
  bulleted_list_item?: {
    rich_text: Array<{ text: { content: string }; plain_text?: string }>;
  };
  numbered_list_item?: {
    rich_text: Array<{ text: { content: string }; plain_text?: string }>;
  };
  heading_1?: {
    rich_text: Array<{ text: { content: string }; plain_text?: string }>;
  };
  heading_2?: {
    rich_text: Array<{ text: { content: string }; plain_text?: string }>;
  };
  heading_3?: {
    rich_text: Array<{ text: { content: string }; plain_text?: string }>;
  };
  toggle?: {
    rich_text: Array<{ text: { content: string }; plain_text?: string }>;
  };
  [key: string]: unknown;
}

// Notion has a 2000 character limit per rich_text segment
const NOTION_TEXT_LIMIT = 2000;

/**
 * Split text into chunks respecting Notion's character limit
 */
function splitTextIntoChunks(text: string, limit: number = NOTION_TEXT_LIMIT): string[] {
  if (text.length <= limit) return [text];
  
  const chunks: string[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      chunks.push(remaining);
      break;
    }
    
    // Try to split at a sentence boundary
    let splitIndex = remaining.lastIndexOf(". ", limit);
    if (splitIndex === -1 || splitIndex < limit / 2) {
      // Try word boundary
      splitIndex = remaining.lastIndexOf(" ", limit);
    }
    if (splitIndex === -1 || splitIndex < limit / 2) {
      // Force split at limit
      splitIndex = limit;
    }
    
    chunks.push(remaining.substring(0, splitIndex + 1).trim());
    remaining = remaining.substring(splitIndex + 1).trim();
  }
  
  return chunks;
}

/**
 * Create rich_text array from content, handling character limits
 */
function createRichText(content: string): Array<{ type: string; text: { content: string } }> {
  const chunks = splitTextIntoChunks(content);
  return chunks.map(chunk => ({
    type: "text",
    text: { content: chunk },
  }));
}

/**
 * Create page body content blocks from BlockData content
 * Handles long content by splitting into multiple blocks and rich_text segments
 */
export function blockContentToNotionBlocks(content: string | undefined): object[] {
  if (!content) return [];
  
  const blocks: object[] = [];
  
  // Split content into paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    
    // Handle very long paragraphs by splitting into multiple blocks
    if (trimmed.length > NOTION_TEXT_LIMIT * 3) {
      // Split into multiple paragraph blocks
      const chunks = splitTextIntoChunks(trimmed, NOTION_TEXT_LIMIT);
      for (const chunk of chunks) {
        blocks.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: chunk } }],
          },
        });
      }
    } else {
      // Single paragraph block with potentially multiple rich_text segments
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: createRichText(trimmed),
        },
      });
    }
  }
  
  return blocks;
}

/**
 * Extract text from a rich_text array
 */
function extractRichText(richText: Array<{ text?: { content: string }; plain_text?: string }> | undefined): string {
  if (!richText) return "";
  return richText.map(rt => rt.plain_text || rt.text?.content || "").join("");
}

/**
 * Extract content from Notion page blocks
 * Supports multiple block types: paragraph, callout, quote, lists, headings, toggles
 */
export function notionBlocksToContent(blocks: NotionBlock[]): string {
  const textParts: string[] = [];
  
  for (const block of blocks) {
    let text = "";
    
    switch (block.type) {
      case "paragraph":
        text = extractRichText(block.paragraph?.rich_text);
        break;
      case "callout":
        text = extractRichText(block.callout?.rich_text);
        break;
      case "quote":
        text = extractRichText(block.quote?.rich_text);
        break;
      case "bulleted_list_item":
        text = "• " + extractRichText(block.bulleted_list_item?.rich_text);
        break;
      case "numbered_list_item":
        text = extractRichText(block.numbered_list_item?.rich_text);
        break;
      case "heading_1":
        text = "# " + extractRichText(block.heading_1?.rich_text);
        break;
      case "heading_2":
        text = "## " + extractRichText(block.heading_2?.rich_text);
        break;
      case "heading_3":
        text = "### " + extractRichText(block.heading_3?.rich_text);
        break;
      case "toggle":
        text = extractRichText(block.toggle?.rich_text);
        break;
      default:
        // Skip unsupported block types
        continue;
    }
    
    if (text.trim()) {
      textParts.push(text.trim());
    }
  }
  
  return textParts.join("\n\n");
}

/**
 * Convert Notion page to BlockData format
 */
export function notionPageToBlock(page: NotionPage): Partial<BlockData> {
  const props = page.properties;

  const getRichText = (prop: NotionPropertyValue | undefined): string | null => {
    if (!prop?.rich_text?.length) return null;
    return prop.rich_text.map((t) => t.text?.content || "").join("");
  };

  const getTitle = (prop: NotionPropertyValue | undefined): string => {
    if (!prop?.title?.length) return "";
    return prop.title.map((t) => t.text?.content || "").join("");
  };

  const getSelect = (prop: NotionPropertyValue | undefined): string | null => {
    return prop?.select?.name || null;
  };

  const getMultiSelect = (prop: NotionPropertyValue | undefined): string[] => {
    return prop?.multi_select?.map((s) => s.name) || [];
  };

  const getNumber = (prop: NotionPropertyValue | undefined): number => {
    return prop?.number || 0;
  };

  const getDate = (prop: NotionPropertyValue | undefined): Date | null => {
    if (!prop?.date?.start) return null;
    return new Date(prop.date.start);
  };

  return {
    id: getRichText(props[CONTENT_BLOCKS_PROPERTIES.id]) || page.id,
    title: getTitle(props[CONTENT_BLOCKS_PROPERTIES.title]),
    type: (getSelect(props[CONTENT_BLOCKS_PROPERTIES.type]) as BlockType) || "FEATURE",
    company: (getSelect(props[CONTENT_BLOCKS_PROPERTIES.company]) as Company) || "SHARED",
    status: (getSelect(props[CONTENT_BLOCKS_PROPERTIES.status]) as BlockStatus) || "DRAFT",
    subtitle: getRichText(props[CONTENT_BLOCKS_PROPERTIES.subtitle]),
    content: getRichText(props[CONTENT_BLOCKS_PROPERTIES.content]),
    tags: getMultiSelect(props[CONTENT_BLOCKS_PROPERTIES.tags]),
    externalUrl: props[CONTENT_BLOCKS_PROPERTIES.externalUrl]?.url || null,
    ownerName: getRichText(props[CONTENT_BLOCKS_PROPERTIES.ownerName]),
    positionX: getNumber(props[CONTENT_BLOCKS_PROPERTIES.positionX]),
    positionY: getNumber(props[CONTENT_BLOCKS_PROPERTIES.positionY]),
    width: getNumber(props[CONTENT_BLOCKS_PROPERTIES.width]) || 280,
    height: getNumber(props[CONTENT_BLOCKS_PROPERTIES.height]) || 120,
    workspaceId: getRichText(props[CONTENT_BLOCKS_PROPERTIES.workspaceId]) || "demo",
    submittedForReviewAt: getDate(props[CONTENT_BLOCKS_PROPERTIES.submittedForReviewAt]),
    updatedAt: new Date(page.last_edited_time),
    createdAt: new Date(page.created_time),
  };
}

/**
 * Convert RoadmapItem to Notion properties format
 */
export function roadmapItemToNotionProperties(item: RoadmapItem): NotionProperties {
  return {
    [ROADMAP_ITEMS_PROPERTIES.title]: {
      title: [{ text: { content: item.title } }],
    },
    [ROADMAP_ITEMS_PROPERTIES.id]: {
      rich_text: [{ text: { content: item.id } }],
    },
    [ROADMAP_ITEMS_PROPERTIES.description]: {
      rich_text: item.description ? [{ text: { content: item.description } }] : [],
    },
    [ROADMAP_ITEMS_PROPERTIES.company]: {
      select: { name: item.company },
    },
    [ROADMAP_ITEMS_PROPERTIES.contentType]: {
      select: { name: item.contentType },
    },
    [ROADMAP_ITEMS_PROPERTIES.status]: {
      select: { name: item.status },
    },
    [ROADMAP_ITEMS_PROPERTIES.priority]: {
      select: { name: item.priority },
    },
    [ROADMAP_ITEMS_PROPERTIES.tags]: {
      multi_select: item.tags.map((tag) => ({ name: tag })),
    },
    ...(item.targetDate ? {
      [ROADMAP_ITEMS_PROPERTIES.targetDate]: {
        date: { start: new Date(item.targetDate).toISOString().split("T")[0] },
      },
    } : {}),
    ...(item.endDate ? {
      [ROADMAP_ITEMS_PROPERTIES.endDate]: {
        date: { start: new Date(item.endDate).toISOString().split("T")[0] },
      },
    } : {}),
    [ROADMAP_ITEMS_PROPERTIES.phaseId]: {
      rich_text: [{ text: { content: item.phaseId } }],
    },
    [ROADMAP_ITEMS_PROPERTIES.assigneeId]: {
      rich_text: item.assigneeId ? [{ text: { content: item.assigneeId } }] : [],
    },
    [ROADMAP_ITEMS_PROPERTIES.milestoneId]: {
      rich_text: item.milestoneId ? [{ text: { content: item.milestoneId } }] : [],
    },
  };
}

/**
 * Convert Notion page to RoadmapItem format
 */
export function notionPageToRoadmapItem(page: NotionPage): Partial<RoadmapItem> {
  const props = page.properties;

  const getRichText = (prop: NotionPropertyValue | undefined): string => {
    if (!prop?.rich_text?.length) return "";
    return prop.rich_text.map((t) => t.text?.content || "").join("");
  };

  const getTitle = (prop: NotionPropertyValue | undefined): string => {
    if (!prop?.title?.length) return "";
    return prop.title.map((t) => t.text?.content || "").join("");
  };

  const getSelect = (prop: NotionPropertyValue | undefined): string | null => {
    return prop?.select?.name || null;
  };

  const getMultiSelect = (prop: NotionPropertyValue | undefined): string[] => {
    return prop?.multi_select?.map((s) => s.name) || [];
  };

  const getDate = (prop: NotionPropertyValue | undefined): Date => {
    if (!prop?.date?.start) return new Date();
    return new Date(prop.date.start);
  };

  const getRelationIds = (prop: NotionPropertyValue | undefined): string[] => {
    return prop?.relation?.map((r) => r.id) || [];
  };

  return {
    id: getRichText(props[ROADMAP_ITEMS_PROPERTIES.id]) || page.id,
    title: getTitle(props[ROADMAP_ITEMS_PROPERTIES.title]),
    description: getRichText(props[ROADMAP_ITEMS_PROPERTIES.description]),
    company: (getSelect(props[ROADMAP_ITEMS_PROPERTIES.company]) as Company) || "SHARED",
    contentType: (getSelect(props[ROADMAP_ITEMS_PROPERTIES.contentType]) as BlockType) || "FEATURE",
    status: (getSelect(props[ROADMAP_ITEMS_PROPERTIES.status]) as RoadmapStatus) || "PLANNED",
    priority: (getSelect(props[ROADMAP_ITEMS_PROPERTIES.priority]) as RoadmapItem["priority"]) || "MEDIUM",
    tags: getMultiSelect(props[ROADMAP_ITEMS_PROPERTIES.tags]),
    targetDate: getDate(props[ROADMAP_ITEMS_PROPERTIES.targetDate]),
    endDate: (() => {
      const endDateStr = props[ROADMAP_ITEMS_PROPERTIES.endDate]?.date?.start;
      return endDateStr ? new Date(endDateStr) : undefined;
    })(),
    phaseId: getRichText(props[ROADMAP_ITEMS_PROPERTIES.phaseId]) || "phase-foundation",
    assigneeId: getRichText(props[ROADMAP_ITEMS_PROPERTIES.assigneeId]) || undefined,
    milestoneId: getRichText(props[ROADMAP_ITEMS_PROPERTIES.milestoneId]) || undefined,
    linkedBlockIds: getRelationIds(props[ROADMAP_ITEMS_PROPERTIES.linkedBlocks]),
    dependsOn: getRelationIds(props[ROADMAP_ITEMS_PROPERTIES.dependsOn]),
  };
}

// =============================================================================
// NOTION DATABASE SCHEMA TEMPLATES
// =============================================================================

/**
 * Schema definition for creating Content Blocks database via API
 * Can be used with Notion API's database creation endpoint
 */
export const CONTENT_BLOCKS_SCHEMA = {
  title: [{ text: { content: "Content Blocks" } }],
  properties: {
    [CONTENT_BLOCKS_PROPERTIES.title]: { title: {} },
    [CONTENT_BLOCKS_PROPERTIES.id]: { rich_text: {} },
    [CONTENT_BLOCKS_PROPERTIES.type]: {
      select: {
        options: [
          { name: "COMPANY", color: "blue" },
          { name: "CORE_VALUE_PROP", color: "yellow" },
          { name: "PAIN_POINT", color: "red" },
          { name: "SOLUTION", color: "green" },
          { name: "FEATURE", color: "purple" },
          { name: "VERTICAL", color: "orange" },
          { name: "ARTICLE", color: "gray" },
          { name: "TECH_COMPONENT", color: "pink" },
        ],
      },
    },
    [CONTENT_BLOCKS_PROPERTIES.company]: {
      select: {
        options: [
          { name: "CERE", color: "blue" },
          { name: "CEF", color: "purple" },
          { name: "SHARED", color: "green" },
        ],
      },
    },
    [CONTENT_BLOCKS_PROPERTIES.status]: {
      select: {
        options: [
          { name: "LIVE", color: "green" },
          { name: "VISION", color: "purple" },
          { name: "DRAFT", color: "gray" },
          { name: "ARCHIVED", color: "brown" },
          { name: "PENDING_REVIEW", color: "yellow" },
          { name: "APPROVED", color: "green" },
          { name: "NEEDS_CHANGES", color: "red" },
        ],
      },
    },
    [CONTENT_BLOCKS_PROPERTIES.subtitle]: { rich_text: {} },
    [CONTENT_BLOCKS_PROPERTIES.content]: { rich_text: {} },
    [CONTENT_BLOCKS_PROPERTIES.tags]: { multi_select: { options: [] } },
    [CONTENT_BLOCKS_PROPERTIES.externalUrl]: { url: {} },
    [CONTENT_BLOCKS_PROPERTIES.ownerName]: { rich_text: {} },
    [CONTENT_BLOCKS_PROPERTIES.positionX]: { number: {} },
    [CONTENT_BLOCKS_PROPERTIES.positionY]: { number: {} },
    [CONTENT_BLOCKS_PROPERTIES.width]: { number: {} },
    [CONTENT_BLOCKS_PROPERTIES.height]: { number: {} },
    [CONTENT_BLOCKS_PROPERTIES.workspaceId]: { rich_text: {} },
    [CONTENT_BLOCKS_PROPERTIES.submittedForReviewAt]: { date: {} },
    [CONTENT_BLOCKS_PROPERTIES.reviewComments]: { rich_text: {} },
    [CONTENT_BLOCKS_PROPERTIES.syncStatus]: {
      select: {
        options: [
          { name: "SYNCED", color: "green" },
          { name: "PENDING", color: "yellow" },
          { name: "CONFLICT", color: "red" },
        ],
      },
    },
    [CONTENT_BLOCKS_PROPERTIES.lastSyncAt]: { date: {} },
  },
};

/**
 * Schema definition for creating Roadmap Items database via API
 */
export const ROADMAP_ITEMS_SCHEMA = {
  title: [{ text: { content: "Roadmap Items" } }],
  properties: {
    [ROADMAP_ITEMS_PROPERTIES.title]: { title: {} },
    [ROADMAP_ITEMS_PROPERTIES.id]: { rich_text: {} },
    [ROADMAP_ITEMS_PROPERTIES.description]: { rich_text: {} },
    [ROADMAP_ITEMS_PROPERTIES.company]: {
      select: {
        options: [
          { name: "CERE", color: "blue" },
          { name: "CEF", color: "purple" },
          { name: "SHARED", color: "green" },
        ],
      },
    },
    [ROADMAP_ITEMS_PROPERTIES.contentType]: {
      select: {
        options: [
          { name: "COMPANY", color: "blue" },
          { name: "CORE_VALUE_PROP", color: "yellow" },
          { name: "PAIN_POINT", color: "red" },
          { name: "SOLUTION", color: "green" },
          { name: "FEATURE", color: "purple" },
          { name: "VERTICAL", color: "orange" },
          { name: "ARTICLE", color: "gray" },
          { name: "TECH_COMPONENT", color: "pink" },
        ],
      },
    },
    [ROADMAP_ITEMS_PROPERTIES.status]: {
      select: {
        options: [
          { name: "PLANNED", color: "gray" },
          { name: "IN_PROGRESS", color: "blue" },
          { name: "REVIEW", color: "yellow" },
          { name: "PUBLISHED", color: "green" },
          { name: "ARCHIVED", color: "brown" },
        ],
      },
    },
    [ROADMAP_ITEMS_PROPERTIES.priority]: {
      select: {
        options: [
          { name: "LOW", color: "green" },
          { name: "MEDIUM", color: "yellow" },
          { name: "HIGH", color: "orange" },
          { name: "CRITICAL", color: "red" },
        ],
      },
    },
    [ROADMAP_ITEMS_PROPERTIES.tags]: { multi_select: { options: [] } },
    [ROADMAP_ITEMS_PROPERTIES.targetDate]: { date: {} },
    [ROADMAP_ITEMS_PROPERTIES.endDate]: { date: {} },
    [ROADMAP_ITEMS_PROPERTIES.phase]: {
      select: {
        options: [
          { name: "FOUNDATION", color: "blue" },
          { name: "GROWTH", color: "green" },
          { name: "SCALE", color: "orange" },
          { name: "OPTIMIZE", color: "purple" },
        ],
      },
    },
    [ROADMAP_ITEMS_PROPERTIES.phaseId]: { rich_text: {} },
    [ROADMAP_ITEMS_PROPERTIES.assigneeId]: { rich_text: {} },
    [ROADMAP_ITEMS_PROPERTIES.milestoneId]: { rich_text: {} },
    [ROADMAP_ITEMS_PROPERTIES.syncStatus]: {
      select: {
        options: [
          { name: "SYNCED", color: "green" },
          { name: "PENDING", color: "yellow" },
          { name: "CONFLICT", color: "red" },
        ],
      },
    },
    [ROADMAP_ITEMS_PROPERTIES.lastSyncAt]: { date: {} },
  },
};

