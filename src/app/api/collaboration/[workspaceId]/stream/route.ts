import { NextRequest } from "next/server";
import { getWorkspaceConnections, broadcastToWorkspace } from "@/lib/collaboration-store";

/**
 * GET /api/collaboration/[workspaceId]/stream
 * Server-Sent Events endpoint for real-time collaboration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const userId = request.nextUrl.searchParams.get("userId") || "anonymous";

  // Create a new readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this connection
      const workspaceConns = getWorkspaceConnections(workspaceId);
      workspaceConns.set(userId, controller);

      // Send initial connection message
      const message = JSON.stringify({
        type: "connected",
        userId,
        workspaceId,
        timestamp: Date.now(),
        payload: { connectedUsers: workspaceConns.size },
      });
      controller.enqueue(`data: ${message}\n\n`);

      // Notify other users of the new connection
      broadcastToWorkspace(
        workspaceId,
        {
          type: "join",
          userId,
          workspaceId,
          timestamp: Date.now(),
          payload: { userId },
        },
        userId
      );
    },
    cancel() {
      // Remove the connection when closed
      const workspaceConns = getWorkspaceConnections(workspaceId);
      workspaceConns.delete(userId);

      // Notify other users of the disconnection
      broadcastToWorkspace(workspaceId, {
        type: "leave",
        userId,
        workspaceId,
        timestamp: Date.now(),
        payload: {},
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
