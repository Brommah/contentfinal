"use client";

/**
 * Canvas Bookmarks Component
 * 
 * Save and restore canvas view positions for quick navigation
 */

import React, { useState, useCallback, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/lib/store";
import { useToast } from "@/components/ui";

interface Bookmark {
  id: string;
  name: string;
  viewport: { x: number; y: number; zoom: number };
  createdAt: number;
}

const STORAGE_KEY = "cv-canvas-bookmarks";

export default function CanvasBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newBookmarkName, setNewBookmarkName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { getViewport, setViewport: rfSetViewport, fitView } = useReactFlow();
  const { success, info } = useToast();

  // Load bookmarks from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBookmarks(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse bookmarks:", e);
      }
    }
  }, []);

  // Save bookmarks to localStorage
  const saveBookmarks = useCallback((newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
  }, []);

  // Add new bookmark
  const addBookmark = useCallback(() => {
    if (!newBookmarkName.trim()) return;

    const viewport = getViewport();
    const newBookmark: Bookmark = {
      id: `bookmark-${Date.now()}`,
      name: newBookmarkName.trim(),
      viewport: {
        x: viewport.x,
        y: viewport.y,
        zoom: viewport.zoom,
      },
      createdAt: Date.now(),
    };

    saveBookmarks([...bookmarks, newBookmark]);
    setNewBookmarkName("");
    setShowAddForm(false);

    success("📌 Bookmark Saved", `View "${newBookmark.name}" saved`);
  }, [newBookmarkName, getViewport, bookmarks, saveBookmarks, success]);

  // Go to bookmark
  const goToBookmark = useCallback(
    (bookmark: Bookmark) => {
      rfSetViewport(bookmark.viewport, { duration: 500 });
      setIsOpen(false);

      info(`📍 ${bookmark.name}`, "Navigated to saved view");
    },
    [rfSetViewport, info]
  );

  // Delete bookmark
  const deleteBookmark = useCallback(
    (id: string) => {
      saveBookmarks(bookmarks.filter((b) => b.id !== id));
    },
    [bookmarks, saveBookmarks]
  );

  // Quick save current view
  const quickSave = useCallback(() => {
    const viewport = getViewport();
    const name = `View ${bookmarks.length + 1}`;
    const newBookmark: Bookmark = {
      id: `bookmark-${Date.now()}`,
      name,
      viewport: {
        x: viewport.x,
        y: viewport.y,
        zoom: viewport.zoom,
      },
      createdAt: Date.now(),
    };

    saveBookmarks([...bookmarks, newBookmark]);

    success("📌 Quick Save", `Saved as "${name}"`);
  }, [getViewport, bookmarks, saveBookmarks, success]);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        title="Canvas Bookmarks"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                📌 Saved Views
              </h3>
              <button
                onClick={quickSave}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Quick Save
              </button>
            </div>

            {/* Bookmarks List */}
            <div className="max-h-64 overflow-y-auto">
              {bookmarks.length === 0 ? (
                <div className="px-4 py-6 text-center text-slate-500 text-sm">
                  No saved views yet
                </div>
              ) : (
                <div className="py-1">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="group flex items-center justify-between px-3 py-2 hover:bg-slate-800 transition-colors"
                    >
                      <button
                        onClick={() => goToBookmark(bookmark)}
                        className="flex-1 text-left text-sm text-slate-300 hover:text-white"
                      >
                        {bookmark.name}
                      </button>
                      <button
                        onClick={() => deleteBookmark(bookmark.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New */}
            <div className="p-2 border-t border-slate-700">
              {showAddForm ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBookmarkName}
                    onChange={(e) => setNewBookmarkName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addBookmark()}
                    placeholder="View name..."
                    className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={addBookmark}
                    className="px-2 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                >
                  <span>+</span>
                  Add Bookmark
                </button>
              )}
            </div>

            {/* Fit View */}
            <div className="p-2 border-t border-slate-700">
              <button
                onClick={() => {
                  fitView({ duration: 500, padding: 0.2 });
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                Fit All Blocks
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

