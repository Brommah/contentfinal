"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "@/components/canvas";
import { BlockPalette, BlockEditor, FilterToolbar } from "@/components/blocks";
import { ResizableSidebar, ToastProvider } from "@/components/ui";
import { NotionSyncPanel } from "@/components/notion";
import { DashboardLayout, type TabType } from "@/components/dashboard";
import { WireframeDesigner } from "@/components/wireframe";
import { RoadmapDesigner } from "@/components/roadmap";
import { ContentEditor, ContentCreationWorkbench } from "@/components/editor";
import { CursorOverlay, ConflictBadge, ConflictResolverModal } from "@/components/collaboration";
import { CEODashboard } from "@/components/ceo-dashboard";
import { HealthDashboard } from "@/components/analytics";
import { HomePage as HomePageView } from "@/components/home";
import {
  TourProvider,
  useTour,
  OnboardingTour,
  TourLauncher,
  KeyboardShortcutsModal,
  useKeyboardShortcuts,
  QuickStartMode,
  introTour,
  schemaTour,
  editorTour,
  wireframeTour,
  roadmapTour,
  ceoDashboardTour,
  analyticsTour,
} from "@/components/onboarding";
import { NotificationBell, NotificationDropdown, useNotifications } from "@/components/notifications";
import { useCanvasStore } from "@/lib/store";
import { useAutoSave, useAutoSnapshot, useHistory } from "@/hooks";
import { useCollaboration } from "@/hooks/useCollaboration";
import { useConflictResolution } from "@/lib/conflict-resolution";
import { createSnapshot } from "@/lib/version-control";
import {
  allSeedBlocks,
  seedConnections,
  defaultWorkspace,
} from "@/lib/seed-data";
import type { BlockData, ConnectionData } from "@/lib/types";
import { GlobalSearch, BulkActionsMenu, SubmitForReviewModal } from "@/components/command";
import { BlockTemplatesLibrary } from "@/components/blocks";

/**
 * TourRegistrar - Registers all tours on mount
 */
function TourRegistrar() {
  const { registerTour } = useTour();

  useEffect(() => {
    // Register all tours
    registerTour(introTour);
    registerTour(schemaTour);
    registerTour(editorTour);
    registerTour(wireframeTour);
    registerTour(roadmapTour);
    registerTour(ceoDashboardTour);
    registerTour(analyticsTour);
  }, [registerTour]);

  return null;
}

/**
 * Demo Mode Component - runs entirely in-memory without database
 */
function DemoMode() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sidebarOpen, setWorkspace, loadFromData, nodes, edges, updateNode, addNode, selectedNodeIds, initWireframes, initRoadmap } = useCanvasStore();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Tour context
  const { setActiveTab, startTour, currentTour, registeredTours } = useTour();

  // Onboarding state
  const [quickStartMode, setQuickStartMode] = useState(false);
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  const [showTemplatesLibrary, setShowTemplatesLibrary] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Get active tab from URL params - default to Home
  const activeTab = (searchParams.get("tab") as TabType) || "home";
  
  // History (undo/redo) - only use when canvas is available
  const { saveSnapshot, undo, redo, canUndo, canRedo } = useHistory();

  // Sync active tab with tour context
  useEffect(() => {
    setActiveTab(activeTab);
  }, [activeTab, setActiveTab]);

  // Initialize wireframes and roadmap AFTER blocks are loaded
  // This ensures blocks can be linked to sections
  useEffect(() => {
    if (isLoaded && nodes.length > 0) {
      initWireframes();
      initRoadmap();
    }
  }, [isLoaded, nodes.length, initWireframes, initRoadmap]);

  // Auto-save hook
  const { syncStatus, saveNow } = useAutoSave(true);

  // Auto-snapshot hook for version control
  const { createSnapshot: triggerSnapshot } = useAutoSnapshot({
    enabled: true,
    interval: 5 * 60 * 1000, // 5 minutes
    minChanges: 3,
    onSnapshot: (snapshot) => {
      console.log("[AutoSnapshot] Created:", snapshot.label);
    },
  });

  // Notifications
  const {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll: clearNotifications,
    unreadCount,
    isOpen: notificationsOpen,
    setIsOpen: setNotificationsOpen,
  } = useNotifications();

  // Conflict resolution
  const { conflicts, pendingCount: conflictCount, resolveConflict } = useConflictResolution();

  // Collaboration hook
  const handleCollabUpdate = useCallback((update: unknown) => {
    // Handle updates from other users
    const { type, id, data } = update as { type: string; id: string; data: Partial<BlockData> };
    if (type === "node" && id && data) {
      updateNode(id, data);
    }
  }, [updateNode]);

  const { user, presence, cursors, isConnected } = useCollaboration({
    workspaceId: "demo",
    enabled: true,
    onUpdate: handleCollabUpdate,
  });

  // Handle tab change
  const handleTabChange = useCallback((tab: TabType | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/?${params.toString()}`);
  }, [router, searchParams]);

  // Quick start mode actions
  const handleQuickAction = useCallback((action: string) => {
    setQuickStartMode(false);
    
    switch (action) {
      case "add-value-prop":
        handleTabChange("schema");
        addNode({ type: "CORE_VALUE_PROP", title: "New Value Proposition", company: "SHARED" });
        break;
      case "add-pain-point":
        handleTabChange("schema");
        addNode({ type: "PAIN_POINT", title: "New Pain Point", company: "SHARED" });
        break;
      case "add-solution":
        handleTabChange("schema");
        addNode({ type: "SOLUTION", title: "New Solution", company: "SHARED" });
        break;
      case "add-feature":
        handleTabChange("schema");
        addNode({ type: "FEATURE", title: "New Feature", company: "SHARED" });
        break;
      case "submit-review":
        handleTabChange("ceo-dashboard");
        break;
      case "view-dashboard":
        handleTabChange("analytics");
        break;
    }
  }, [handleTabChange, addNode]);

  // Keyboard shortcuts hook
  const { showHelp, closeHelp } = useKeyboardShortcuts({
    onTabChange: handleTabChange,
    onNewBlock: () => {
      handleTabChange("schema");
      addNode({ type: "FEATURE", title: "New Block", company: "SHARED" });
    },
    onSave: () => {
      saveNow();
      createSnapshot("demo", nodes, edges, `Manual save at ${new Date().toLocaleTimeString()}`);
    },
    onToggleQuickStart: () => setQuickStartMode((prev) => !prev),
  });

  // Map tabs to their tour IDs
  const tabTourMap: Record<TabType, string> = {
    "home": "intro", // Home uses intro tour
    "ceo-dashboard": "ceo-dashboard",
    "schema": "intro", // Intro tour is the schema tour
    "editor": "editor",
    "wireframe": "wireframe",
    "roadmap": "roadmap",
    "analytics": "analytics",
    "content-creation": "editor", // Reuse editor tour for now
  };

  // Check if a tour was recently skipped (within 5 minutes - respects user dismissal but not too long)
  const wasTourRecentlySkipped = useCallback((tourId: string): boolean => {
    try {
      const stored = localStorage.getItem("cv-tour-dismissed-at");
      if (!stored) return false;
      
      const parsed = JSON.parse(stored);
      // Handle both old string format and new object format
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return false;
      }
      
      const skippedAt = parsed[tourId];
      if (!skippedAt) return false;
      
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      return new Date(skippedAt).getTime() > fiveMinutesAgo;
    } catch {
      return false;
    }
  }, []);

  // Track which tabs have had their tours started in this session (to prevent duplicate tour starts)
  const [tabsWithStartedTours, setTabsWithStartedTours] = useState<Set<TabType>>(new Set());

  // Check if first visit to tab in this session - start appropriate tour
  useEffect(() => {
    if (!isLoaded || currentTour) return;

    const tourIdForTab = tabTourMap[activeTab];
    
    // Already started a tour for this tab in this session? Skip.
    if (tabsWithStartedTours.has(activeTab)) return;
    
    // Check if tour is actually registered (prevents race condition)
    const isTourRegistered = registeredTours.some(t => t.id === tourIdForTab);
    
    // Wait for tours to be registered before proceeding
    if (!isTourRegistered) return;
    
    // Show tour if: First visit to this tab in THIS SESSION
    // (regardless of whether tour was completed before - show it fresh each session)
    // Only skip if user recently dismissed it (within 5 min)
    const shouldShowTour = 
      tourIdForTab && 
      !wasTourRecentlySkipped(tourIdForTab);
    
    if (shouldShowTour) {
      // Mark this tab as having its tour started (prevents re-triggering)
      setTabsWithStartedTours(prev => new Set(prev).add(activeTab));
      
      // Small delay to let the page render
      const timer = setTimeout(() => {
        startTour(tourIdForTab);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, activeTab, currentTour, startTour, wasTourRecentlySkipped, registeredTours, tabsWithStartedTours]);

  // Load demo data on mount
  useEffect(() => {
    // Only load once, regardless of nodes.length
    if (isLoaded) return;
    
    setWorkspace("demo", defaultWorkspace.name);

    // Convert seed blocks to BlockData format
    const blocks: BlockData[] = allSeedBlocks.map((block) => ({
      ...block,
      width: 280,
      height: 120,
      externalUrl: null,
      parentId: null,
      workspaceId: "demo",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Convert seed connections to ConnectionData format
    const connections: ConnectionData[] = seedConnections.map((conn) => ({
      ...conn,
      animated: conn.animated ?? false,
      style: null,
      workspaceId: "demo",
    }));

    loadFromData(blocks, connections);
    setIsLoaded(true);
  }, [isLoaded, setWorkspace, loadFromData]);

  return (
    <>
      {/* Register all tours */}
      <TourRegistrar />

      {/* Onboarding Tour - now context-aware */}
      <OnboardingTour />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={showHelp} onClose={closeHelp} />

      {/* Quick Start Mode */}
      <QuickStartMode
        isActive={quickStartMode}
        onToggle={() => setQuickStartMode(false)}
        onAction={handleQuickAction}
      />

      {/* Notifications Dropdown */}
      <NotificationDropdown
        isOpen={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearNotifications}
      />

      {/* Conflict Resolver */}
      <ConflictResolverModal
        isOpen={showConflictResolver}
        onClose={() => setShowConflictResolver(false)}
        onResolve={(blockId, field, value) => {
          updateNode(blockId, { [field]: value } as Partial<BlockData>);
        }}
      />

      <DashboardLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        workspaceName="CERE & CEF Schema"
        syncStatus={syncStatus}
        onSaveNow={saveNow}
        extraToolbar={
          <div className="flex items-center gap-2">
            {/* Notion Sync Panel */}
            <NotionSyncPanel />

            {/* Conflict badge */}
            <ConflictBadge count={conflictCount} onClick={() => setShowConflictResolver(true)} />
            
            {/* Notification bell */}
            <NotificationBell
              unreadCount={unreadCount}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            />

            {/* Quick start button */}
            <button
              onClick={() => setQuickStartMode(true)}
              data-tour="quick-start"
              className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              title="Quick Start Mode (⌘/)"
            >
              ⚡ Quick
            </button>

            {/* Tour Launcher */}
            <TourLauncher />
          </div>
        }
      >
        {/* Cursor overlay for collaboration */}
        {isConnected && cursors.length > 0 && (
          <CursorOverlay cursors={cursors} presence={presence} />
        )}

        {activeTab === "schema" ? (
        <>
          {/* Filter Toolbar */}
          <FilterToolbar />

          {/* Main content area */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left sidebar - Block Palette (Resizable) */}
            {leftSidebarOpen && (
              <ResizableSidebar
                position="left"
                defaultWidth={280}
                minWidth={200}
                maxWidth={450}
                storageKey="schema-left-sidebar"
                className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                <BlockPalette />
              </ResizableSidebar>
            )}

            {/* Toggle left sidebar button */}
            <button
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className="absolute top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-r-lg p-2 shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              style={{ left: leftSidebarOpen ? "var(--left-sidebar-width, 280px)" : "0" }}
            >
              <svg
                className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${
                  leftSidebarOpen ? "" : "rotate-180"
                }`}
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
            </button>

            {/* Canvas */}
            <main className="flex-1 relative">
              <Canvas
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                onShowTemplates={() => setShowTemplatesLibrary(true)}
              />
            </main>

            {/* Right sidebar - Block Editor (Resizable) */}
            {sidebarOpen && (
              <ResizableSidebar
                position="right"
                defaultWidth={340}
                minWidth={280}
                maxWidth={550}
                storageKey="schema-right-sidebar"
                className="bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-hidden"
              >
                <BlockEditor />
              </ResizableSidebar>
            )}
          </div>
        </>
        ) : activeTab === "home" ? (
          <HomePageView onNavigate={handleTabChange} />
        ) : activeTab === "ceo-dashboard" ? (
          <CEODashboard onNavigate={handleTabChange} />
        ) : activeTab === "editor" ? (
          <ContentEditor />
        ) : activeTab === "content-creation" ? (
          <ContentCreationWorkbench />
        ) : activeTab === "wireframe" ? (
          <WireframeDesigner />
        ) : activeTab === "analytics" ? (
          <HealthDashboard />
        ) : (
          <RoadmapDesigner />
        )}
      </DashboardLayout>

      {/* Global Search (⌘K) */}
      <GlobalSearch onNavigate={handleTabChange} />

      {/* Bulk Actions Context Menu */}
      <BulkActionsMenu />

      {/* Block Templates Library */}
      <BlockTemplatesLibrary
        isOpen={showTemplatesLibrary}
        onClose={() => setShowTemplatesLibrary(false)}
      />

      {/* Submit for Review Modal */}
      <SubmitForReviewModal
        blockIds={selectedNodeIds}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
      />
    </>
  );
}

/**
 * Main landing page
 */
export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-950 text-white">Loading...</div>}>
      <ReactFlowProvider>
        <ToastProvider>
          <TourProvider initialTab="schema">
            <DemoMode />
          </TourProvider>
        </ToastProvider>
      </ReactFlowProvider>
    </Suspense>
  );
}
