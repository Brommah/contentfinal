/**
 * useHistory Hook
 * 
 * Provides undo/redo functionality with keyboard shortcuts
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { useCanvasStore } from "@/lib/store";
import {
  createHistoryManager,
  pushState,
  undo,
  redo,
  canUndo,
  canRedo,
  HistoryManager,
  HistoryState,
} from "@/lib/history";
import { useToast } from "@/components/ui";

export function useHistory() {
  const { nodes, edges, setNodes, setEdges } = useCanvasStore();
  const [history, setHistory] = useState<HistoryManager>(() =>
    createHistoryManager(50)
  );
  const { info } = useToast();
  const isUndoRedoAction = useRef(false);
  const lastSnapshotRef = useRef<string>("");

  // Create a snapshot key to detect actual changes
  const createSnapshotKey = useCallback(() => {
    return JSON.stringify({
      nodes: nodes.map((n) => ({ id: n.id, position: n.position, data: n.data })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    });
  }, [nodes, edges]);

  // Save current state to history (debounced)
  const saveSnapshot = useCallback(
    (description: string = "Edit") => {
      if (isUndoRedoAction.current) {
        isUndoRedoAction.current = false;
        return;
      }

      const snapshotKey = createSnapshotKey();
      if (snapshotKey === lastSnapshotRef.current) {
        return; // No actual change
      }
      lastSnapshotRef.current = snapshotKey;

      setHistory((prev) =>
        pushState(prev, {
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
          description,
        })
      );
    },
    [nodes, edges, createSnapshotKey]
  );

  // Undo action
  const performUndo = useCallback(() => {
    const result = undo(history);
    if (result.state) {
      isUndoRedoAction.current = true;
      setNodes(result.state.nodes);
      setEdges(result.state.edges);
      setHistory(result.history);
      lastSnapshotRef.current = JSON.stringify({
        nodes: result.state.nodes.map((n) => ({
          id: n.id,
          position: n.position,
          data: n.data,
        })),
        edges: result.state.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        })),
      });
      info("↩️ Undo", result.state.description || "Action undone");
    }
  }, [history, setNodes, setEdges, info]);

  // Redo action
  const performRedo = useCallback(() => {
    const result = redo(history);
    if (result.state) {
      isUndoRedoAction.current = true;
      setNodes(result.state.nodes);
      setEdges(result.state.edges);
      setHistory(result.history);
      lastSnapshotRef.current = JSON.stringify({
        nodes: result.state.nodes.map((n) => ({
          id: n.id,
          position: n.position,
          data: n.data,
        })),
        edges: result.state.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        })),
      });
      info("↪️ Redo", result.state.description || "Action redone");
    }
  }, [history, setNodes, setEdges, info]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for undo (Cmd/Ctrl + Z)
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        performUndo();
      }
      // Check for redo (Cmd/Ctrl + Shift + Z)
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        performRedo();
      }
      // Alternative redo (Cmd/Ctrl + Y)
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        performRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [performUndo, performRedo]);

  return {
    saveSnapshot,
    undo: performUndo,
    redo: performRedo,
    canUndo: canUndo(history),
    canRedo: canRedo(history),
    historyLength: history.past.length,
    futureLength: history.future.length,
  };
}

