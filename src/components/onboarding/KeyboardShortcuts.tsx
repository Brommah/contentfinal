"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ["1"], description: "Switch to Content Schema", category: "Navigation" },
  { keys: ["2"], description: "Switch to Content Editor", category: "Navigation" },
  { keys: ["3"], description: "Switch to Wireframe Designer", category: "Navigation" },
  { keys: ["4"], description: "Switch to Content Roadmap", category: "Navigation" },
  { keys: ["5"], description: "Switch to CEO Dashboard", category: "Navigation" },
  { keys: ["6"], description: "Switch to Analytics", category: "Navigation" },

  // Canvas
  { keys: ["⌘", "A"], description: "Select all blocks", category: "Canvas" },
  { keys: ["Delete"], description: "Delete selected blocks", category: "Canvas" },
  { keys: ["⌘", "D"], description: "Duplicate selected blocks", category: "Canvas" },
  { keys: ["⌘", "Z"], description: "Undo last action", category: "Canvas" },
  { keys: ["⌘", "⇧", "Z"], description: "Redo action", category: "Canvas" },
  { keys: ["Space", "Drag"], description: "Pan canvas", category: "Canvas" },
  { keys: ["⌘", "+"], description: "Zoom in", category: "Canvas" },
  { keys: ["⌘", "-"], description: "Zoom out", category: "Canvas" },
  { keys: ["⌘", "0"], description: "Fit view", category: "Canvas" },

  // Blocks
  { keys: ["N"], description: "Add new block", category: "Blocks" },
  { keys: ["E"], description: "Edit selected block", category: "Blocks" },
  { keys: ["C"], description: "Connect mode", category: "Blocks" },
  { keys: ["⌘", "K"], description: "Quick search blocks", category: "Blocks" },
  { keys: ["⌘", "Enter"], description: "Submit for review", category: "Blocks" },

  // General
  { keys: ["?"], description: "Show keyboard shortcuts", category: "General" },
  { keys: ["⌘", "S"], description: "Save snapshot", category: "General" },
  { keys: ["⌘", "E"], description: "Export schema", category: "General" },
  { keys: ["Esc"], description: "Cancel / Close modal", category: "General" },
  { keys: ["⌘", "/"], description: "Toggle quick start mode", category: "General" },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * KeyboardShortcutsModal - Shows available keyboard shortcuts
 */
export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const categories = [...new Set(SHORTCUTS.map((s) => s.category))];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[700px] max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
            <p className="text-sm text-slate-400 mt-1">
              Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 text-xs">?</kbd> anytime to show this
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Shortcuts grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {SHORTCUTS.filter((s) => s.category === category).map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-sm text-slate-300">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <React.Fragment key={keyIdx}>
                            <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300 min-w-[24px] text-center">
                              {key}
                            </kbd>
                            {keyIdx < shortcut.keys.length - 1 && (
                              <span className="text-slate-600 text-xs">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 text-center">
            Tip: On Windows/Linux, use <kbd className="px-1 py-0.5 bg-slate-700 rounded">Ctrl</kbd> instead of <kbd className="px-1 py-0.5 bg-slate-700 rounded">⌘</kbd>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface UseKeyboardShortcutsOptions {
  onTabChange?: (tab: string) => void;
  onNewBlock?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onSearch?: () => void;
  onToggleQuickStart?: () => void;
}

/**
 * useKeyboardShortcuts - Hook to handle keyboard shortcuts
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // ? - Show help
      if (e.key === "?" && !cmdKey) {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // Number keys for tab navigation (1-6)
      if (!cmdKey && !e.shiftKey && !e.altKey) {
        const tabMap: Record<string, string> = {
          "1": "schema",
          "2": "editor",
          "3": "wireframe",
          "4": "roadmap",
          "5": "ceo-dashboard",
          "6": "analytics",
        };
        if (tabMap[e.key]) {
          e.preventDefault();
          options.onTabChange?.(tabMap[e.key]);
          return;
        }
      }

      // N - New block
      if (e.key === "n" && !cmdKey) {
        e.preventDefault();
        options.onNewBlock?.();
        return;
      }

      // Cmd+S - Save
      if (e.key === "s" && cmdKey) {
        e.preventDefault();
        options.onSave?.();
        return;
      }

      // Cmd+E - Export
      if (e.key === "e" && cmdKey) {
        e.preventDefault();
        options.onExport?.();
        return;
      }

      // Cmd+K - Search
      if (e.key === "k" && cmdKey) {
        e.preventDefault();
        options.onSearch?.();
        return;
      }

      // Cmd+/ - Toggle quick start
      if (e.key === "/" && cmdKey) {
        e.preventDefault();
        options.onToggleQuickStart?.();
        return;
      }
    },
    [options]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    showHelp,
    setShowHelp,
    closeHelp: () => setShowHelp(false),
  };
}

export { SHORTCUTS };


