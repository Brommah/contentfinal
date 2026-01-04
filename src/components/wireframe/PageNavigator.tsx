"use client";

import React from "react";
import {
  DEFAULT_PAGES,
  getChildPages,
  isDeeperPage,
  getPageRootBlockId,
  type WireframePage,
} from "@/lib/wireframe-types";
import { useCanvasStore } from "@/lib/store";

interface PageNavigatorProps {
  onSelectPage: (pageId: string) => void;
  selectedPageId: string | null;
}

/**
 * PageNavigator - Overview of all wireframe pages with nested structure
 * Shows block counts and generation status for deeper pages
 */
export default function PageNavigator({
  onSelectPage,
  selectedPageId,
}: PageNavigatorProps) {
  const cerePages = DEFAULT_PAGES.filter(
    (p) => p.company === "CERE" && p.parentId === null
  );
  const cefPages = DEFAULT_PAGES.filter(
    (p) => p.company === "CEF" && p.parentId === null
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Page Overview
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select a page to edit its wireframe
        </p>
      </div>

      {/* Page Trees */}
      <div className="flex-1 overflow-auto p-6" data-tour="page-cards">
        <div className="grid grid-cols-2 gap-8">
          {/* CERE Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 rounded-full bg-cyan-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                CERE Network
              </h3>
              <span className="text-xs text-gray-500">Protocol</span>
            </div>
            <div className="space-y-2">
              {cerePages.map((page) => (
                <PageTreeNode
                  key={page.id}
                  page={page}
                  selectedPageId={selectedPageId}
                  onSelect={onSelectPage}
                  depth={0}
                />
              ))}
            </div>
          </div>

          {/* CEF Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 rounded-full bg-emerald-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                CEF.AI
              </h3>
              <span className="text-xs text-gray-500">Enterprise</span>
            </div>
            <div className="space-y-2">
              {cefPages.map((page) => (
                <PageTreeNode
                  key={page.id}
                  page={page}
                  selectedPageId={selectedPageId}
                  onSelect={onSelectPage}
                  depth={0}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
          <span>Click a page to edit its wireframe</span>
          <span>•</span>
          <span>Nested pages inherit parent styles</span>
        </div>
      </div>
    </div>
  );
}

interface PageTreeNodeProps {
  page: WireframePage;
  selectedPageId: string | null;
  onSelect: (pageId: string) => void;
  depth: number;
}

function PageTreeNode({
  page,
  selectedPageId,
  onSelect,
  depth,
}: PageTreeNodeProps) {
  const children = getChildPages(page.id);
  const isSelected = selectedPageId === page.id;
  const companyColor = page.company === "CERE" ? "cyan" : "emerald";
  
  // Check if this is a deeper page and get block info
  const isDeeper = isDeeperPage(page.id);
  const { nodes, pageBlocksLoading, pageBlocksGenerated } = useCanvasStore();
  
  // Get block count for deeper pages
  const getBlockCount = () => {
    if (!isDeeper) return null;
    const pageRootId = getPageRootBlockId(page.id);
    return nodes.filter((node) => node.data.parentId === pageRootId).length;
  };
  
  const blockCount = getBlockCount();
  const isLoading = pageBlocksLoading[page.id];
  const hasGenerated = pageBlocksGenerated[page.id] || (blockCount !== null && blockCount > 0);

  return (
    <div>
      <button
        onClick={() => onSelect(page.id)}
        className={`
          w-full text-left rounded-xl transition-all duration-200
          ${depth > 0 ? "ml-6" : ""}
          ${
            isSelected
              ? `bg-${companyColor}-500/10 border-2 border-${companyColor}-500 shadow-lg`
              : "bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md"
          }
        `}
        style={{
          marginLeft: depth > 0 ? `${depth * 24}px` : undefined,
        }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center text-lg
                ${
                  isSelected
                    ? `bg-${companyColor}-500 text-white`
                    : "bg-gray-100 dark:bg-gray-800"
                }
              `}
              style={{
                backgroundColor: isSelected
                  ? page.company === "CERE"
                    ? "#06b6d4"
                    : "#10b981"
                  : undefined,
              }}
            >
              {page.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4
                  className={`font-medium truncate ${
                    isSelected
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {page.name}
                </h4>
                {depth === 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                    Root
                  </span>
                )}
                {/* Block status badge for deeper pages */}
                {isDeeper && (
                  <>
                    {isLoading ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded flex items-center gap-1">
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating...
                      </span>
                    ) : hasGenerated ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                        {blockCount} block{blockCount !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                        No content
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {page.description}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-1">
                {page.slug}
              </p>
            </div>

            {/* Arrow / Action indicator */}
            <div className="flex items-center gap-2">
              {isDeeper && !hasGenerated && !isLoading && (
                <span 
                  className="text-[9px] px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                  title="AI will generate content blocks when you open this page"
                >
                  AI Ready
                </span>
              )}
            <svg
              className={`w-5 h-5 flex-shrink-0 transition-transform ${
                isSelected
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-400"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            </div>
          </div>

          {/* Child count badge */}
          {children.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500">
                {children.length} sub-page{children.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Render children */}
      {children.length > 0 && (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <PageTreeNode
              key={child.id}
              page={child}
              selectedPageId={selectedPageId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
