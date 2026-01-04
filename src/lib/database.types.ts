/**
 * Supabase Database Types
 * Type definitions for Content Visualizer database schema
 */

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

export type RelationshipType =
  | "FLOWS_INTO"
  | "SOLVES"
  | "DEPENDS_ON"
  | "REFERENCES"
  | "ENABLES"
  | "PART_OF";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          viewport_x: number;
          viewport_y: number;
          viewport_zoom: number;
          owner_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          viewport_x?: number;
          viewport_y?: number;
          viewport_zoom?: number;
          owner_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          viewport_x?: number;
          viewport_y?: number;
          viewport_zoom?: number;
          owner_id?: string;
        };
      };
      blocks: {
        Row: {
          id: string;
          type: BlockType;
          company: Company;
          status: BlockStatus;
          title: string;
          subtitle: string | null;
          content: string | null;
          tags: string[];
          position_x: number;
          position_y: number;
          width: number;
          height: number;
          external_url: string | null;
          order: number;
          created_at: string;
          updated_at: string;
          workspace_id: string;
          parent_id: string | null;
        };
        Insert: {
          id?: string;
          type: BlockType;
          company: Company;
          status?: BlockStatus;
          title: string;
          subtitle?: string | null;
          content?: string | null;
          tags?: string[];
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
          external_url?: string | null;
          order?: number;
          created_at?: string;
          updated_at?: string;
          workspace_id: string;
          parent_id?: string | null;
        };
        Update: {
          id?: string;
          type?: BlockType;
          company?: Company;
          status?: BlockStatus;
          title?: string;
          subtitle?: string | null;
          content?: string | null;
          tags?: string[];
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
          external_url?: string | null;
          order?: number;
          created_at?: string;
          updated_at?: string;
          workspace_id?: string;
          parent_id?: string | null;
        };
      };
      connections: {
        Row: {
          id: string;
          relationship_type: RelationshipType;
          label: string | null;
          animated: boolean;
          style: string | null;
          from_block_id: string;
          to_block_id: string;
          workspace_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          relationship_type: RelationshipType;
          label?: string | null;
          animated?: boolean;
          style?: string | null;
          from_block_id: string;
          to_block_id: string;
          workspace_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          relationship_type?: RelationshipType;
          label?: string | null;
          animated?: boolean;
          style?: string | null;
          from_block_id?: string;
          to_block_id?: string;
          workspace_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          content: string;
          resolved: boolean;
          position_x: number | null;
          position_y: number | null;
          block_id: string;
          author_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          resolved?: boolean;
          position_x?: number | null;
          position_y?: number | null;
          block_id: string;
          author_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          resolved?: boolean;
          position_x?: number | null;
          position_y?: number | null;
          block_id?: string;
          author_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      block_type: BlockType;
      company: Company;
      block_status: BlockStatus;
      relationship_type: RelationshipType;
    };
  };
}

// Helper types for API responses
export type DbBlock = Database["public"]["Tables"]["blocks"]["Row"];
export type DbBlockInsert = Database["public"]["Tables"]["blocks"]["Insert"];
export type DbBlockUpdate = Database["public"]["Tables"]["blocks"]["Update"];

export type DbConnection = Database["public"]["Tables"]["connections"]["Row"];
export type DbConnectionInsert = Database["public"]["Tables"]["connections"]["Insert"];
export type DbConnectionUpdate = Database["public"]["Tables"]["connections"]["Update"];

export type DbWorkspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type DbWorkspaceInsert = Database["public"]["Tables"]["workspaces"]["Insert"];
export type DbWorkspaceUpdate = Database["public"]["Tables"]["workspaces"]["Update"];

export type DbUser = Database["public"]["Tables"]["users"]["Row"];
export type DbComment = Database["public"]["Tables"]["comments"]["Row"];

/**
 * Convert snake_case database row to camelCase for frontend
 */
export function dbBlockToBlock(dbBlock: DbBlock) {
  return {
    id: dbBlock.id,
    type: dbBlock.type,
    company: dbBlock.company,
    status: dbBlock.status,
    title: dbBlock.title,
    subtitle: dbBlock.subtitle,
    content: dbBlock.content,
    tags: dbBlock.tags,
    positionX: dbBlock.position_x,
    positionY: dbBlock.position_y,
    width: dbBlock.width,
    height: dbBlock.height,
    externalUrl: dbBlock.external_url,
    order: dbBlock.order,
    createdAt: new Date(dbBlock.created_at),
    updatedAt: new Date(dbBlock.updated_at),
    workspaceId: dbBlock.workspace_id,
    parentId: dbBlock.parent_id,
  };
}

/**
 * Convert camelCase frontend block to snake_case for database
 */
export function blockToDbBlock(block: {
  type?: BlockType;
  company?: Company;
  status?: BlockStatus;
  title?: string;
  subtitle?: string | null;
  content?: string | null;
  tags?: string[];
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  externalUrl?: string | null;
  parentId?: string | null;
  workspaceId?: string;
}): DbBlockUpdate {
  const result: DbBlockUpdate = {};
  if (block.type !== undefined) result.type = block.type;
  if (block.company !== undefined) result.company = block.company;
  if (block.status !== undefined) result.status = block.status;
  if (block.title !== undefined) result.title = block.title;
  if (block.subtitle !== undefined) result.subtitle = block.subtitle;
  if (block.content !== undefined) result.content = block.content;
  if (block.tags !== undefined) result.tags = block.tags;
  if (block.positionX !== undefined) result.position_x = block.positionX;
  if (block.positionY !== undefined) result.position_y = block.positionY;
  if (block.width !== undefined) result.width = block.width;
  if (block.height !== undefined) result.height = block.height;
  if (block.externalUrl !== undefined) result.external_url = block.externalUrl;
  if (block.parentId !== undefined) result.parent_id = block.parentId;
  if (block.workspaceId !== undefined) result.workspace_id = block.workspaceId;
  return result;
}

/**
 * Convert snake_case database connection to camelCase for frontend
 */
export function dbConnectionToConnection(dbConn: DbConnection) {
  return {
    id: dbConn.id,
    relationshipType: dbConn.relationship_type,
    label: dbConn.label,
    animated: dbConn.animated,
    style: dbConn.style,
    fromBlockId: dbConn.from_block_id,
    toBlockId: dbConn.to_block_id,
    workspaceId: dbConn.workspace_id,
    createdAt: new Date(dbConn.created_at),
    updatedAt: new Date(dbConn.updated_at),
  };
}

/**
 * Convert snake_case database workspace to camelCase for frontend
 */
export function dbWorkspaceToWorkspace(dbWs: DbWorkspace) {
  return {
    id: dbWs.id,
    name: dbWs.name,
    description: dbWs.description,
    viewportX: dbWs.viewport_x,
    viewportY: dbWs.viewport_y,
    viewportZoom: dbWs.viewport_zoom,
    ownerId: dbWs.owner_id,
    createdAt: new Date(dbWs.created_at),
    updatedAt: new Date(dbWs.updated_at),
  };
}

