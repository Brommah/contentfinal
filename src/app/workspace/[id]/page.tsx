"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "@/components/canvas";
import { BlockPalette, BlockEditor, FilterToolbar } from "@/components/blocks";
import { ResizableSidebar } from "@/components/ui";
import { DashboardLayout, type TabType } from "@/components/dashboard";
import { WireframeDesigner } from "@/components/wireframe";
import { CEODashboard } from "@/components/ceo-dashboard";
import { RoadmapDesigner } from "@/components/roadmap";
import { ContentEditor } from "@/components/editor";
import { HealthDashboard } from "@/components/analytics";
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
import { useCanvasStore } from "@/lib/store";
import type { BlockData, ConnectionData } from "@/lib/types";

interface WorkspacePageProps {
  params: Promise<{ id: string }>;
}

/**
 * TourRegistrar - Registers all tours on mount
 */
function TourRegistrar() {
  const { registerTour } = useTour();

  useEffect(() => {
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
 * WorkspaceContent - Main workspace content wrapped in tour context
 */
function WorkspaceContent({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sidebarOpen, nodes, addNode } = useCanvasStore();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [quickStartMode, setQuickStartMode] = useState(false);

  // Tour context
  const { setActiveTab } = useTour();

  // Get active tab from URL params
  const activeTab = (searchParams.get("tab") as TabType) || "schema";

  // Sync active tab with tour context
  useEffect(() => {
    setActiveTab(activeTab);
  }, [activeTab, setActiveTab]);

  // Handle tab change
  const handleTabChange = useCallback((tab: TabType | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/workspace/${workspaceId}?${params.toString()}`);
  }, [router, searchParams, workspaceId]);

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
    onToggleQuickStart: () => setQuickStartMode((prev) => !prev),
  });

  return (
    <>
      {/* Register all tours */}
      <TourRegistrar />

      {/* Onboarding Tour */}
      <OnboardingTour />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={showHelp} onClose={closeHelp} />

      {/* Quick Start Mode */}
      <QuickStartMode
        isActive={quickStartMode}
        onToggle={() => setQuickStartMode(false)}
        onAction={handleQuickAction}
      />

      <DashboardLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        workspaceName={workspaceName}
        blockCount={nodes.length}
        extraToolbar={
          <div className="flex items-center gap-2">
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
        {activeTab === "schema" ? (
          <>
            {/* Filter Toolbar */}
            <FilterToolbar />

            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Left sidebar - Block Palette */}
              {leftSidebarOpen && (
                <ResizableSidebar
                  position="left"
                  defaultWidth={280}
                  minWidth={200}
                  maxWidth={450}
                  storageKey="workspace-left-sidebar"
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
                <Canvas />
              </main>

              {/* Right sidebar - Block Editor */}
              {sidebarOpen && (
                <ResizableSidebar
                  position="right"
                  defaultWidth={340}
                  minWidth={280}
                  maxWidth={550}
                  storageKey="workspace-right-sidebar"
                  className="bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-hidden"
                >
                  <BlockEditor />
                </ResizableSidebar>
              )}
            </div>
          </>
        ) : activeTab === "ceo-dashboard" ? (
          <CEODashboard onNavigate={handleTabChange} />
        ) : activeTab === "editor" ? (
          <ContentEditor />
        ) : activeTab === "wireframe" ? (
          <WireframeDesigner />
        ) : activeTab === "analytics" ? (
          <HealthDashboard />
        ) : (
          <RoadmapDesigner />
        )}
      </DashboardLayout>
    </>
  );
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const resolvedParams = use(params);
  const { setWorkspace, loadFromData } = useCanvasStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Loading...");

  // Load workspace data
  useEffect(() => {
    async function fetchWorkspace() {
      try {
        setLoading(true);
        const res = await fetch(`/api/workspaces/${resolvedParams.id}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            setError("Workspace not found");
          } else {
            setError("Failed to load workspace");
          }
          return;
        }

        const data = await res.json();
        setWorkspace(data.id, data.name);
        setWorkspaceName(data.name);
        
        // Load blocks and connections into store
        if (data.blocks && data.connections) {
          loadFromData(
            data.blocks as BlockData[],
            data.connections as ConnectionData[]
          );
        }
      } catch (err) {
        console.error("Error loading workspace:", err);
        setError("Failed to load workspace");
      } finally {
        setLoading(false);
      }
    }

    fetchWorkspace();
  }, [resolvedParams.id, setWorkspace, loadFromData]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The workspace you are looking for does not exist or could not be loaded.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <TourProvider initialTab="schema">
        <WorkspaceContent workspaceId={resolvedParams.id} workspaceName={workspaceName} />
      </TourProvider>
    </ReactFlowProvider>
  );
}
