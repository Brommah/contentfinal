import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  demoUser,
  defaultWorkspace,
  allSeedBlocks,
  seedConnections,
} from "@/lib/seed-data";

/**
 * POST /api/seed - Seed the database with initial CERE/CEF content
 * WARNING: This will clear existing data!
 */
export async function POST() {
  try {
    // Clear existing data (in reverse order of dependencies)
    await db.comment.deleteMany();
    await db.connection.deleteMany();
    await db.block.deleteMany();
    await db.workspace.deleteMany();
    await db.user.deleteMany();

    // Create demo user
    const user = await db.user.create({
      data: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
      },
    });

    // Create default workspace
    const workspace = await db.workspace.create({
      data: {
        id: defaultWorkspace.id,
        name: defaultWorkspace.name,
        description: defaultWorkspace.description,
        ownerId: user.id,
        viewportX: defaultWorkspace.viewportX,
        viewportY: defaultWorkspace.viewportY,
        viewportZoom: defaultWorkspace.viewportZoom,
      },
    });

    // Create all blocks
    for (const block of allSeedBlocks) {
      await db.block.create({
        data: {
          id: block.id,
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

    // Create all connections
    for (const connection of seedConnections) {
      await db.connection.create({
        data: {
          id: connection.id,
          relationshipType: connection.relationshipType,
          label: connection.label,
          animated: connection.animated || false,
          fromBlockId: connection.fromBlockId,
          toBlockId: connection.toBlockId,
          workspaceId: workspace.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        blocks: allSeedBlocks.length,
        connections: seedConnections.length,
      },
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seed - Get seed status (check if data exists)
 */
export async function GET() {
  try {
    const counts = {
      users: await db.user.count(),
      workspaces: await db.workspace.count(),
      blocks: await db.block.count(),
      connections: await db.connection.count(),
    };

    return NextResponse.json({
      seeded: counts.blocks > 0,
      counts,
    });
  } catch (error) {
    console.error("Error checking seed status:", error);
    return NextResponse.json(
      { error: "Failed to check seed status" },
      { status: 500 }
    );
  }
}

