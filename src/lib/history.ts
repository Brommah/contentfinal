/**
 * Undo/Redo History Management
 * 
 * Implements a 50-step history stack for canvas operations
 */

import type { Node, Edge } from "@xyflow/react";
import type { BlockData } from "./types";

export interface HistoryState {
  nodes: Node<BlockData>[];
  edges: Edge[];
  timestamp: number;
  description: string;
}

export interface HistoryManager {
  past: HistoryState[];
  future: HistoryState[];
  maxSize: number;
}

export function createHistoryManager(maxSize = 50): HistoryManager {
  return {
    past: [],
    future: [],
    maxSize,
  };
}

export function pushState(
  history: HistoryManager,
  state: Omit<HistoryState, "timestamp">
): HistoryManager {
  const newState: HistoryState = {
    ...state,
    timestamp: Date.now(),
  };

  const newPast = [...history.past, newState].slice(-history.maxSize);

  return {
    ...history,
    past: newPast,
    future: [], // Clear future when new action is performed
  };
}

export function undo(history: HistoryManager): {
  history: HistoryManager;
  state: HistoryState | null;
} {
  if (history.past.length === 0) {
    return { history, state: null };
  }

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, -1);

  return {
    history: {
      ...history,
      past: newPast,
      future: [previous, ...history.future].slice(0, history.maxSize),
    },
    state: newPast[newPast.length - 1] || null,
  };
}

export function redo(history: HistoryManager): {
  history: HistoryManager;
  state: HistoryState | null;
} {
  if (history.future.length === 0) {
    return { history, state: null };
  }

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  return {
    history: {
      ...history,
      past: [...history.past, next].slice(-history.maxSize),
      future: newFuture,
    },
    state: next,
  };
}

export function canUndo(history: HistoryManager): boolean {
  return history.past.length > 0;
}

export function canRedo(history: HistoryManager): boolean {
  return history.future.length > 0;
}

export function getHistoryLength(history: HistoryManager): {
  past: number;
  future: number;
} {
  return {
    past: history.past.length,
    future: history.future.length,
  };
}

