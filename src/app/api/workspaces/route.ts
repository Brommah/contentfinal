import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// Validation schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  ownerId: z.string().min(1),
});

/**
 * GET /api/workspaces - List all workspaces
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");

    const workspaces = await db.workspace.findMany({
      where: ownerId ? { ownerId } : undefined,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            blocks: true,
            connections: true,
          },
        },
      },
    });

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces - Create a new workspace
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createWorkspaceSchema.parse(body);

    const workspace = await db.workspace.create({
      data: {
        name: validated.name,
        description: validated.description,
        ownerId: validated.ownerId,
      },
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}

