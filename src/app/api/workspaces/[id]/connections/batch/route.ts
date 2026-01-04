import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const connectionSchema = z.object({
  id: z.string(),
  fromBlockId: z.string(),
  toBlockId: z.string(),
  relationshipType: z.enum([
    "FLOWS_INTO",
    "SOLVES",
    "DEPENDS_ON",
    "REFERENCES",
    "ENABLES",
    "PART_OF",
  ]),
  label: z.string().nullable().optional(),
  animated: z.boolean().default(false),
});

const batchConnectionsSchema = z.object({
  connections: z.array(connectionSchema),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/workspaces/[id]/connections/batch - Upsert multiple connections
 * Creates new connections or updates existing ones
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params;
    const body = await request.json();
    const { connections } = batchConnectionsSchema.parse(body);

    // Get existing connection IDs
    const existingConnections = await db.connection.findMany({
      where: { workspaceId },
    });
    const existingIds = new Set(existingConnections.map((c) => c.id));

    // Separate creates and updates
    const toCreate = connections.filter((c) => !existingIds.has(c.id));
    const toUpdate = connections.filter((c) => existingIds.has(c.id));

    // Find connections to delete
    const incomingIds = new Set(connections.map((c) => c.id));
    const toDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));

    // Execute operations
    const operations: Promise<unknown>[] = [];

    // Delete removed connections
    for (const id of toDelete) {
      operations.push(db.connection.delete({ where: { id } }));
    }

    // Create new connections
    for (const conn of toCreate) {
      operations.push(
        db.connection.create({
          data: {
            id: conn.id,
            fromBlockId: conn.fromBlockId,
            toBlockId: conn.toBlockId,
            relationshipType: conn.relationshipType,
            label: conn.label ?? null,
            animated: conn.animated,
            workspaceId,
          },
        })
      );
    }

    // Update existing connections
    for (const conn of toUpdate) {
      operations.push(
        db.connection.update({
          where: { id: conn.id },
          data: {
            relationshipType: conn.relationshipType,
            label: conn.label ?? null,
            animated: conn.animated,
          },
        })
      );
    }

    await db.$transaction(operations);

    return NextResponse.json({
      success: true,
      created: toCreate.length,
      updated: toUpdate.length,
      deleted: toDelete.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error batch saving connections:", error);
    return NextResponse.json(
      { error: "Failed to save connections" },
      { status: 500 }
    );
  }
}
