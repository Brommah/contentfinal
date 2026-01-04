import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// Validation schemas
const relationshipTypeEnum = z.enum([
  "FLOWS_INTO",
  "SOLVES",
  "DEPENDS_ON",
  "REFERENCES",
  "ENABLES",
  "PART_OF",
]);

const createConnectionSchema = z.object({
  relationshipType: relationshipTypeEnum,
  label: z.string().max(100).optional(),
  animated: z.boolean().optional().default(false),
  fromBlockId: z.string().min(1),
  toBlockId: z.string().min(1),
  workspaceId: z.string().min(1),
});

/**
 * GET /api/connections - List connections (optionally filtered by workspace)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const blockId = searchParams.get("blockId");

    const connections = await db.connection.findMany({
      where: {
        ...(workspaceId && { workspaceId }),
        ...(blockId && {
          OR: [
            { fromBlockId: blockId },
            { toBlockId: blockId },
          ],
        }),
      },
      include: {
        fromBlock: {
          select: {
            id: true,
            title: true,
            type: true,
            company: true,
          },
        },
        toBlock: {
          select: {
            id: true,
            title: true,
            type: true,
            company: true,
          },
        },
      },
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/connections - Create a new connection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createConnectionSchema.parse(body);

    // Check if connection already exists
    const existing = await db.connection.findUnique({
      where: {
        fromBlockId_toBlockId_relationshipType: {
          fromBlockId: validated.fromBlockId,
          toBlockId: validated.toBlockId,
          relationshipType: validated.relationshipType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Connection already exists" },
        { status: 409 }
      );
    }

    const connection = await db.connection.create({
      data: {
        relationshipType: validated.relationshipType,
        label: validated.label,
        animated: validated.animated,
        fromBlockId: validated.fromBlockId,
        toBlockId: validated.toBlockId,
        workspaceId: validated.workspaceId,
      },
      include: {
        fromBlock: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        toBlock: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating connection:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
}

