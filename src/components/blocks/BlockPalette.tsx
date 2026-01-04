"use client";

import React, { useState, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, type BlockType } from "@/lib/types";
import RecentBlocksPanel from "./RecentBlocksPanel";
import SmartSuggestions from "./SmartSuggestions";

interface PaletteItemProps {
  type: BlockType;
  onAdd: (type: BlockType) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

// Block categories for organization
const BLOCK_CATEGORIES = {
  core: {
    label: "Core Elements",
    icon: "🏛️",
    types: ["COMPANY", "CORE_VALUE_PROP"] as BlockType[],
    description: "Foundation blocks that define your brand",
  },
  problems: {
    label: "Problems & Solutions",
    icon: "💡",
    types: ["PAIN_POINT", "SOLUTION"] as BlockType[],
    description: "Customer challenges and how you solve them",
  },
  content: {
    label: "Content",
    icon: "📝",
    types: ["FEATURE", "VERTICAL", "ARTICLE"] as BlockType[],
    description: "Features, use cases, and articles",
  },
  technical: {
    label: "Technical",
    icon: "⚙️",
    types: ["TECH_COMPONENT"] as BlockType[],
    description: "Technical architecture components",
  },
};

// Template suggestions for each block type
const BLOCK_TEMPLATES: Record<BlockType, { title: string; subtitle: string }[]> = {
  COMPANY: [
    { title: "CERE Network", subtitle: "Decentralized Data Cloud" },
    { title: "Cere Foundation", subtitle: "Ecosystem Development" },
  ],
  CORE_VALUE_PROP: [
    { title: "Data Sovereignty", subtitle: "Own your data, control access" },
    { title: "Cost Efficiency", subtitle: "70% reduction vs traditional cloud" },
    { title: "Decentralization", subtitle: "No single point of failure" },
  ],
  PAIN_POINT: [
    { title: "Data Lock-in", subtitle: "Vendor dependency issues" },
    { title: "High Storage Costs", subtitle: "Growing data volumes" },
    { title: "Privacy Concerns", subtitle: "Data ownership unclear" },
  ],
  SOLUTION: [
    { title: "DDC Platform", subtitle: "Decentralized Data Clusters" },
    { title: "Client SDK", subtitle: "Easy integration tools" },
  ],
  FEATURE: [
    { title: "Multi-CDN", subtitle: "Global content delivery" },
    { title: "Encryption", subtitle: "End-to-end security" },
    { title: "Analytics", subtitle: "Usage insights" },
  ],
  VERTICAL: [
    { title: "Gaming", subtitle: "Game asset storage" },
    { title: "Media", subtitle: "Video streaming" },
    { title: "Enterprise", subtitle: "B2B solutions" },
  ],
  TECH_COMPONENT: [
    { title: "Storage Layer", subtitle: "Distributed file system" },
    { title: "CDN Network", subtitle: "Edge caching nodes" },
  ],
  ARTICLE: [
    { title: "Blog Post", subtitle: "Thought leadership" },
    { title: "Case Study", subtitle: "Customer success story" },
  ],
  PAGE_ROOT: [
    { title: "Landing Page", subtitle: "Main entry point" },
  ],
};

/**
 * Individual draggable block item in the palette with expanded preview
 */
function PaletteItem({ type, onAdd, expanded, onToggleExpand }: PaletteItemProps) {
  const config = BLOCK_CONFIGS[type];
  const { setDraggedBlockType, addNode } = useCanvasStore();
  const [isAdding, setIsAdding] = useState(false);
  const templates = BLOCK_TEMPLATES[type] || [];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
    setDraggedBlockType(type);
  };

  const handleDragEnd = () => {
    setDraggedBlockType(null);
  };

  const handleQuickAdd = (template?: { title: string; subtitle: string }) => {
    setIsAdding(true);
    
    addNode({
      type,
      company: "SHARED",
      title: template?.title || `New ${config.label}`,
      subtitle: template?.subtitle || "",
      positionX: 400 + Math.random() * 100,
      positionY: 300 + Math.random() * 100,
    });
    
    // Visual feedback
    setTimeout(() => setIsAdding(false), 300);
  };

  return (
    <div className="space-y-1">
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
        className={`
        flex items-center gap-3
        p-3
        rounded-lg
        border-l-4
        cursor-grab
        active:cursor-grabbing
        transition-all
        duration-150
        select-none
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20
          ${isAdding ? "scale-95 opacity-70" : "hover:scale-[1.02]"}
        `}
      style={{
        borderLeftColor: config.borderColor,
      }}
    >
      <span className="text-xl flex-shrink-0">{config.icon}</span>
      <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-white">
          {config.label}
        </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            Drag to canvas
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* Quick add button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleQuickAdd();
            }}
            className={`
              p-1.5 rounded-md transition-all
              ${isAdding 
                ? "bg-green-500 text-white" 
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-500 hover:text-white"
              }
            `}
            title="Quick add with defaults"
          >
            {isAdding ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
          {/* Expand templates button */}
          {templates.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className={`
                p-1.5 rounded-md transition-all
                ${expanded 
                  ? "bg-purple-500 text-white" 
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-500 hover:text-white"
                }
              `}
              title="Show templates"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Expanded template list */}
      {expanded && templates.length > 0 && (
        <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {templates.map((template, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickAdd(template)}
              className="w-full text-left p-2 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-transparent hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
            >
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                {template.title}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {template.subtitle}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * BlockPalette - Enhanced sidebar with categorized, draggable block types
 */
export default function BlockPalette() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedType, setExpandedType] = useState<BlockType | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
  const { addNode } = useCanvasStore();

  const toggleCategory = (categoryKey: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  const handleAddBlock = (type: BlockType) => {
    const config = BLOCK_CONFIGS[type];
    addNode({
      type,
      company: "SHARED",
      title: `New ${config.label}`,
      positionX: 400 + Math.random() * 100,
      positionY: 300 + Math.random() * 100,
    });
  };

  // Filter blocks by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return BLOCK_CATEGORIES;
    
    const query = searchQuery.toLowerCase();
    const filtered: typeof BLOCK_CATEGORIES = {} as typeof BLOCK_CATEGORIES;
    
    for (const [key, category] of Object.entries(BLOCK_CATEGORIES)) {
      const matchingTypes = category.types.filter(type => {
        const config = BLOCK_CONFIGS[type];
        return (
          config.label.toLowerCase().includes(query) ||
          type.toLowerCase().includes(query) ||
          category.label.toLowerCase().includes(query)
        );
      });
      
      if (matchingTypes.length > 0) {
        filtered[key as keyof typeof BLOCK_CATEGORIES] = {
          ...category,
          types: matchingTypes,
        };
      }
    }
    
    return filtered;
  }, [searchQuery]);

  return (
    <div className="h-full flex flex-col" data-tour="palette">
      {/* Header with search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
        <div>
        <h2 className="font-bold text-lg text-gray-900 dark:text-white">
          Content Blocks
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            Drag onto canvas or click + to add
        </p>
      </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search blocks..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg 
            className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2 p-0.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Categorized block list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4" data-tour="palette-blocks">
        {Object.entries(filteredCategories).map(([key, category]) => (
          <div key={key} className="space-y-2">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(key)}
              className="w-full flex items-center gap-2 px-1 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
            >
              <span className="text-sm">{category.icon}</span>
              <span className="flex-1 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                {category.label}
              </span>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${collapsedCategories.has(key) ? "-rotate-90" : ""}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Category blocks */}
            {!collapsedCategories.has(key) && (
              <div className="space-y-2 pl-1">
                {category.types.map((type) => (
                  <PaletteItem
                    key={type}
                    type={type}
                    onAdd={handleAddBlock}
                    expanded={expandedType === type}
                    onToggleExpand={() => setExpandedType(expandedType === type ? null : type)}
                  />
        ))}
              </div>
            )}
          </div>
        ))}
        
        {Object.keys(filteredCategories).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm">No blocks match &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>

      {/* Recent Blocks */}
      <RecentBlocksPanel />

      {/* Smart Suggestions */}
      <SmartSuggestions />

      {/* Help section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <h3 className="font-semibold text-xs text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-2">
          Quick Tips
        </h3>
        <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px]">+</span>
            Quick add block
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-500 flex items-center justify-center text-[10px]">▼</span>
            Show templates
          </li>
          <li className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">
              Drag
            </kbd>
            Drop on canvas
          </li>
        </ul>
      </div>
    </div>
  );
}
