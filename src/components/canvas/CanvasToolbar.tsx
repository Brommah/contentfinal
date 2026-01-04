"use client";

import React, { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/lib/store";
import type { BlockData, Company, BlockType } from "@/lib/types";
import ExportModal from "./ExportModal";
import CanvasBookmarks from "./CanvasBookmarks";

/**
 * CanvasToolbar - Toolbar with layout, export, and view controls
 */
interface CanvasToolbarProps {
  onShowVersionHistory?: () => void;
  onShowTemplates?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export default function CanvasToolbar({ 
  onShowVersionHistory,
  onShowTemplates,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: CanvasToolbarProps = {}) {
  const { fitView, getNodes, setNodes, getEdges } = useReactFlow();
  const { nodes, selectedNodeIds, clearSelection } = useCanvasStore();
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  /**
   * Smart Auto-Layout using force-directed positioning
   * Groups blocks by company and type
   */
  const handleAutoLayout = async () => {
    setIsOrganizing(true);
    const currentNodes = getNodes();
    const edges = getEdges();

    // Group nodes by company
    const nodesByCompany: Record<Company, typeof currentNodes> = {
      CERE: [],
      CEF: [],
      SHARED: [],
    };

    currentNodes.forEach((node) => {
      const data = node.data as unknown as BlockData;
      if (data.company) {
        nodesByCompany[data.company].push(node);
      }
    });

    // Type hierarchy for vertical ordering
    const typeOrder: Record<BlockType, number> = {
      COMPANY: 0,
      CORE_VALUE_PROP: 1,
      TECH_COMPONENT: 2,
      FEATURE: 2,
      PAIN_POINT: 3,
      SOLUTION: 4,
      VERTICAL: 5,
      ARTICLE: 6,
      PAGE_ROOT: 0,
    };

    // Layout configuration
    const config = {
      colWidth: 400,
      rowHeight: 200,
      companyGap: 800,
      startX: 100,
      startY: 100,
    };

    // Position nodes by company and type
    const newNodes = currentNodes.map((node) => {
      const data = node.data as unknown as BlockData;
      const company = data.company || "SHARED";
      const companyIndex = company === "CERE" ? 0 : company === "CEF" ? 1 : 2;
      const companyNodes = nodesByCompany[company];
      const nodeIndex = companyNodes.findIndex((n) => n.id === node.id);

      // Sort by type within company
      const sortedCompanyNodes = [...companyNodes].sort((a, b) => {
        const aType = (a.data as unknown as BlockData).type;
        const bType = (b.data as unknown as BlockData).type;
        return (typeOrder[aType] || 99) - (typeOrder[bType] || 99);
      });

      const sortedIndex = sortedCompanyNodes.findIndex((n) => n.id === node.id);
      const typeRow = typeOrder[data.type] || 6;

      // Count nodes of same type before this one
      const sameTypeBefore = sortedCompanyNodes
        .slice(0, sortedIndex)
        .filter((n) => (n.data as unknown as BlockData).type === data.type).length;

      const x = config.startX + companyIndex * config.companyGap + sameTypeBefore * config.colWidth;
      const y = config.startY + typeRow * config.rowHeight;

      return {
        ...node,
        position: { x, y },
      };
    });

    setNodes(newNodes);
    
    // Animate to fit view
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 500 });
      setIsOrganizing(false);
    }, 100);
  };

  /**
   * Zoom to Selection - Focus on selected nodes
   */
  const handleZoomToSelection = () => {
    if (selectedNodeIds.length === 0) return;

    const selectedNodes = getNodes().filter((n) => selectedNodeIds.includes(n.id));
    if (selectedNodes.length === 0) return;

    // Calculate bounding box
    const minX = Math.min(...selectedNodes.map((n) => n.position.x));
    const maxX = Math.max(...selectedNodes.map((n) => n.position.x + 280));
    const minY = Math.min(...selectedNodes.map((n) => n.position.y));
    const maxY = Math.max(...selectedNodes.map((n) => n.position.y + 120));

    fitView({
      nodes: selectedNodes,
      padding: 0.5,
      duration: 500,
    });
  };

  /**
   * Export to Markdown (Notion/Confluence compatible)
   */
  const handleExportMarkdown = () => {
    const currentNodes = getNodes();
    const edges = getEdges();

    // Group by company and type
    const grouped: Record<string, Record<string, typeof currentNodes>> = {};
    
    currentNodes.forEach((node) => {
      const data = node.data as unknown as BlockData;
      const company = data.company || "SHARED";
      const type = data.type || "OTHER";
      
      if (!grouped[company]) grouped[company] = {};
      if (!grouped[company][type]) grouped[company][type] = [];
      grouped[company][type].push(node);
    });

    // Generate Markdown
    let markdown = `# Content Schema Export\n\n`;
    markdown += `_Exported: ${new Date().toLocaleDateString()}_\n\n`;
    markdown += `---\n\n`;

    Object.entries(grouped).forEach(([company, types]) => {
      markdown += `## ${company}\n\n`;
      
      Object.entries(types).forEach(([type, nodes]) => {
        markdown += `### ${type.replace(/_/g, " ")}\n\n`;
        
        nodes.forEach((node) => {
          const data = node.data as unknown as BlockData;
          markdown += `#### ${data.title}\n\n`;
          if (data.subtitle) markdown += `> ${data.subtitle}\n\n`;
          if (data.content) markdown += `${data.content}\n\n`;
          if (data.tags?.length) markdown += `**Tags:** ${data.tags.join(", ")}\n\n`;
          markdown += `**Status:** ${data.status}\n\n`;
          markdown += `---\n\n`;
        });
      });
    });

    // Download file
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-schema-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  /**
   * Export to JSON
   */
  const handleExportJSON = () => {
    const currentNodes = getNodes();
    const edges = getEdges();

    const data = {
      exportedAt: new Date().toISOString(),
      blocks: currentNodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: n.data,
      })),
      connections: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        data: e.data,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-schema-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2" data-tour="toolbar">
      {/* Undo/Redo Buttons */}
      <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed border-r border-gray-200 dark:border-gray-700"
          title="Undo (⌘Z)"
        >
          ↩️
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (⌘⇧Z)"
        >
          ↪️
        </button>
      </div>

      {/* Canvas Bookmarks */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <CanvasBookmarks />
      </div>

      {/* Templates Library */}
      {onShowTemplates && (
        <button
          onClick={onShowTemplates}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
          title="Block Templates Library"
        >
          <span>📚</span>
          <span>Templates</span>
        </button>
      )}

      {/* Auto Layout Button */}
      <button
        onClick={handleAutoLayout}
        disabled={isOrganizing}
        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50"
        title="Auto-organize blocks by company and type"
      >
        {isOrganizing ? (
          <span className="animate-spin">⚙️</span>
        ) : (
          <span>🧩</span>
        )}
        <span>Organize</span>
      </button>

      {/* Zoom to Selection */}
      {selectedNodeIds.length > 0 && (
        <button
          onClick={handleZoomToSelection}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
          title="Zoom to selected blocks"
        >
          <span>🔍</span>
          <span>Focus</span>
        </button>
      )}

      {/* Version History Button */}
      {onShowVersionHistory && (
        <button
          onClick={onShowVersionHistory}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
          title="View version history and compare changes"
        >
          <span>🕐</span>
          <span>History</span>
        </button>
      )}

      {/* Export Menu */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          <span>📤</span>
          <span>Export</span>
        </button>

        {showExportMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => {
                setShowExportModal(true);
                setShowExportMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
            >
              <span>📤</span>
              <span>Export Options...</span>
            </button>
            <button
              onClick={handleExportMarkdown}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <span>📝</span>
              <span>Quick Markdown</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <span>📦</span>
              <span>Quick JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}

