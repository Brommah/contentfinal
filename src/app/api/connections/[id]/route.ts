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

const updateConnectionSchema = z.object({
  relationshipType: relationshipTypeEnum.optional(),
  label: z.string().max(100).nullable().optional(),
  animated: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/connections/[id] - Get a single connection
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const connection = await db.connection.findUnique({
      where: { id },
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

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(connection);
  } catch (error) {
    console.error("Error fetching connection:", error);
    return NextResponse.json(
      { error: "Failed to fetch connection" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/connections/[id] - Update a connection
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateConnectionSchema.parse(body);

    const connection = await db.connection.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json(connection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating connection:", error);
    return NextResponse.json(
      { error: "Failed to update connection" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/connections/[id] - Delete a connection
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await db.connection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting connection:", error);
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }
}

