/**
 * Database client module
 * Uses Supabase for PostgreSQL database operations
 */

import { supabase } from "./supabase";
import {
  dbBlockToBlock,
  blockToDbBlock,
  dbConnectionToConnection,
  dbWorkspaceToWorkspace,
  type DbBlockInsert,
  type DbConnectionInsert,
  type DbWorkspaceInsert,
  type BlockType,
  type Company,
  type BlockStatus,
  type RelationshipType,
} from "./database.types";

// Block operations
const blockOperations = {
  async findMany(options?: {
    where?: {
      workspaceId?: string;
      type?: BlockType;
      company?: Company;
    };
    orderBy?: { createdAt?: "asc" | "desc" };
    select?: Record<string, boolean>;
  }) {
    let query = supabase.from("blocks").select("*");

    if (options?.where?.workspaceId) {
      query = query.eq("workspace_id", options.where.workspaceId);
    }
    if (options?.where?.type) {
      query = query.eq("type", options.where.type);
    }
    if (options?.where?.company) {
      query = query.eq("company", options.where.company);
    }

    if (options?.orderBy?.createdAt) {
      query = query.order("created_at", {
        ascending: options.orderBy.createdAt === "asc",
      });
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(dbBlockToBlock);
  },

  async findUnique(options: { where: { id: string }; include?: Record<string, unknown> }) {
    const { data, error } = await supabase
      .from("blocks")
      .select("*")
      .eq("id", options.where.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data ? dbBlockToBlock(data) : null;
  },

  async create(options: {
    data: {
      id?: string;
      type: BlockType;
      company: Company;
      status?: BlockStatus;
      title: string;
      subtitle?: string | null;
      content?: string | null;
      tags?: string[];
      positionX?: number;
      positionY?: number;
      width?: number;
      height?: number;
      externalUrl?: string | null;
      parentId?: string | null;
      workspaceId: string;
    };
  }) {
    const insertData: DbBlockInsert = {
      type: options.data.type,
      company: options.data.company,
      status: options.data.status || "DRAFT",
      title: options.data.title,
      subtitle: options.data.subtitle,
      content: options.data.content,
      tags: options.data.tags || [],
      position_x: options.data.positionX ?? 0,
      position_y: options.data.positionY ?? 0,
      width: options.data.width ?? 280,
      height: options.data.height ?? 120,
      external_url: options.data.externalUrl,
      parent_id: options.data.parentId,
      workspace_id: options.data.workspaceId,
    };

    // Add id if provided
    if (options.data.id) {
      insertData.id = options.data.id;
    }

    const { data, error } = await supabase
      .from("blocks")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return dbBlockToBlock(data);
  },

  async update(options: {
    where: { id: string };
    data: {
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
    };
  }) {
    const updateData = blockToDbBlock(options.data);
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("blocks")
      .update(updateData)
      .eq("id", options.where.id)
      .select()
      .single();

    if (error) throw error;
    return dbBlockToBlock(data);
  },

  async delete(options: { where: { id: string } }) {
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("id", options.where.id);

    if (error) throw error;
    return { success: true };
  },

  async count() {
    const { count, error } = await supabase
      .from("blocks")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return count || 0;
  },

  async deleteMany() {
    const { error } = await supabase.from("blocks").delete().neq("id", "");
    if (error) throw error;
    return { count: 0 };
  },
};

// Connection operations
const connectionOperations = {
  async findMany(options?: {
    where?: {
      workspaceId?: string;
      OR?: Array<{ fromBlockId?: string; toBlockId?: string }>;
    };
    include?: Record<string, unknown>;
    select?: Record<string, boolean>;
  }) {
    let query = supabase.from("connections").select("*");

    if (options?.where?.workspaceId) {
      query = query.eq("workspace_id", options.where.workspaceId);
    }

    if (options?.where?.OR) {
      const blockId = options.where.OR[0]?.fromBlockId || options.where.OR[1]?.toBlockId;
      if (blockId) {
        query = query.or(`from_block_id.eq.${blockId},to_block_id.eq.${blockId}`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(dbConnectionToConnection);
  },

  async findUnique(options: {
    where:
      | { id: string }
      | {
          fromBlockId_toBlockId_relationshipType: {
            fromBlockId: string;
            toBlockId: string;
            relationshipType: RelationshipType;
          };
        };
    include?: Record<string, unknown>;
  }) {
    let query = supabase.from("connections").select("*");

    if ("id" in options.where) {
      query = query.eq("id", options.where.id);
    } else if ("fromBlockId_toBlockId_relationshipType" in options.where) {
      const { fromBlockId, toBlockId, relationshipType } =
        options.where.fromBlockId_toBlockId_relationshipType;
      query = query
        .eq("from_block_id", fromBlockId)
        .eq("to_block_id", toBlockId)
        .eq("relationship_type", relationshipType);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    return data ? dbConnectionToConnection(data) : null;
  },

  async create(options: {
    data: {
      id?: string;
      relationshipType: RelationshipType;
      label?: string | null;
      animated?: boolean;
      fromBlockId: string;
      toBlockId: string;
      workspaceId: string;
    };
    include?: Record<string, unknown>;
  }) {
    const insertData: DbConnectionInsert = {
      relationship_type: options.data.relationshipType,
      label: options.data.label,
      animated: options.data.animated ?? false,
      from_block_id: options.data.fromBlockId,
      to_block_id: options.data.toBlockId,
      workspace_id: options.data.workspaceId,
    };

    // Add id if provided
    if (options.data.id) {
      insertData.id = options.data.id;
    }

    const { data, error } = await supabase
      .from("connections")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return dbConnectionToConnection(data);
  },

  async update(options: {
    where: { id: string };
    data: {
      relationshipType?: RelationshipType;
      label?: string | null;
      animated?: boolean;
    };
  }) {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (options.data.relationshipType !== undefined) {
      updateData.relationship_type = options.data.relationshipType;
    }
    if (options.data.label !== undefined) {
      updateData.label = options.data.label;
    }
    if (options.data.animated !== undefined) {
      updateData.animated = options.data.animated;
    }

    const { data, error } = await supabase
      .from("connections")
      .update(updateData)
      .eq("id", options.where.id)
      .select()
      .single();

    if (error) throw error;
    return dbConnectionToConnection(data);
  },

  async delete(options: { where: { id: string } }) {
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", options.where.id);

    if (error) throw error;
    return { success: true };
  },

  async count() {
    const { count, error } = await supabase
      .from("connections")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return count || 0;
  },

  async deleteMany() {
    const { error } = await supabase.from("connections").delete().neq("id", "");
    if (error) throw error;
    return { count: 0 };
  },
};

// Workspace operations
const workspaceOperations = {
  async findMany(options?: {
    where?: { ownerId?: string };
    orderBy?: { updatedAt?: "asc" | "desc" };
    include?: { _count?: { select?: { blocks?: boolean; connections?: boolean } } };
  }) {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("updated_at", {
        ascending: options?.orderBy?.updatedAt === "asc",
      });

    if (error) throw error;

    const workspaces = (data || []).map(dbWorkspaceToWorkspace);

    if (options?.include?._count) {
      return workspaces.map((ws) => ({
        ...ws,
        _count: { blocks: 0, connections: 0 },
      }));
    }

    return workspaces;
  },

  async findUnique(options: {
    where: { id: string };
    include?: { blocks?: boolean; connections?: boolean };
  }) {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", options.where.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    const workspace = data ? dbWorkspaceToWorkspace(data) : null;

    if (workspace && options.include) {
      const result: Record<string, unknown> = { ...workspace };

      if (options.include.blocks) {
        const { data: blocks } = await supabase
          .from("blocks")
          .select("*")
          .eq("workspace_id", options.where.id);
        result.blocks = (blocks || []).map(dbBlockToBlock);
      }

      if (options.include.connections) {
        const { data: connections } = await supabase
          .from("connections")
          .select("*")
          .eq("workspace_id", options.where.id);
        result.connections = (connections || []).map(dbConnectionToConnection);
      }

      return result;
    }

    return workspace;
  },

  async create(options: {
    data: {
      id?: string;
      name: string;
      description?: string | null;
      ownerId: string;
      viewportX?: number;
      viewportY?: number;
      viewportZoom?: number;
    };
  }) {
    const insertData: DbWorkspaceInsert = {
      name: options.data.name,
      description: options.data.description,
      owner_id: options.data.ownerId,
      viewport_x: options.data.viewportX ?? 0,
      viewport_y: options.data.viewportY ?? 0,
      viewport_zoom: options.data.viewportZoom ?? 1,
    };

    // Add id if provided
    if (options.data.id) {
      insertData.id = options.data.id;
    }

    const { data, error } = await supabase
      .from("workspaces")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return dbWorkspaceToWorkspace(data);
  },

  async update(options: {
    where: { id: string };
    data: {
      name?: string;
      description?: string | null;
      viewportX?: number;
      viewportY?: number;
      viewportZoom?: number;
    };
  }) {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (options.data.name !== undefined) updateData.name = options.data.name;
    if (options.data.description !== undefined)
      updateData.description = options.data.description;
    if (options.data.viewportX !== undefined)
      updateData.viewport_x = options.data.viewportX;
    if (options.data.viewportY !== undefined)
      updateData.viewport_y = options.data.viewportY;
    if (options.data.viewportZoom !== undefined)
      updateData.viewport_zoom = options.data.viewportZoom;

    const { data, error } = await supabase
      .from("workspaces")
      .update(updateData)
      .eq("id", options.where.id)
      .select()
      .single();

    if (error) throw error;
    return dbWorkspaceToWorkspace(data);
  },

  async delete(options: { where: { id: string } }) {
    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", options.where.id);

    if (error) throw error;
    return { success: true };
  },

  async count() {
    const { count, error } = await supabase
      .from("workspaces")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return count || 0;
  },

  async deleteMany() {
    const { error } = await supabase.from("workspaces").delete().neq("id", "");
    if (error) throw error;
    return { count: 0 };
  },
};

// User operations
const userOperations = {
  async count() {
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return count || 0;
  },

  async create(options: {
    data: {
      id?: string;
      email: string;
      name?: string | null;
      avatar?: string | null;
    };
  }): Promise<{ id: string; email: string; name?: string | null; avatar?: string | null }> {
    const insertData: Record<string, unknown> = {
      email: options.data.email,
      name: options.data.name,
      avatar: options.data.avatar,
    };
    if (options.data.id) {
      insertData.id = options.data.id;
    }

    const { data, error } = await supabase
      .from("users")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data as { id: string; email: string; name?: string | null; avatar?: string | null };
  },

  async deleteMany() {
    const { error } = await supabase.from("users").delete().neq("id", "");
    if (error) throw error;
    return { count: 0 };
  },
};

// Comment operations
const commentOperations = {
  async count() {
    const { count, error } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return count || 0;
  },

  async deleteMany() {
    const { error } = await supabase.from("comments").delete().neq("id", "");
    if (error) throw error;
    return { count: 0 };
  },
};

/**
 * Database abstraction layer for Content Visualizer
 * Provides Prisma-like API on top of Supabase
 */
export const db = {
  block: blockOperations,
  connection: connectionOperations,
  workspace: workspaceOperations,
  user: userOperations,
  comment: commentOperations,

  /**
   * Transaction support - executes multiple operations
   * Note: Supabase doesn't have native transaction support like Prisma,
   * but we can batch operations for bulk updates
   */
  async $transaction<T>(operations: Promise<T>[]): Promise<T[]> {
    return Promise.all(operations);
  },
};

export default db;
