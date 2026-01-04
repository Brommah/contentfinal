"use client";

/**
 * Global Search (Command Palette)
 * 
 * Spotlight-style search across blocks, pages, roadmap items
 * Triggered by ⌘K / Ctrl+K
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useCanvasStore } from "@/lib/store";
import type { BlockData } from "@/lib/types";
import type { TabType } from "@/components/dashboard/TabNavigation";

interface SearchResult {
  id: string;
  type: "block" | "page" | "roadmap" | "section" | "action";
  title: string;
  subtitle?: string;
  icon: string;
  category: string;
  action: () => void;
}

interface GlobalSearchProps {
  onNavigate?: (tab: TabType) => void;
}

export default function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    nodes,
    wireframeSections,
    roadmapItems,
    selectNode,
    selectSection,
    selectWireframePage,
    selectRoadmapItem,
  } = useCanvasStore();

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Build search results
  const results = useMemo((): SearchResult[] => {
    const allResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Quick actions (always shown when no query)
    const quickActions: SearchResult[] = [
      {
        id: "action-schema",
        type: "action",
        title: "Go to Architecture",
        subtitle: "Content schema & relationships",
        icon: "🗺️",
        category: "Navigation",
        action: () => {
          onNavigate?.("schema");
          router.push("/?tab=schema");
        },
      },
      {
        id: "action-editor",
        type: "action",
        title: "Go to Building Blocks",
        subtitle: "Edit content blocks",
        icon: "✏️",
        category: "Navigation",
        action: () => {
          onNavigate?.("editor");
          router.push("/?tab=editor");
        },
      },
      {
        id: "action-wireframe",
        type: "action",
        title: "Go to Website Builder",
        subtitle: "Design page layouts",
        icon: "🎨",
        category: "Navigation",
        action: () => {
          onNavigate?.("wireframe");
          router.push("/?tab=wireframe");
        },
      },
      {
        id: "action-roadmap",
        type: "action",
        title: "Go to Content Roadmap",
        subtitle: "Plan content timeline",
        icon: "📅",
        category: "Navigation",
        action: () => {
          onNavigate?.("roadmap");
          router.push("/?tab=roadmap");
        },
      },
      {
        id: "action-analytics",
        type: "action",
        title: "Go to Health Analytics",
        subtitle: "Content health metrics",
        icon: "📊",
        category: "Navigation",
        action: () => {
          onNavigate?.("analytics");
          router.push("/?tab=analytics");
        },
      },
      {
        id: "action-ceo",
        type: "action",
        title: "Go to CEO View",
        subtitle: "Executive overview",
        icon: "👔",
        category: "Navigation",
        action: () => {
          onNavigate?.("ceo-dashboard");
          router.push("/?tab=ceo-dashboard");
        },
      },
    ];

    // Search blocks
    const blockResults: SearchResult[] = nodes
      .filter((node) => {
        const data = node.data as BlockData;
        if (!query) return false;
        return (
          data.title?.toLowerCase().includes(lowerQuery) ||
          data.content?.toLowerCase().includes(lowerQuery) ||
          data.type?.toLowerCase().includes(lowerQuery)
        );
      })
      .slice(0, 10)
      .map((node) => {
        const data = node.data as BlockData;
        const typeIcons: Record<string, string> = {
          COMPANY: "🏢",
          CORE_VALUE_PROP: "💎",
          PAIN_POINT: "⚡",
          SOLUTION: "✅",
          FEATURE: "✨",
          VERTICAL: "🎯",
          ARTICLE: "📝",
          TECH_COMPONENT: "🔧",
        };
        return {
          id: `block-${node.id}`,
          type: "block" as const,
          title: data.title || "Untitled Block",
          subtitle: `${data.company} • ${data.type} • ${data.status}`,
          icon: typeIcons[data.type] || "📦",
          category: "Blocks",
          action: () => {
            selectNode(node.id);
            onNavigate?.("schema");
            router.push("/?tab=schema");
          },
        };
      });

    // Search roadmap items
    const roadmapResults: SearchResult[] = roadmapItems
      .filter((item) => {
        if (!query) return false;
        return (
          item.title.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery)
        );
      })
      .slice(0, 5)
      .map((item) => ({
        id: `roadmap-${item.id}`,
        type: "roadmap" as const,
        title: item.title,
        subtitle: `${item.status} • ${item.company}`,
        icon: "📋",
        category: "Roadmap",
        action: () => {
          selectRoadmapItem(item.id);
          onNavigate?.("roadmap");
          router.push("/?tab=roadmap");
        },
      }));

    // Search wireframe pages
    const pageResults: SearchResult[] = [];
    const uniquePages = new Set(wireframeSections.map((s) => s.pageId));
    uniquePages.forEach((pageId) => {
      if (!pageId) return;
      const pageName = pageId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      if (!query || pageName.toLowerCase().includes(lowerQuery)) {
        pageResults.push({
          id: `page-${pageId}`,
          type: "page" as const,
          title: pageName,
          subtitle: "Wireframe Page",
          icon: "📄",
          category: "Pages",
          action: () => {
            selectWireframePage(pageId);
            onNavigate?.("wireframe");
            router.push("/?tab=wireframe");
          },
        });
      }
    });

    // Combine results
    if (!query) {
      return quickActions;
    }

    // Filter quick actions by query too
    const filteredActions = quickActions.filter(
      (a) =>
        a.title.toLowerCase().includes(lowerQuery) ||
        a.subtitle?.toLowerCase().includes(lowerQuery)
    );

    return [...filteredActions, ...blockResults, ...roadmapResults, ...pageResults.slice(0, 5)];
  }, [query, nodes, roadmapItems, wireframeSections, router, onNavigate, selectNode, selectRoadmapItem, selectWireframePage]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            results[selectedIndex].action();
            setIsOpen(false);
            setQuery("");
          }
          break;
      }
    },
    [results, selectedIndex]
  );

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      onClick={() => {
        setIsOpen(false);
        setQuery("");
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-700">
          <svg
            className="w-5 h-5 text-slate-400 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search blocks, pages, roadmap items, or type a command..."
            className="flex-1 bg-transparent text-white text-lg placeholder-slate-500 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-slate-500 bg-slate-800 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 && query && (
            <div className="px-4 py-8 text-center text-slate-500">
              No results found for "{query}"
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {/* Group by category */}
              {Object.entries(
                results.reduce((acc, result) => {
                  if (!acc[result.category]) acc[result.category] = [];
                  acc[result.category].push(result);
                  return acc;
                }, {} as Record<string, SearchResult[]>)
              ).map(([category, items]) => (
                <div key={category}>
                  <div className="px-4 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {category}
                  </div>
                  {items.map((result, idx) => {
                    const globalIndex = results.indexOf(result);
                    return (
                      <button
                        key={result.id}
                        onClick={() => {
                          result.action();
                          setIsOpen(false);
                          setQuery("");
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center px-4 py-2.5 text-left transition-colors ${
                          selectedIndex === globalIndex
                            ? "bg-blue-600/20 text-white"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <span className="text-xl mr-3">{result.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-sm text-slate-500 truncate">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                        {selectedIndex === globalIndex && (
                          <kbd className="ml-2 px-2 py-0.5 text-xs text-slate-400 bg-slate-800 rounded">
                            Enter
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Enter</kbd>
              to select
            </span>
          </div>
          <span>
            {results.length} result{results.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}

