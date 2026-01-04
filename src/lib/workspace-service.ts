/**
 * Workspace Service - Manages workspace creation and access.
 * Handles the creation of user workspaces and initial data setup.
 */

import { db } from "./db";
import { allSeedBlocks, seedConnections } from "./seed-data";
import { nanoid } from "nanoid";

export interface WorkspaceCreateInput {
  name: string;
  description?: string;
  ownerId: string;
}

/**
 * Create a new workspace for a user.
 */
export async function createWorkspace(input: WorkspaceCreateInput) {
  const workspace = await db.workspace.create({
    data: {
      id: nanoid(),
      name: input.name,
      description: input.description || null,
      ownerId: input.ownerId,
      viewportX: 0,
      viewportY: 0,
      viewportZoom: 1,
    },
  });

  return workspace;
}

/**
 * Create a workspace with seed data for new users.
 */
export async function createWorkspaceWithSeedData(
  ownerId: string,
  name: string = "My Workspace"
) {
  // Create the workspace
  const workspace = await createWorkspace({
    name,
    description: "Content architecture workspace",
    ownerId,
  });

  // Create all seed blocks
  for (const block of allSeedBlocks) {
    await db.block.create({
      data: {
        id: nanoid(),
        type: block.type,
        company: block.company,
        status: block.status,
        title: block.title,
        subtitle: block.subtitle,
        content: block.content,
        tags: block.tags,
        positionX: block.positionX,
        positionY: block.positionY,
        workspaceId: workspace.id,
      },
    });
  }

  // Create connection mapping (old IDs to new IDs)
  const blockIdMap = new Map<string, string>();
  const blocks = await db.block.findMany({
    where: { workspaceId: workspace.id },
  });

  // Build ID mapping based on titles (since we generated new IDs)
  for (const seedBlock of allSeedBlocks) {
    const matchingBlock = blocks.find((b) => b.title === seedBlock.title);
    if (matchingBlock) {
      blockIdMap.set(seedBlock.id, matchingBlock.id);
    }
  }

  // Create connections with mapped IDs
  for (const connection of seedConnections) {
    const fromBlockId = blockIdMap.get(connection.fromBlockId);
    const toBlockId = blockIdMap.get(connection.toBlockId);

    if (fromBlockId && toBlockId) {
      await db.connection.create({
        data: {
          id: nanoid(),
          relationshipType: connection.relationshipType,
          label: connection.label,
          animated: connection.animated || false,
          fromBlockId,
          toBlockId,
          workspaceId: workspace.id,
        },
      });
    }
  }

  return workspace;
}

/**
 * Get all workspaces for a user.
 */
export async function getUserWorkspaces(userId: string) {
  return db.workspace.findMany({
    where: { ownerId: userId },
  });
}

/**
 * Get or create a default workspace for a user.
 */
export async function getOrCreateDefaultWorkspace(userId: string) {
  // Check if user has any workspaces
  const workspaces = await getUserWorkspaces(userId);

  if (workspaces.length > 0) {
    return workspaces[0];
  }

  // Create a new workspace with seed data
  return createWorkspaceWithSeedData(userId);
}

/**
 * Check if a user has access to a workspace.
 */
export async function canAccessWorkspace(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    return false;
  }

  // For now, only the owner can access
  // In the future, add collaborator support
  return workspace.ownerId === userId;
}


