// Content Visualizer Type Definitions
// These mirror the Supabase schema but are used for frontend/API communication

export type BlockType =
  | "COMPANY"
  | "PAGE_ROOT"
  | "CORE_VALUE_PROP"
  | "PAIN_POINT"
  | "SOLUTION"
  | "FEATURE"
  | "VERTICAL"
  | "ARTICLE"
  | "TECH_COMPONENT";

export type Company = "CERE" | "CEF" | "SHARED";

export type BlockStatus = 
  | "LIVE" 
  | "VISION" 
  | "DRAFT" 
  | "ARCHIVED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "NEEDS_CHANGES";

// ============ LIFECYCLE ENFORCEMENT ============

/**
 * Valid status transitions for content lifecycle enforcement.
 * Prevents unapproved content from going live.
 */
export const VALID_STATUS_TRANSITIONS: Record<BlockStatus, BlockStatus[]> = {
  DRAFT: ["PENDING_REVIEW", "ARCHIVED"],
  PENDING_REVIEW: ["APPROVED", "NEEDS_CHANGES"],
  NEEDS_CHANGES: ["DRAFT"],
  APPROVED: ["LIVE", "DRAFT"], // Can publish or revert to draft
  LIVE: ["ARCHIVED"], // Edits create revisions, not direct status changes
  VISION: ["DRAFT"],
  ARCHIVED: ["DRAFT"],
};

/**
 * Check if a status transition is valid
 */
export function canTransitionTo(from: BlockStatus, to: BlockStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get available transitions from a status
 */
export function getAvailableTransitions(from: BlockStatus): BlockStatus[] {
  return VALID_STATUS_TRANSITIONS[from] ?? [];
}

/**
 * Block revision for version control of LIVE content
 */
export interface BlockRevision {
  id: string;
  blockId: string;
  version: number;
  data: Omit<BlockData, 'id' | 'createdAt' | 'updatedAt'>;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  publishedAt?: Date;
  comment?: string;
}

// ============ REVIEW REQUEST WORKFLOW ============

export type ReviewRequestStatus = "PENDING" | "IN_REVIEW" | "COMPLETED" | "CANCELLED";
export type ReviewResolution = "APPROVED" | "NEEDS_CHANGES";

/**
 * Review request entity for active review workflow
 */
export interface ReviewRequest {
  id: string;
  blockIds: string[];
  requestedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  reviewerId: string;
  reviewerName: string;
  requestedAt: Date;
  dueBy: Date;
  context: string; // Description of what's being submitted
  status: ReviewRequestStatus;
  resolution?: ReviewResolution;
  resolvedAt?: Date;
  resolverComment?: string;
}

/**
 * Reviewers available in the system
 */
export interface Reviewer {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export const DEFAULT_REVIEWERS: Reviewer[] = [
  { id: "ceo-1", name: "Fred (CEO)", role: "CEO", avatar: "F" },
  { id: "lead-1", name: "Alex Chen", role: "Content Lead", avatar: "AC" },
  { id: "pm-1", name: "Jordan Lee", role: "Product Manager", avatar: "JL" },
];

// ============ IMPACT ANALYSIS ============

/**
 * Usage information for a block across the system
 */
export interface BlockUsage {
  wireframeSections: {
    id: string;
    pageId: string;
    pageName: string;
    type: string;
  }[];
  roadmapItems: {
    id: string;
    title: string;
  }[];
  dependentBlocks: {
    id: string;
    title: string;
  }[];
  totalUsages: number;
}

// Status configurations for visual rendering
export interface StatusConfig {
  status: BlockStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const STATUS_CONFIGS: Record<BlockStatus, StatusConfig> = {
  LIVE: {
    status: "LIVE",
    label: "Live",
    color: "#15803d",
    bgColor: "#dcfce7",
    icon: "🟢",
  },
  VISION: {
    status: "VISION",
    label: "Vision",
    color: "#7c3aed",
    bgColor: "#ede9fe",
    icon: "🔮",
  },
  DRAFT: {
    status: "DRAFT",
    label: "Draft",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    icon: "📝",
  },
  ARCHIVED: {
    status: "ARCHIVED",
    label: "Archived",
    color: "#9ca3af",
    bgColor: "#e5e7eb",
    icon: "📦",
  },
  PENDING_REVIEW: {
    status: "PENDING_REVIEW",
    label: "Pending Review",
    color: "#d97706",
    bgColor: "#fef3c7",
    icon: "⏳",
  },
  APPROVED: {
    status: "APPROVED",
    label: "Approved",
    color: "#059669",
    bgColor: "#d1fae5",
    icon: "✅",
  },
  NEEDS_CHANGES: {
    status: "NEEDS_CHANGES",
    label: "Needs Changes",
    color: "#dc2626",
    bgColor: "#fee2e2",
    icon: "🔄",
  },
};

export type RelationshipType =
  | "FLOWS_INTO"
  | "SOLVES"
  | "DEPENDS_ON"
  | "REFERENCES"
  | "ENABLES"
  | "PART_OF";

// Block configuration for visual rendering
export interface BlockConfig {
  type: BlockType;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

// Block configurations for each type
export const BLOCK_CONFIGS: Record<BlockType, BlockConfig> = {
  COMPANY: {
    type: "COMPANY",
    label: "Company",
    color: "#1e40af",
    bgColor: "#dbeafe",
    borderColor: "#3b82f6",
    icon: "🏢",
  },
  PAGE_ROOT: {
    type: "PAGE_ROOT",
    label: "Page Root",
    color: "#0369a1",
    bgColor: "#e0f2fe",
    borderColor: "#0ea5e9",
    icon: "📑",
  },
  CORE_VALUE_PROP: {
    type: "CORE_VALUE_PROP",
    label: "Core Value Prop",
    color: "#b45309",
    bgColor: "#fef3c7",
    borderColor: "#f59e0b",
    icon: "💎",
  },
  PAIN_POINT: {
    type: "PAIN_POINT",
    label: "Pain Point",
    color: "#b91c1c",
    bgColor: "#fee2e2",
    borderColor: "#ef4444",
    icon: "🔥",
  },
  SOLUTION: {
    type: "SOLUTION",
    label: "Solution",
    color: "#15803d",
    bgColor: "#dcfce7",
    borderColor: "#22c55e",
    icon: "✅",
  },
  FEATURE: {
    type: "FEATURE",
    label: "Feature",
    color: "#0f766e",
    bgColor: "#ccfbf1",
    borderColor: "#14b8a6",
    icon: "⚡",
  },
  VERTICAL: {
    type: "VERTICAL",
    label: "Vertical",
    color: "#c2410c",
    bgColor: "#ffedd5",
    borderColor: "#f97316",
    icon: "🎯",
  },
  ARTICLE: {
    type: "ARTICLE",
    label: "Article",
    color: "#4b5563",
    bgColor: "#f3f4f6",
    borderColor: "#9ca3af",
    icon: "📄",
  },
  TECH_COMPONENT: {
    type: "TECH_COMPONENT",
    label: "Tech Component",
    color: "#7c3aed",
    bgColor: "#ede9fe",
    borderColor: "#8b5cf6",
    icon: "🔧",
  },
};

// Company color configurations
export const COMPANY_COLORS: Record<Company, { primary: string; secondary: string }> = {
  CERE: {
    primary: "#2563eb",
    secondary: "#dbeafe",
  },
  CEF: {
    primary: "#7c3aed",
    secondary: "#ede9fe",
  },
  SHARED: {
    primary: "#059669",
    secondary: "#d1fae5",
  },
};

// Relationship configurations
export interface RelationshipConfig {
  type: RelationshipType;
  label: string;
  color: string;
  animated: boolean;
  style: "default" | "dashed" | "dotted";
}

export const RELATIONSHIP_CONFIGS: Record<RelationshipType, RelationshipConfig> = {
  FLOWS_INTO: {
    type: "FLOWS_INTO",
    label: "Flows Into",
    color: "#3b82f6",
    animated: true,
    style: "default",
  },
  SOLVES: {
    type: "SOLVES",
    label: "Solves",
    color: "#22c55e",
    animated: false,
    style: "default",
  },
  DEPENDS_ON: {
    type: "DEPENDS_ON",
    label: "Depends On",
    color: "#f59e0b",
    animated: false,
    style: "dashed",
  },
  REFERENCES: {
    type: "REFERENCES",
    label: "References",
    color: "#9ca3af",
    animated: false,
    style: "dotted",
  },
  ENABLES: {
    type: "ENABLES",
    label: "Enables",
    color: "#14b8a6",
    animated: true,
    style: "default",
  },
  PART_OF: {
    type: "PART_OF",
    label: "Part Of",
    color: "#8b5cf6",
    animated: false,
    style: "dashed",
  },
};

// Comment reply
export interface CommentReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

// Comment on a block for review workflow
export interface BlockComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
  resolved?: boolean;
  mentions?: string[]; // @mentioned user names
  replies?: CommentReply[]; // Thread replies
}

// Block data interface (for API/frontend)
export interface BlockData {
  [key: string]: unknown; // Index signature for React Flow compatibility
  id: string;
  type: BlockType;
  company: Company;
  status: BlockStatus;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  tags: string[];
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  externalUrl?: string | null;
  parentId?: string | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  // Review workflow fields
  ownerId?: string | null;
  ownerName?: string | null;
  submittedForReviewAt?: Date | null;
  comments?: BlockComment[];
}

// Connection data interface
export interface ConnectionData {
  id: string;
  relationshipType: RelationshipType;
  label?: string | null;
  animated: boolean;
  style?: string | null;
  fromBlockId: string;
  toBlockId: string;
  workspaceId: string;
}

// Workspace data interface
export interface WorkspaceData {
  id: string;
  name: string;
  description?: string | null;
  viewportX: number;
  viewportY: number;
  viewportZoom: number;
  ownerId: string;
  blocks?: BlockData[];
  connections?: ConnectionData[];
}

// API request/response types
export interface CreateBlockRequest {
  type: BlockType;
  company: Company;
  title: string;
  subtitle?: string;
  content?: string;
  tags?: string[];
  positionX?: number;
  positionY?: number;
  parentId?: string;
  workspaceId: string;
}

export interface UpdateBlockRequest {
  type?: BlockType;
  company?: Company;
  status?: BlockStatus;
  title?: string;
  subtitle?: string;
  content?: string;
  tags?: string[];
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  externalUrl?: string;
  parentId?: string | null;
}

export interface CreateConnectionRequest {
  relationshipType: RelationshipType;
  label?: string;
  fromBlockId: string;
  toBlockId: string;
  workspaceId: string;
  animated?: boolean;
}

// Filter options for views
export interface FilterOptions {
  companies: Company[];
  statuses: BlockStatus[];
  types: BlockType[];
  searchQuery: string;
}

// ============ CEO DASHBOARD TYPES ============

export type SuggestionCategory = 
  | "BLOG_POST"
  | "WEBSITE_COPY"
  | "VALUE_PROP"
  | "FEATURE_UPDATE"
  | "MARKETING"
  | "OTHER";

export type SuggestionPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type SuggestionStatus = "PENDING" | "APPROVED" | "REJECTED" | "IN_PROGRESS";

export interface ContentSuggestion {
  id: string;
  title: string;
  description: string;
  category: SuggestionCategory;
  priority: SuggestionPriority;
  status: SuggestionStatus;
  company: Company;
  submittedBy: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewerComment?: string;
  linkedBlockIds?: string[];
}

export const SUGGESTION_CATEGORY_CONFIGS: Record<SuggestionCategory, { label: string; icon: string }> = {
  BLOG_POST: { label: "Blog Post", icon: "📝" },
  WEBSITE_COPY: { label: "Website Copy", icon: "🌐" },
  VALUE_PROP: { label: "Value Proposition", icon: "💎" },
  FEATURE_UPDATE: { label: "Feature Update", icon: "⚡" },
  MARKETING: { label: "Marketing", icon: "📣" },
  OTHER: { label: "Other", icon: "📋" },
};

export const PRIORITY_CONFIGS: Record<SuggestionPriority, { label: string; color: string; icon: string }> = {
  CRITICAL: { label: "Critical", color: "#dc2626", icon: "🔴" },
  HIGH: { label: "High", color: "#ea580c", icon: "🟠" },
  MEDIUM: { label: "Medium", color: "#ca8a04", icon: "🟡" },
  LOW: { label: "Low", color: "#65a30d", icon: "🟢" },
};

// Page review status for wireframes
export type PageReviewStatus = "PENDING" | "APPROVED" | "NEEDS_CHANGES";

export interface PageReview {
  pageId: string;
  pageName: string;
  company: Company;
  status: PageReviewStatus;
  submittedBy: string;
  submittedAt: Date;
  reviewerComment?: string;
}

// ============ GOVERNANCE & ANALYTICS ============

export type RecommendationSeverity = "critical" | "warning" | "info";
export type RecommendationType = 
  | "stale_content"
  | "stuck_review"
  | "orphaned_block"
  | "missing_coverage"
  | "broken_link";

/**
 * Actionable recommendation for content governance
 */
export interface ContentRecommendation {
  id: string;
  type: RecommendationType;
  severity: RecommendationSeverity;
  title: string;
  message: string;
  affectedItems: {
    type: "block" | "section" | "roadmap";
    id: string;
    title: string;
  }[];
  action: {
    label: string;
    type: "navigate" | "batch_action";
    target?: string; // Tab or item ID
    actionId?: string; // For batch actions
  };
  createdAt: Date;
}

/**
 * Content governance metrics
 */
export interface GovernanceMetrics {
  freshness: {
    fresh: number; // Updated in last 30 days
    stale: number; // 30-90 days
    veryStale: number; // 90+ days
  };
  orphans: {
    count: number;
    blocks: { id: string; title: string }[];
  };
  brokenLinks: {
    count: number;
    sections: { id: string; pageName: string; missingBlockId: string }[];
  };
  coverage: {
    byCompany: Record<Company, number>;
    byType: Record<BlockType, number>;
    gaps: { company: Company; type: BlockType }[];
  };
}

