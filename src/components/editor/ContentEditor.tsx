"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useCanvasStore } from "@/lib/store";
import { BlockData, BlockType, Company, BLOCK_CONFIGS, COMPANY_COLORS, BlockStatus } from "@/lib/types";
import BlockContentEditor from "./BlockContentEditor";
import { ResizableSidebar } from "@/components/ui";
import FilterBar from "@/components/ui/FilterBar";
import { WikiSyncPanel } from "@/components/wiki";

type SortField = "title" | "type" | "company" | "status" | "updatedAt";
type SortOrder = "asc" | "desc";

/**
 * ContentEditor - Full-featured content editing interface
 * Provides a list view with search, filter, and inline editing
 */
export default function ContentEditor() {
  const { nodes, edges, updateNode } = useCanvasStore();
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<BlockType | "ALL">("ALL");
  const [filterCompany, setFilterCompany] = useState<Company | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<BlockStatus | "ALL">("ALL");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [wikiPanelOpen, setWikiPanelOpen] = useState(true); // Start with Wiki AI expanded

  // Get blocks from nodes
  const blocks = useMemo(() => {
    return nodes.map((n) => n.data as BlockData);
  }, [nodes]);

  // Filter and sort blocks
  const filteredBlocks = useMemo(() => {
    let result = [...blocks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.subtitle?.toLowerCase().includes(query) ||
          b.content?.toLowerCase().includes(query) ||
          b.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (filterType !== "ALL") {
      result = result.filter((b) => b.type === filterType);
    }

    // Company filter
    if (filterCompany !== "ALL") {
      result = result.filter((b) => b.company === filterCompany);
    }

    // Status filter
    if (filterStatus !== "ALL") {
      result = result.filter((b) => b.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "company":
          comparison = a.company.localeCompare(b.company);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "updatedAt":
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [blocks, searchQuery, filterType, filterCompany, filterStatus, sortField, sortOrder]);

  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId)
    : null;

  // Get connected blocks for the selected block
  const connectedBlocks = useMemo(() => {
    if (!selectedBlockId) return { incoming: [], outgoing: [] };

    const incoming = edges
      .filter((e) => e.target === selectedBlockId)
      .map((e) => ({
        block: blocks.find((b) => b.id === e.source),
        relationship: (e.data as { relationshipType?: string })?.relationshipType,
      }))
      .filter((c) => c.block);

    const outgoing = edges
      .filter((e) => e.source === selectedBlockId)
      .map((e) => ({
        block: blocks.find((b) => b.id === e.target),
        relationship: (e.data as { relationshipType?: string })?.relationshipType,
      }))
      .filter((c) => c.block);

    return { incoming, outgoing };
  }, [selectedBlockId, edges, blocks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleUpdateBlock = useCallback(
    (updates: Partial<BlockData>) => {
      if (selectedBlockId) {
        updateNode(selectedBlockId, updates);
      }
    },
    [selectedBlockId, updateNode]
  );

  return (
    <div className="flex h-full bg-slate-100 dark:bg-slate-950" data-tour="editor-main">
      {/* Left panel - Block list (Resizable) */}
      <ResizableSidebar
        position="left"
        defaultWidth={380}
        minWidth={280}
        maxWidth={550}
        storageKey="editor-left-sidebar"
        className="border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-950"
        data-tour="editor-block-list"
      >
        {/* Search and filters */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterType={filterType}
          onTypeChange={setFilterType}
          filterCompany={filterCompany}
          onCompanyChange={setFilterCompany}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          totalCount={blocks.length}
          filteredCount={filteredBlocks.length}
        />

        {/* Block list header */}
        <div className="flex items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <button
            onClick={() => handleSort("title")}
            className="flex-1 text-left hover:text-slate-900 dark:hover:text-white"
          >
            Title {sortField === "title" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => handleSort("type")}
            className="w-20 text-center hover:text-slate-900 dark:hover:text-white"
          >
            Type {sortField === "type" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        </div>

        {/* Block list */}
        <div className="flex-1 overflow-y-auto">
          {filteredBlocks.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>No blocks found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            filteredBlocks.map((block) => {
              const config = BLOCK_CONFIGS[block.type];
              const companyColor = COMPANY_COLORS[block.company];
              const isSelected = selectedBlockId === block.id;

              return (
                <button
                  key={block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={`
                    w-full px-4 py-3 text-left border-b border-slate-200 dark:border-slate-800/50
                    transition-colors
                    ${isSelected
                      ? "bg-indigo-50 dark:bg-blue-500/10 border-l-2 border-l-indigo-500 dark:border-l-blue-500"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: companyColor.primary }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {block.title}
                        </span>
                        <span className={`text-[10px] ${block.status === "PENDING_REVIEW" ? "text-amber-500 dark:text-amber-400" : block.status === "NEEDS_CHANGES" ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>
                          {block.status === "LIVE" && "🟢"}
                          {block.status === "VISION" && "🔮"}
                          {block.status === "DRAFT" && "📝"}
                          {block.status === "ARCHIVED" && "📦"}
                          {block.status === "PENDING_REVIEW" && "⏳"}
                          {block.status === "APPROVED" && "✅"}
                          {block.status === "NEEDS_CHANGES" && "🔄"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-500">
                          {config.icon} {config.label}
                        </span>
                        {block.subtitle && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-600 truncate">
                            • {block.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Stats - Now handled by FilterBar */}
      </ResizableSidebar>

      {/* Center panel - Block editor */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white dark:bg-slate-900">
        {selectedBlock ? (
          <BlockContentEditor
            block={selectedBlock}
            onUpdate={handleUpdateBlock}
            connectedBlocks={connectedBlocks}
            onSelectBlock={setSelectedBlockId}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <div className="text-center">
              <div className="text-6xl mb-4">✏️</div>
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">Select a block to edit</h3>
              <p className="text-sm mt-1">Choose from the list on the left</p>
            </div>
          </div>
        )}

        {/* Wiki Panel Toggle Button */}
        <button
          onClick={() => setWikiPanelOpen(!wikiPanelOpen)}
          data-tour="wiki-ai-button"
          className={`absolute bottom-4 right-4 z-30 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all ${
            wikiPanelOpen 
              ? "bg-purple-600 text-white" 
              : "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-slate-700 border border-purple-200 dark:border-purple-500/30"
          }`}
          title="Wiki Context & AI Suggestions"
        >
          <span className="text-lg">📚</span>
          <span className="text-sm font-medium">Wiki AI</span>
          {wikiPanelOpen && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>

      {/* Right panel - Wiki Context & AI */}
      {wikiPanelOpen && (
        <ResizableSidebar
          position="right"
          defaultWidth={380}
          minWidth={320}
          maxWidth={550}
          storageKey="editor-wiki-panel"
          className="overflow-hidden"
        >
          <WikiSyncPanel
            selectedBlock={selectedBlock}
            onApplySuggestion={(blockId, updates) => {
              updateNode(blockId, updates);
            }}
          />
        </ResizableSidebar>
      )}
    </div>
  );
}


