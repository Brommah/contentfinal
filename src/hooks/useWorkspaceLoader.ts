"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useCanvasStore } from "@/lib/store";
import {
  allSeedBlocks,
  seedConnections,
  defaultWorkspace,
} from "@/lib/seed-data";
import type { BlockData, ConnectionData } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase";

interface WorkspaceData {
  id: string;
  name: string;
  blocks: BlockData[];
  connections: ConnectionData[];
}

interface UseWorkspaceLoaderReturn {
  isLoading: boolean;
  isAuthenticated: boolean;
  workspaceId: string;
  workspaceName: string;
  error: string | null;
  isDemoMode: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

// Storage key for guest workspace ID
const GUEST_WORKSPACE_KEY = "content_visualizer_guest_workspace_id";

/**
 * Get or create a persistent guest workspace ID.
 * This enables Supabase persistence for anonymous users.
 */
function getGuestWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  
  let guestId = localStorage.getItem(GUEST_WORKSPACE_KEY);
  if (!guestId) {
    // Generate a new guest ID (UUID-like format for Supabase compatibility)
    guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(GUEST_WORKSPACE_KEY, guestId);
  }
  return guestId;
}

/**
 * Hook for loading workspace data.
 * - Authenticated users: Load from Supabase with user ID
 * - Unauthenticated users: Load from Supabase with guest workspace (persisted)
 * - Fallback to localStorage only if Supabase is not configured
 */
export function useWorkspaceLoader(): UseWorkspaceLoaderReturn {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { setWorkspace, loadFromData } = useCanvasStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>("demo");
  const [workspaceName, setWorkspaceName] = useState<string>(defaultWorkspace.name);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load workspace data from Supabase or create new
  const loadFromSupabase = useCallback(async (userId: string, isGuest: boolean) => {
    // Try to load existing workspace
    const response = await fetch(`/api/workspaces?userId=${userId}`);
    
    if (response.ok) {
      const workspaces: WorkspaceData[] = await response.json();
      
      if (workspaces.length > 0) {
        const workspace = workspaces[0];
        
        // Load workspace blocks and connections
        const [blocksRes, connectionsRes] = await Promise.all([
          fetch(`/api/blocks?workspaceId=${workspace.id}`),
          fetch(`/api/connections?workspaceId=${workspace.id}`),
        ]);

        const blocks = blocksRes.ok ? await blocksRes.json() : [];
        const connections = connectionsRes.ok ? await connectionsRes.json() : [];

        return {
          id: workspace.id,
          name: workspace.name,
          blocks: blocks as BlockData[],
          connections: connections as ConnectionData[],
        };
      }
    }

    // No workspace found - create new one with seed data
    const createResponse = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: isGuest ? `${defaultWorkspace.name} (Guest)` : defaultWorkspace.name,
        description: defaultWorkspace.description,
        ownerId: userId,
        seedData: true,
      }),
    });

    if (createResponse.ok) {
      const newWorkspace = await createResponse.json();
      
      // Return with seed data
      const blocks: BlockData[] = allSeedBlocks.map((block) => ({
        ...block,
        width: 280,
        height: 120,
        externalUrl: null,
        parentId: null,
        workspaceId: newWorkspace.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const connections: ConnectionData[] = seedConnections.map((conn) => ({
        ...conn,
        animated: conn.animated ?? false,
        style: null,
        workspaceId: newWorkspace.id,
      }));

      // Save seed data to the new workspace
      await Promise.all([
        fetch(`/api/workspaces/${newWorkspace.id}/blocks/batch`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks }),
        }),
        fetch(`/api/workspaces/${newWorkspace.id}/connections/batch`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connections }),
        }),
      ]);

      return {
        id: newWorkspace.id,
        name: newWorkspace.name,
        blocks,
        connections,
      };
    }

    return null;
  }, []);

  // Load local fallback data
  const loadLocalFallback = useCallback(() => {
    const blocks: BlockData[] = allSeedBlocks.map((block) => ({
      ...block,
      width: 280,
      height: 120,
      externalUrl: null,
      parentId: null,
      workspaceId: "demo",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const connections: ConnectionData[] = seedConnections.map((conn) => ({
      ...conn,
      animated: conn.animated ?? false,
      style: null,
      workspaceId: "demo",
    }));

    return { blocks, connections };
  }, []);

  // Main workspace loading logic
  const loadWorkspace = useCallback(async () => {
    if (authLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabaseReady = isSupabaseConfigured();

      if (isAuthenticated && user && supabaseReady) {
        // Authenticated user - load from Supabase
        const workspaceData = await loadFromSupabase(user.id, false);
        
        if (workspaceData) {
          setWorkspaceId(workspaceData.id);
          setWorkspaceName(workspaceData.name);
          setWorkspace(workspaceData.id, workspaceData.name);
          loadFromData(workspaceData.blocks, workspaceData.connections);
        } else {
          throw new Error("Failed to load or create workspace");
        }
      } else if (supabaseReady) {
        // Guest user with Supabase - use persistent guest workspace
        const guestId = getGuestWorkspaceId();
        
        if (guestId) {
          try {
            const workspaceData = await loadFromSupabase(guestId, true);
            
            if (workspaceData) {
              setWorkspaceId(workspaceData.id);
              setWorkspaceName(workspaceData.name);
              setWorkspace(workspaceData.id, workspaceData.name);
              loadFromData(workspaceData.blocks, workspaceData.connections);
              return;
            }
          } catch {
            // Fall through to local fallback
            console.warn("Failed to load guest workspace from Supabase, using local fallback");
          }
        }

        // Fallback to local
        setWorkspaceId("demo");
        setWorkspaceName(defaultWorkspace.name);
        setWorkspace("demo", defaultWorkspace.name);
        const { blocks, connections } = loadLocalFallback();
        loadFromData(blocks, connections);
      } else {
        // No Supabase - use local fallback (demo mode)
        setWorkspaceId("demo");
        setWorkspaceName(defaultWorkspace.name);
        setWorkspace("demo", defaultWorkspace.name);
        const { blocks, connections } = loadLocalFallback();
        loadFromData(blocks, connections);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
      
      // Fall back to local demo mode on error
      setWorkspaceId("demo");
      setWorkspaceName(defaultWorkspace.name);
      setWorkspace("demo", defaultWorkspace.name);
      const { blocks, connections } = loadLocalFallback();
      loadFromData(blocks, connections);
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, user, setWorkspace, loadFromData, loadFromSupabase, loadLocalFallback]);

  // Load workspace on auth state change
  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  return {
    isLoading: isLoading || authLoading,
    isAuthenticated,
    workspaceId,
    workspaceName,
    error,
    isDemoMode: workspaceId === "demo",
    showAuthModal,
    setShowAuthModal,
  };
}

