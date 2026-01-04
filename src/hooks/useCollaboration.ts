"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  CollaborationClient,
  getLocalUser,
  type Presence,
  type Cursor,
  type User,
} from "@/lib/collaboration";

interface UseCollaborationOptions {
  workspaceId: string;
  enabled?: boolean;
  onUpdate?: (update: unknown) => void;
}

// Default placeholder user for SSR
const PLACEHOLDER_USER: User = {
  id: "loading",
  name: "Loading...",
  color: "#6b7280",
};

interface UseCollaborationResult {
  user: User;
  presence: Presence[];
  cursors: Cursor[];
  isConnected: boolean;
  updateCursor: (x: number, y: number) => void;
  updateActiveBlock: (blockId: string | null) => void;
  broadcastUpdate: (update: unknown) => void;
}

/**
 * Hook for real-time collaboration features
 */
export function useCollaboration({
  workspaceId,
  enabled = true,
  onUpdate,
}: UseCollaborationOptions): UseCollaborationResult {
  // Start with placeholder to avoid hydration mismatch
  const [user, setUser] = useState<User>(PLACEHOLDER_USER);
  const [mounted, setMounted] = useState(false);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<CollaborationClient | null>(null);

  // Initialize user after mount to avoid hydration mismatch
  useEffect(() => {
    setUser(getLocalUser());
    setMounted(true);
  }, []);

  // Initialize collaboration client (only after mount and user is ready)
  useEffect(() => {
    if (!enabled || !workspaceId || !mounted || user.id === "loading") return;

    const client = new CollaborationClient(workspaceId, user);
    clientRef.current = client;

    // Subscribe to events
    const unsubPresence = client.on("presence", (data) => {
      setPresence(data as Presence[]);
    });

    const unsubCursors = client.on("cursors", (data) => {
      setCursors(data as Cursor[]);
    });

    const unsubUpdate = client.on("update", (data) => {
      onUpdate?.(data);
    });

    // Connect
    client.connect();
    setIsConnected(true);

    // Cleanup
    return () => {
      unsubPresence();
      unsubCursors();
      unsubUpdate();
      client.disconnect();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [workspaceId, enabled, user, onUpdate, mounted]);

  // Cursor tracking
  const updateCursor = useCallback((x: number, y: number) => {
    clientRef.current?.updateCursor(x, y);
  }, []);

  // Active block tracking
  const updateActiveBlock = useCallback((blockId: string | null) => {
    clientRef.current?.updateActiveBlock(blockId);
  }, []);

  // Broadcast updates
  const broadcastUpdate = useCallback((update: unknown) => {
    clientRef.current?.broadcastUpdate(update);
  }, []);

  return {
    user,
    presence,
    cursors,
    isConnected,
    updateCursor,
    updateActiveBlock,
    broadcastUpdate,
  };
}

