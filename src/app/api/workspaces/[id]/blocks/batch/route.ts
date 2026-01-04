import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const blockSchema = z.object({
  id: z.string(),
  type: z.enum([
    "COMPANY",
    "CORE_VALUE_PROP",
    "PAIN_POINT",
    "SOLUTION",
    "FEATURE",
    "VERTICAL",
    "ARTICLE",
    "TECH_COMPONENT",
  ]),
  company: z.enum(["CERE", "CEF", "SHARED"]),
  status: z.enum(["LIVE", "VISION", "DRAFT", "ARCHIVED"]),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  positionX: z.number(),
  positionY: z.number(),
  width: z.number().default(280),
  height: z.number().default(120),
  externalUrl: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

const batchBlocksSchema = z.object({
  blocks: z.array(blockSchema),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/workspaces/[id]/blocks/batch - Upsert multiple blocks
 * Creates new blocks or updates existing ones
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: workspaceId } = await params;
    const body = await request.json();
    const { blocks } = batchBlocksSchema.parse(body);

    // Get existing block IDs
    const existingBlocks = await db.block.findMany({
      where: { workspaceId },
    });
    const existingIds = new Set(existingBlocks.map((b) => b.id));

    // Separate creates and updates
    const toCreate = blocks.filter((b) => !existingIds.has(b.id));
    const toUpdate = blocks.filter((b) => existingIds.has(b.id));

    // Find blocks to delete (in DB but not in incoming data)
    const incomingIds = new Set(blocks.map((b) => b.id));
    const toDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));

    // Execute operations
    const operations: Promise<unknown>[] = [];

    // Delete removed blocks
    for (const id of toDelete) {
      operations.push(db.block.delete({ where: { id } }));
    }

    // Create new blocks
    for (const block of toCreate) {
      operations.push(
        db.block.create({
          data: {
            id: block.id,
            type: block.type,
            company: block.company,
            status: block.status,
            title: block.title,
            subtitle: block.subtitle ?? null,
            content: block.content ?? null,
            tags: block.tags,
            positionX: block.positionX,
            positionY: block.positionY,
            width: block.width,
            height: block.height,
            externalUrl: block.externalUrl ?? null,
            parentId: block.parentId ?? null,
            workspaceId,
          },
        })
      );
    }

    // Update existing blocks
    for (const block of toUpdate) {
      operations.push(
        db.block.update({
          where: { id: block.id },
          data: {
            type: block.type,
            company: block.company,
            status: block.status,
            title: block.title,
            subtitle: block.subtitle ?? null,
            content: block.content ?? null,
            tags: block.tags,
            positionX: block.positionX,
            positionY: block.positionY,
            width: block.width,
            height: block.height,
            externalUrl: block.externalUrl ?? null,
            parentId: block.parentId ?? null,
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
    console.error("Error batch saving blocks:", error);
    return NextResponse.json(
      { error: "Failed to save blocks" },
      { status: 500 }
    );
  }
}
