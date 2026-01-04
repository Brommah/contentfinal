/**
 * Real-time Collaboration System
 * Uses Server-Sent Events (SSE) for real-time updates and presence
 */

import { nanoid } from "nanoid";

// Types
export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
}

export interface Cursor {
  userId: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface Presence {
  user: User;
  cursor?: Cursor;
  activeBlockId?: string | null;
  lastSeen: number;
}

export interface CollaborationMessage {
  type: "presence" | "cursor" | "update" | "join" | "leave";
  userId: string;
  workspaceId: string;
  payload: unknown;
  timestamp: number;
}

// Generate a random color for user
function generateUserColor(): string {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#84cc16", // lime
    "#22c55e", // green
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#a855f7", // purple
    "#ec4899", // pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Local user storage
const LOCAL_USER_KEY = "content-visualizer-user";

export function getLocalUser(): User {
  if (typeof window === "undefined") {
    return { id: "server", name: "Server", color: "#666" };
  }

  try {
    const stored = localStorage.getItem(LOCAL_USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }

  const user: User = {
    id: nanoid(),
    name: `User ${Math.floor(Math.random() * 1000)}`,
    color: generateUserColor(),
  };

  try {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore
  }

  return user;
}

export function updateLocalUser(updates: Partial<User>): User {
  const current = getLocalUser();
  const updated = { ...current, ...updates };
  try {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}

/**
 * Collaboration client for real-time sync
 */
export class CollaborationClient {
  private workspaceId: string;
  private user: User;
  private eventSource: EventSource | null = null;
  private presence: Map<string, Presence> = new Map();
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(workspaceId: string, user?: User) {
    this.workspaceId = workspaceId;
    this.user = user || getLocalUser();

    // Setup broadcast channel for cross-tab sync
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.broadcastChannel = new BroadcastChannel(`workspace-${workspaceId}`);
      this.broadcastChannel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    }
  }

  /**
   * Connect to the collaboration server
   */
  connect(): void {
    if (typeof window === "undefined") return;

    // Connect to SSE endpoint
    this.eventSource = new EventSource(
      `/api/collaboration/${this.workspaceId}/stream?userId=${this.user.id}`
    );

    this.eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as CollaborationMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    this.eventSource.onerror = () => {
      console.warn("SSE connection error, reconnecting...");
      // EventSource will auto-reconnect
    };

    // Send join message
    this.send({
      type: "join",
      userId: this.user.id,
      workspaceId: this.workspaceId,
      payload: { user: this.user },
      timestamp: Date.now(),
    });

    // Start heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: "presence",
        userId: this.user.id,
        workspaceId: this.workspaceId,
        payload: { lastSeen: Date.now() },
        timestamp: Date.now(),
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Disconnect from the collaboration server
   */
  disconnect(): void {
    // Send leave message
    this.send({
      type: "leave",
      userId: this.user.id,
      workspaceId: this.workspaceId,
      payload: {},
      timestamp: Date.now(),
    });

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }

  /**
   * Send a message to the collaboration server
   */
  private async send(message: CollaborationMessage): Promise<void> {
    // Broadcast to other tabs
    this.broadcastChannel?.postMessage(message);

    // Send to server
    try {
      await fetch(`/api/collaboration/${this.workspaceId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.warn("Failed to send collaboration message:", error);
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: CollaborationMessage): void {
    if (message.userId === this.user.id) return; // Ignore own messages

    switch (message.type) {
      case "join":
        const joinPayload = message.payload as { user: User };
        this.presence.set(message.userId, {
          user: joinPayload.user,
          lastSeen: message.timestamp,
        });
        this.emit("presence", this.getPresence());
        break;

      case "leave":
        this.presence.delete(message.userId);
        this.emit("presence", this.getPresence());
        break;

      case "presence":
        const presencePayload = message.payload as Partial<Presence>;
        const existing = this.presence.get(message.userId);
        if (existing) {
          this.presence.set(message.userId, {
            ...existing,
            ...presencePayload,
            lastSeen: message.timestamp,
          });
          this.emit("presence", this.getPresence());
        }
        break;

      case "cursor":
        const cursorPayload = message.payload as Cursor;
        const cursorUser = this.presence.get(message.userId);
        if (cursorUser) {
          cursorUser.cursor = cursorPayload;
          this.emit("cursors", this.getCursors());
        }
        break;

      case "update":
        this.emit("update", message.payload);
        break;
    }
  }

  /**
   * Update cursor position
   */
  updateCursor(x: number, y: number): void {
    this.send({
      type: "cursor",
      userId: this.user.id,
      workspaceId: this.workspaceId,
      payload: { userId: this.user.id, x, y, timestamp: Date.now() },
      timestamp: Date.now(),
    });
  }

  /**
   * Update which block the user is editing
   */
  updateActiveBlock(blockId: string | null): void {
    this.send({
      type: "presence",
      userId: this.user.id,
      workspaceId: this.workspaceId,
      payload: { activeBlockId: blockId },
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast a content update
   */
  broadcastUpdate(update: unknown): void {
    this.send({
      type: "update",
      userId: this.user.id,
      workspaceId: this.workspaceId,
      payload: update,
      timestamp: Date.now(),
    });
  }

  /**
   * Get current presence list
   */
  getPresence(): Presence[] {
    const now = Date.now();
    const timeout = 60000; // 1 minute timeout

    // Filter out stale presence
    return Array.from(this.presence.values()).filter(
      (p) => now - p.lastSeen < timeout
    );
  }

  /**
   * Get current cursors
   */
  getCursors(): Cursor[] {
    const now = Date.now();
    const timeout = 5000; // 5 second cursor timeout

    return Array.from(this.presence.values())
      .filter((p) => p.cursor && now - p.cursor.timestamp < timeout)
      .map((p) => p.cursor!);
  }

  /**
   * Get current user
   */
  getUser(): User {
    return this.user;
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit an event to listeners
   */
  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }
}


