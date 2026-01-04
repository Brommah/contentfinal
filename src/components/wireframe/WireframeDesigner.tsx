"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { getPageById, DEFAULT_PAGES, isDeeperPage, getPageRootBlockId } from "@/lib/wireframe-types";
import LandingPageCanvas from "./LandingPageCanvas";
import SectionPalette from "./SectionPalette";
import SectionEditor from "./SectionEditor";
import PageNavigator from "./PageNavigator";
import ResponsivePreview, { type ViewportSize, getViewportWidth } from "./ResponsivePreview";
import { ResizableSidebar } from "@/components/ui";
import { PageExportModal } from "./PageExportModal";

/**
 * WireframeDesigner - Single-page wireframe editor with nested page navigation
 * Shows a page overview first, then allows editing individual pages
 * Auto-generates content blocks for deeper pages using AI
 */
export default function WireframeDesigner() {
  const { 
    initWireframes, 
    wireframeSections, 
    selectedSectionId,
    selectedWireframePageId,
    selectWireframePage,
    workspaceId,
    hasPageBlocks,
    setPageBlocksLoading,
    setPageBlocksGenerated,
    addGeneratedBlocks,
    pageBlocksLoading,
  } = useCanvasStore();
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Initialize wireframes on mount
  useEffect(() => {
    initWireframes();
  }, [initWireframes]);

  // Auto-generate blocks for deeper pages without content
  const generatePageBlocks = useCallback(async (pageId: string) => {
    const page = getPageById(pageId);
    if (!page || !isDeeperPage(pageId)) return;
    
    // Check if already has blocks
    if (hasPageBlocks(pageId)) return;
    
    const pageRootId = getPageRootBlockId(pageId);
    
    setPageBlocksLoading(pageId, true);
    setGenerationError(null);
    
    try {
      const response = await fetch("/api/blocks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          parentBlockId: pageRootId,
          workspaceId: workspaceId || "default-workspace",
          company: page.company,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate blocks");
      }
      
      const data = await response.json();
      
      if (data.success && data.blocks) {
        // Add generated blocks to store
        addGeneratedBlocks(data.blocks);
        setPageBlocksGenerated(pageId, true);
      }
    } catch (error) {
      console.error("Block generation error:", error);
      setGenerationError("Failed to generate content. Please try again.");
    } finally {
      setPageBlocksLoading(pageId, false);
    }
  }, [workspaceId, hasPageBlocks, setPageBlocksLoading, setPageBlocksGenerated, addGeneratedBlocks]);

  // Trigger generation when navigating to a deeper page
  useEffect(() => {
    if (selectedWireframePageId && isDeeperPage(selectedWireframePageId)) {
      generatePageBlocks(selectedWireframePageId);
    }
  }, [selectedWireframePageId, generatePageBlocks]);

  // Get current page info
  const currentPage = selectedWireframePageId ? getPageById(selectedWireframePageId) : null;

  // Get sections for the selected page
  const pageSections = wireframeSections
    .filter((s) => s.pageId === selectedWireframePageId)
    .sort((a, b) => a.order - b.order);

  // Handle going back to overview
  const handleBackToOverview = () => {
    selectWireframePage(null);
    setGenerationError(null);
  };

  // Get breadcrumb path
  const getBreadcrumb = () => {
    if (!currentPage) return [];
    
    const path: typeof DEFAULT_PAGES = [];
    let page = currentPage;
    
    while (page) {
      path.unshift(page);
      page = page.parentId ? getPageById(page.parentId)! : null!;
    }
    
    return path;
  };

  const breadcrumb = getBreadcrumb();
  const isLoading = selectedWireframePageId ? pageBlocksLoading[selectedWireframePageId] : false;
  const isDeeper = selectedWireframePageId ? isDeeperPage(selectedWireframePageId) : false;

  // If no page selected, show the overview
  if (!selectedWireframePageId) {
    return (
      <div data-tour="page-navigator">
        <PageNavigator
          selectedPageId={selectedWireframePageId}
          onSelectPage={selectWireframePage}
        />
      </div>
    );
  }

  const companyColor = currentPage?.company === "CERE" ? "cyan" : "emerald";

  return (
    <div className="h-full flex overflow-hidden">
      {/* Section Palette - Left sidebar (Resizable) */}
      <ResizableSidebar
        position="left"
        defaultWidth={240}
        minWidth={180}
        maxWidth={400}
        storageKey="wireframe-left-sidebar"
        className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden"
        data-tour="section-palette"
      >
        <SectionPalette currentPageId={selectedWireframePageId} />
      </ResizableSidebar>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with breadcrumb and controls */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side: Back button and breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToOverview}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                title="Back to page overview"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>All Pages</span>
              </button>

              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm">
                <button
                  onClick={handleBackToOverview}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Pages
                </button>
                {breadcrumb.map((page, index) => (
                  <React.Fragment key={page.id}>
                    <svg
                      className="w-4 h-4 text-gray-400"
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
                    <button
                      onClick={() => selectWireframePage(page.id)}
                      className={`flex items-center gap-1.5 ${
                        index === breadcrumb.length - 1
                          ? "text-gray-900 dark:text-white font-medium"
                          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      <span>{page.icon}</span>
                      <span>{page.name}</span>
                    </button>
                  </React.Fragment>
                ))}
              </nav>

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <svg className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    Generating content with AI...
                  </span>
                </div>
              )}

              {/* Error message */}
              {generationError && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    {generationError}
                  </span>
                  <button
                    onClick={() => selectedWireframePageId && generatePageBlocks(selectedWireframePageId)}
                    className="text-xs text-red-600 dark:text-red-400 underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Right side: Page info and viewport toggle */}
            <div className="flex items-center gap-4">
              {/* Deeper page indicator */}
              {isDeeper && (
                <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded font-medium">
                  Sub-page
                </span>
              )}

              {/* Company badge */}
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      currentPage?.company === "CERE" ? "#06b6d4" : "#10b981",
                  }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {currentPage?.company}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  {currentPage?.slug}
                </span>
              </div>

              {/* Export Design Instructions */}
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-800/40 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors text-sm font-medium"
                title="Export design instructions for this page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export</span>
              </button>

              {/* Viewport toggle */}
              <div data-tour="viewport-toggle">
                <ResponsivePreview viewportSize={viewport} onViewportChange={setViewport} />
              </div>
            </div>
          </div>
        </div>

        {/* Page canvas */}
        <div
          className="flex-1 overflow-auto flex justify-center p-6 bg-slate-950"
          data-tour="page-canvas"
        >
          <div
            className="transition-all duration-300"
            style={{
              width: getViewportWidth(viewport),
              maxWidth: "100%",
            }}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Generating Page Content
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                  AI is creating content blocks for your {currentPage?.name} page.
                  This may take a few seconds...
                </p>
              </div>
            ) : (
              currentPage && (
              <LandingPageCanvas
                company={currentPage.company}
                sections={pageSections}
                pageId={selectedWireframePageId}
              />
              )
            )}
          </div>
        </div>
      </div>

      {/* Section Editor - Right sidebar (Resizable, shows when section is selected) */}
      {selectedSectionId && (
        <ResizableSidebar
          position="right"
          defaultWidth={360}
          minWidth={280}
          maxWidth={550}
          storageKey="wireframe-right-sidebar"
          className="bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-hidden"
          data-tour="section-editor"
        >
          <SectionEditor />
        </ResizableSidebar>
      )}

      {/* Export Modal */}
      {currentPage && (
        <PageExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          page={currentPage}
          sections={pageSections}
        />
      )}
    </div>
  );
}
