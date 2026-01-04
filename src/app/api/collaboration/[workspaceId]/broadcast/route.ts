import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceConnections } from "@/lib/collaboration-store";
import { logger } from "@/lib/logger";

/**
 * POST /api/collaboration/[workspaceId]/broadcast
 * Broadcast a message to all connected users in a workspace
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { workspaceId } = await params;
    const message = await request.json();

    // Get workspace connections
    const workspaceConns = getWorkspaceConnections(workspaceId);
    if (workspaceConns.size === 0) {
      return NextResponse.json({ success: true, recipients: 0 });
    }

    // Broadcast to all connected users (except sender)
    const senderId = message.userId;
    let recipients = 0;

    workspaceConns.forEach((controller, userId) => {
      if (userId !== senderId) {
        try {
          controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
          recipients++;
        } catch {
          // Connection might be closed, remove it
          workspaceConns.delete(userId);
        }
      }
    });

    logger.request("POST", `/api/collaboration/${workspaceId}/broadcast`, 200, Date.now() - startTime, {
      workspaceId,
      senderId,
      recipients,
    });

    return NextResponse.json({ success: true, recipients });
  } catch (error) {
    logger.error("Broadcast error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Failed to broadcast message" },
      { status: 500 }
    );
  }
}
