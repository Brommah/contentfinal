/**
 * Collaboration Store
 * In-memory storage for active WebSocket/SSE connections.
 * In production, use Redis or another distributed store.
 */

// Store for active connections by workspace
export const connections = new Map<string, Map<string, ReadableStreamDefaultController>>();

/**
 * Get or create connections map for a workspace.
 */
export function getWorkspaceConnections(workspaceId: string) {
  if (!connections.has(workspaceId)) {
    connections.set(workspaceId, new Map());
  }
  return connections.get(workspaceId)!;
}

/**
 * Remove a connection from a workspace.
 */
export function removeConnection(workspaceId: string, userId: string) {
  const workspaceConns = connections.get(workspaceId);
  if (workspaceConns) {
    workspaceConns.delete(userId);
    if (workspaceConns.size === 0) {
      connections.delete(workspaceId);
    }
  }
}

/**
 * Broadcast a message to all connections in a workspace.
 */
export function broadcastToWorkspace(
  workspaceId: string,
  message: object,
  excludeUserId?: string
) {
  const workspaceConns = getWorkspaceConnections(workspaceId);
  const messageStr = `data: ${JSON.stringify(message)}\n\n`;

  workspaceConns.forEach((controller, userId) => {
    if (excludeUserId && userId === excludeUserId) return;
    
    try {
      controller.enqueue(messageStr);
    } catch {
      // Connection might be closed, remove it
      workspaceConns.delete(userId);
    }
  });
}


