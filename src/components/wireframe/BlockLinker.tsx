"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useCanvasStore } from "@/lib/store";
import { COMPANY_COLORS, BLOCK_CONFIGS, type Company, type BlockType, type BlockData } from "@/lib/types";

interface BlockLinkerProps {
  sectionId: string;
  company: Company;
  linkedBlockIds: string[];
  suggestedTypes?: BlockType[];
}

/**
 * BlockLinker - Component for linking content blocks to wireframe sections
 * Shows available blocks from the schema with prominent "pop-up" animation for linked blocks
 */
export default function BlockLinker({
  sectionId,
  company,
  linkedBlockIds,
  suggestedTypes = [],
}: BlockLinkerProps) {
  const { nodes, linkBlockToSection, unlinkBlockFromSection } = useCanvasStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<BlockType | "ALL">("ALL");
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentlyLinked, setRecentlyLinked] = useState<Set<string>>(new Set());
  const prevLinkedRef = useRef<string[]>([]);

  // Track newly linked blocks for animation
  useEffect(() => {
    const prevLinked = new Set(prevLinkedRef.current);
    const newlyLinked = linkedBlockIds.filter(id => !prevLinked.has(id));
    
    if (newlyLinked.length > 0) {
      setRecentlyLinked(new Set(newlyLinked));
      
      // Clear animation after 2 seconds
      const timeout = setTimeout(() => {
        setRecentlyLinked(new Set());
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
    
    prevLinkedRef.current = linkedBlockIds;
  }, [linkedBlockIds]);

  // Get available blocks for this company
  const availableBlocks = useMemo(() => {
    return nodes
      .filter((node) => {
        const data = node.data as unknown as BlockData;
        // Include blocks from same company or SHARED
        if (data.company !== company && data.company !== "SHARED") return false;
        // Filter by type
        if (filterType !== "ALL" && data.type !== filterType) return false;
        // Filter by search
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!data.title.toLowerCase().includes(query)) return false;
        }
        return true;
      })
      .map((node) => node.data as unknown as BlockData)
      .sort((a, b) => {
        // Prioritize suggested types
        const aIsSuggested = suggestedTypes.includes(a.type);
        const bIsSuggested = suggestedTypes.includes(b.type);
        if (aIsSuggested && !bIsSuggested) return -1;
        if (!aIsSuggested && bIsSuggested) return 1;
        return a.title.localeCompare(b.title);
      });
  }, [nodes, company, filterType, searchQuery, suggestedTypes]);

  const linkedBlocks = nodes
    .filter((node) => linkedBlockIds.includes(node.id))
    .map((node) => node.data as unknown as BlockData);

  const unlinkedBlocks = availableBlocks.filter(
    (block) => !linkedBlockIds.includes(block.id)
  );

  const handleToggleBlock = (blockId: string) => {
    if (linkedBlockIds.includes(blockId)) {
      unlinkBlockFromSection(sectionId, blockId);
    } else {
      linkBlockToSection(sectionId, blockId);
    }
  };

  const companyColor = COMPANY_COLORS[company];

  return (
    <div className="space-y-4">
      {/* Linked blocks - with pop-up animation */}
      <div>
        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-[10px]">
            ✓
          </span>
          Linked Blocks ({linkedBlocks.length})
        </p>
        <div className="space-y-2">
          {linkedBlocks.length === 0 ? (
            <div className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
              <div className="text-2xl mb-2">📎</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                No blocks linked yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Add blocks from below to see them here
              </p>
            </div>
          ) : (
            linkedBlocks.map((block) => {
              const typeConfig = BLOCK_CONFIGS[block.type];
              const isNew = recentlyLinked.has(block.id);
              
              return (
                <div
                  key={block.id}
                  className={`
                    relative flex items-center gap-3 p-3 rounded-xl 
                    border-2 transition-all duration-300 group
                    ${isNew 
                      ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20 scale-[1.02] animate-pulse" 
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
                    }
                  `}
                  style={{
                    animation: isNew ? "popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" : undefined,
                  }}
                >
                  {/* New badge */}
                  {isNew && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full shadow-lg animate-bounce">
                      ✨ NEW
                    </div>
                  )}
                  
                  {/* Icon with accent background */}
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ 
                      backgroundColor: `${companyColor.primary}15`,
                      border: `1px solid ${companyColor.primary}30`,
                    }}
                  >
                    {typeConfig.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {block.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                        {typeConfig.label}
                      </span>
                      <span 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: companyColor.primary }}
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleToggleBlock(block.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 
                      opacity-0 group-hover:opacity-100 transition-all"
                    title="Unlink block"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add blocks section */}
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-full flex items-center justify-between p-3 rounded-xl border-2 
            transition-all duration-200 font-medium
            ${isExpanded 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
              : "border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
            }
          `}
        >
          <span className="flex items-center gap-2 text-sm">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
              ${isExpanded ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
              {isExpanded ? "−" : "+"}
            </span>
            {isExpanded ? "Close Block Picker" : "Add Content Blocks"}
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Search and filter */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search blocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-gray-100 dark:bg-gray-800 
                    border-0 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white
                    placeholder:text-gray-400"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as BlockType | "ALL")}
                className="px-3 py-2 text-sm rounded-xl bg-gray-100 dark:bg-gray-800 
                  border-0 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              >
                <option value="ALL">All Types</option>
                {Object.entries(BLOCK_CONFIGS).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Suggested blocks */}
            {suggestedTypes.length > 0 && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold uppercase tracking-wider mb-2">
                  💡 Suggested for this section
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTypes.map((type) => {
                    const config = BLOCK_CONFIGS[type];
                    return (
                      <span
                        key={type}
                        className="px-2.5 py-1 text-[11px] rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium"
                      >
                        {config.icon} {config.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available blocks list */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {unlinkedBlocks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm text-gray-400">No matching blocks found</p>
                </div>
              ) : (
                unlinkedBlocks.map((block) => {
                  const typeConfig = BLOCK_CONFIGS[block.type];
                  const isSuggested = suggestedTypes.includes(block.type);
                  
                  return (
                    <button
                      key={block.id}
                      onClick={() => handleToggleBlock(block.id)}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-xl text-left
                        transition-all duration-150 group
                        hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm
                        ${isSuggested 
                          ? "border-2 border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10" 
                          : "border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50"
                        }
                      `}
                    >
                      <div 
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                        style={{ 
                          backgroundColor: `${COMPANY_COLORS[block.company].primary}15`,
                        }}
                      >
                        {typeConfig.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {block.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {typeConfig.label}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ 
                              backgroundColor: `${COMPANY_COLORS[block.company].primary}20`,
                              color: COMPANY_COLORS[block.company].primary,
                            }}
                          >
                            {block.company}
                          </span>
                          {isSuggested && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-medium">
                              Suggested
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center
                        text-green-600 dark:text-green-400 text-lg opacity-0 group-hover:opacity-100 transition-opacity
                        group-hover:scale-110 transform">
                        +
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* CSS for pop-in animation */}
      <style jsx>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(-10px);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}


