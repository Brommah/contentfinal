import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// Validation schemas
const blockTypeEnum = z.enum([
  "COMPANY",
  "PAGE_ROOT",
  "CORE_VALUE_PROP",
  "PAIN_POINT",
  "SOLUTION",
  "FEATURE",
  "VERTICAL",
  "ARTICLE",
  "TECH_COMPONENT",
]);

const companyEnum = z.enum(["CERE", "CEF", "SHARED"]);
const statusEnum = z.enum(["LIVE", "VISION", "DRAFT", "ARCHIVED"]);

const updateBlockSchema = z.object({
  type: blockTypeEnum.optional(),
  company: companyEnum.optional(),
  status: statusEnum.optional(),
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(500).nullable().optional(),
  content: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  externalUrl: z.string().url().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/blocks/[id] - Get a single block
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const block = await db.block.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        connectionsFrom: {
          include: {
            toBlock: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
        connectionsTo: {
          include: {
            fromBlock: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!block) {
      return NextResponse.json(
        { error: "Block not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(block);
  } catch (error) {
    console.error("Error fetching block:", error);
    return NextResponse.json(
      { error: "Failed to fetch block" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/blocks/[id] - Update a block
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateBlockSchema.parse(body);

    const block = await db.block.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json(block);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating block:", error);
    return NextResponse.json(
      { error: "Failed to update block" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blocks/[id] - Delete a block
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await db.block.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting block:", error);
    return NextResponse.json(
      { error: "Failed to delete block" },
      { status: 500 }
    );
  }
}

