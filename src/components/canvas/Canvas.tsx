"use client";

import React, { useCallback, useRef, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type OnSelectionChangeFunc,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  SelectionMode,
  type Node,
} from "@xyflow/react";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, COMPANY_COLORS, type BlockType, type Company, type BlockStatus, type BlockData } from "@/lib/types";
import ContentBlockNode from "./ContentBlockNode";
import ContentConnectionEdge from "./ContentConnectionEdge";
import SelectionToolbar from "./SelectionToolbar";
import CanvasToolbar from "./CanvasToolbar";
import BlockTemplates from "./BlockTemplates";
import VersionHistory from "./VersionHistory";
import InlineEditor from "./InlineEditor";

// Custom node types
const nodeTypes = {
  contentBlock: ContentBlockNode,
};

// Custom edge types
const edgeTypes = {
  contentConnection: ContentConnectionEdge,
};

interface CanvasProps {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onShowTemplates?: () => void;
}

/**
 * Main Canvas component - infinite canvas with React Flow
 * Provides pan/zoom, grid, minimap, and node management
 */
export default function Canvas({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onShowTemplates,
}: CanvasProps = {}) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView, getNodes, getEdges } = useReactFlow();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [inlineEditor, setInlineEditor] = useState<{
    blockId: string;
    position: { x: number; y: number };
  } | null>(null);

  const {
    nodes,
    edges,
    filters,
    draggedBlockType,
    selectedNodeIds,
    focusNodeId,
    setNodes,
    setEdges,
    updateNodePosition,
    addNode,
    addEdge,
    selectNode,
    selectNodes,
    selectEdge,
    clearSelection,
    setDraggedBlockType,
    clearFocusNode,
  } = useCanvasStore();

  // Filter nodes based on current filters
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const data = node.data as { company: Company; status: string; type: BlockType; title: string };
      
      // Company filter
      if (!filters.companies.includes(data.company)) return false;
      
      // Status filter
      if (!filters.statuses.includes(data.status as "LIVE" | "VISION" | "DRAFT" | "ARCHIVED")) return false;
      
      // Type filter
      if (!filters.types.includes(data.type)) return false;
      
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const title = (data.title || "").toLowerCase();
        if (!title.includes(query)) return false;
      }
      
      return true;
    });
  }, [nodes, filters]);

  // Filter edges to only show connections between visible nodes
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter(
      (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [edges, filteredNodes]);

  // Zoom to focused node when navigating from other views (e.g., CEO Dashboard)
  useEffect(() => {
    if (focusNodeId) {
      const nodeToFocus = nodes.find((n) => n.id === focusNodeId);
      if (nodeToFocus) {
        // Small delay to ensure React Flow is ready
        setTimeout(() => {
          fitView({
            nodes: [nodeToFocus],
            padding: 0.5,
            duration: 500,
            maxZoom: 1.5,
          });
          clearFocusNode();
        }, 100);
      }
    }
  }, [focusNodeId, nodes, fitView, clearFocusNode]);

  // Handle node changes (position, selection, removal)
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes(applyNodeChanges(changes, nodes) as Node<BlockData>[]);
    },
    [nodes, setNodes]
  );

  // Handle edge changes
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges]
  );

  // Handle new connection between nodes
  const onConnect: OnConnect = useCallback(
    (params) => {
      if (params.source && params.target) {
        addEdge({
          fromBlockId: params.source,
          toBlockId: params.target,
          relationshipType: "FLOWS_INTO",
          animated: true,
        });
      }
    },
    [addEdge]
  );

  // Handle node drag end - save position
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, node.position.x, node.position.y);
    },
    [updateNodePosition]
  );

  // Handle selection changes (supports multi-select)
  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      if (selectedNodes.length > 0) {
        selectNodes(selectedNodes.map((n) => n.id));
      } else if (selectedEdges.length > 0) {
        selectEdge(selectedEdges[0].id);
      } else {
        clearSelection();
      }
    },
    [selectNodes, selectEdge, clearSelection]
  );

  // Handle pane click to deselect
  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Handle double-click on node for inline quick edit
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Open inline editor at click position
      setInlineEditor({
        blockId: node.id,
        position: { x: event.clientX, y: event.clientY },
      });
    },
    []
  );

  // Handle Alt+double-click to focus on connected nodes (old behavior)
  const handleFocusOnConnected = useCallback(
    (nodeId: string) => {
      const connectedNodeIds = new Set<string>([nodeId]);
      const allEdges = getEdges();
      
      allEdges.forEach((edge) => {
        if (edge.source === nodeId) connectedNodeIds.add(edge.target);
        if (edge.target === nodeId) connectedNodeIds.add(edge.source);
      });

      const allNodes = getNodes();
      const nodesToFocus = allNodes.filter((n) => connectedNodeIds.has(n.id));

      if (nodesToFocus.length > 0) {
        fitView({
          nodes: nodesToFocus,
          padding: 0.3,
          duration: 500,
        });
        selectNodes(Array.from(connectedNodeIds));
      }
    },
    [getEdges, getNodes, fitView, selectNodes]
  );

  // Handle drop from palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !draggedBlockType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const config = BLOCK_CONFIGS[draggedBlockType];

      addNode({
        type: draggedBlockType,
        company: "SHARED",
        title: `New ${config.label}`,
        positionX: position.x,
        positionY: position.y,
      });

      setDraggedBlockType(null);
    },
    [draggedBlockType, screenToFlowPosition, addNode, setDraggedBlockType]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Minimap node color function
  const minimapNodeColor = useCallback((node: Node) => {
    const data = node.data as { company: Company };
    return COMPANY_COLORS[data.company]?.primary || "#9ca3af";
  }, []);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full" data-tour="canvas">
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: "contentConnection",
          animated: true,
        }}
        connectionLineStyle={{ stroke: "#3b82f6", strokeWidth: 2 }}
        minZoom={0.1}
        maxZoom={4}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode={["Shift", "Meta", "Control"]}
        selectionKeyCode="Shift"
        selectionMode={SelectionMode.Partial}
        panOnDrag
        panOnScroll
        zoomOnScroll
        className="bg-canvas-bg"
      >
        {/* Background grid */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--canvas-grid)"
        />

        {/* Zoom/pan controls */}
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!shadow-md"
        />

        {/* Floating Action Button - Quick Add */}
        <Panel position="bottom-center" className="mb-6">
          <button
            onClick={() => setShowTemplates(true)}
            className="
              group flex items-center gap-2 px-6 py-3 
              bg-gradient-to-r from-cyan-500 to-blue-500 
              hover:from-cyan-400 hover:to-blue-400
              text-white font-semibold rounded-full 
              shadow-lg shadow-cyan-500/25 
              transition-all duration-300 
              hover:shadow-xl hover:shadow-cyan-500/40
              hover:scale-105 active:scale-95
            "
            title="Add a new content block (Press 'T' for templates)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Block</span>
            <kbd className="hidden group-hover:inline-block ml-2 px-1.5 py-0.5 text-[10px] bg-white/20 rounded">T</kbd>
          </button>
        </Panel>

        {/* Minimap for navigation */}
        <MiniMap
          position="bottom-right"
          nodeColor={minimapNodeColor}
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!rounded-lg !border"
        />

        {/* Stats panel */}
        <Panel position="top-left" className="glass rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span>{filteredNodes.length} blocks</span>
            <span>{filteredEdges.length} connections</span>
            <button
              onClick={() => setShowTemplates(true)}
              className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
            >
              + Template
            </button>
          </div>
        </Panel>

        {/* Selection toolbar for bulk actions */}
        {selectedNodeIds.length > 1 && (
          <SelectionToolbar />
        )}
      </ReactFlow>

      {/* Toolbar with organize/export */}
      <CanvasToolbar 
        onShowVersionHistory={() => setShowVersionHistory(true)}
        onShowTemplates={onShowTemplates}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />

      {/* Block Templates Modal */}
      {showTemplates && <BlockTemplates onClose={() => setShowTemplates(false)} />}

      {/* Version History Modal */}
      {showVersionHistory && <VersionHistory onClose={() => setShowVersionHistory(false)} />}

      {/* Inline Editor Popover */}
      {inlineEditor && (
        <InlineEditor
          blockId={inlineEditor.blockId}
          position={inlineEditor.position}
          onClose={() => setInlineEditor(null)}
        />
      )}
    </div>
  );
}

