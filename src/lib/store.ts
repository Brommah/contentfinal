import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import type { Node, Edge, Viewport } from "@xyflow/react";
import type {
  BlockData,
  BlockComment,
  ConnectionData,
  BlockType,
  BlockStatus,
  FilterOptions,
  Company,
  ContentSuggestion,
  SuggestionStatus,
  PageReview,
  PageReviewStatus,
  ReviewRequest,
  ReviewRequestStatus,
  ReviewResolution,
  BlockRevision,
  BlockUsage,
  ContentRecommendation,
  GovernanceMetrics,
} from "./types";
import { canTransitionTo, getAvailableTransitions } from "./types";
import type { WireframeSection, SectionType, SectionConfig } from "./wireframe-types";
import { DEFAULT_SECTION_CONFIGS, getDefaultWireframe, getWireframeForPage, isDeeperPage, getPageRootBlockId } from "./wireframe-types";
import type { RoadmapPhase, RoadmapItem, RoadmapStatus, Milestone } from "./roadmap-types";
import { getDefaultPhases, getSampleRoadmapItems, getDefaultMilestones } from "./roadmap-types";
import { nanoid } from "nanoid";

// ============ LINKED BLOCKS STATUS (for roadmap sync) ============

export interface LinkedBlocksStatus {
  total: number;
  byStatus: Partial<Record<BlockStatus, number>>;
  allApproved: boolean;
  allLive: boolean;
  hasIssues: boolean;
  readyToPublish: boolean;
}

// Convert BlockData to React Flow Node
export function blockToNode(block: BlockData): Node<BlockData> {
  return {
    id: block.id,
    type: "contentBlock",
    position: { x: block.positionX, y: block.positionY },
    data: {
      ...block,
    },
    style: {
      width: block.width,
      height: block.height,
    },
  };
}

// Convert ConnectionData to React Flow Edge
export function connectionToEdge(connection: ConnectionData): Edge {
  return {
    id: connection.id,
    source: connection.fromBlockId,
    target: connection.toBlockId,
    type: "contentConnection",
    animated: connection.animated,
    data: {
      relationshipType: connection.relationshipType,
      label: connection.label,
    },
  };
}

// Store state interface
interface CanvasState {
  // Workspace
  workspaceId: string | null;
  workspaceName: string;

  // Nodes and edges
  nodes: Node<BlockData>[];
  edges: Edge[];

  // Favorites (starred blocks for quick access)
  favoriteBlockIds: string[];

  // Selection (supports multi-select)
  selectedNodeIds: string[];
  selectedEdgeId: string | null;

  // Sidebar
  sidebarOpen: boolean;

  // Filters
  filters: FilterOptions;

  // Viewport
  viewport: Viewport;

  // Mode
  isConnecting: boolean;
  connectingFromId: string | null;
  draggedBlockType: BlockType | null;
  
  // Focus - for zooming to a specific node from other views
  focusNodeId: string | null;

  // Actions
  focusOnNode: (id: string) => void;
  clearFocusNode: () => void;
  setWorkspace: (id: string, name: string) => void;
  setNodes: (nodes: Node<BlockData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (block: Partial<BlockData>) => Node<BlockData>;
  updateNode: (id: string, data: Partial<BlockData>) => void;
  updateMultipleNodes: (ids: string[], data: Partial<BlockData>) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  removeNode: (id: string) => void;
  removeSelectedNodes: () => void;
  addEdge: (connection: Partial<ConnectionData>) => Edge;
  updateEdge: (id: string, data: Partial<ConnectionData>) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  selectNodes: (ids: string[]) => void;
  toggleNodeSelection: (id: string) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;
  toggleSidebar: (open?: boolean) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  setViewport: (viewport: Viewport) => void;
  startConnecting: (fromId: string) => void;
  finishConnecting: (toId: string) => void;
  cancelConnecting: () => void;
  setDraggedBlockType: (type: BlockType | null) => void;
  loadFromData: (blocks: BlockData[], connections: ConnectionData[]) => void;

  // Wireframe state
  wireframeSections: WireframeSection[];
  selectedSectionId: string | null;
  selectedWireframePageId: string | null;
  
  // Wireframe actions
  initWireframes: () => void;
  addWireframeSection: (company: Company, type: SectionType, pageId?: string) => WireframeSection;
  updateWireframeSection: (id: string, updates: Partial<WireframeSection>) => void;
  removeWireframeSection: (id: string) => void;
  reorderSections: (company: Company, sectionIds: string[]) => void;
  linkBlockToSection: (sectionId: string, blockId: string) => void;
  unlinkBlockFromSection: (sectionId: string, blockId: string) => void;
  selectSection: (id: string | null) => void;
  selectWireframePage: (pageId: string | null) => void;
  updateSectionConfig: (id: string, config: SectionConfig) => void;

  // Page block management for deeper pages
  pageBlocksLoading: Record<string, boolean>;
  pageBlocksGenerated: Record<string, boolean>;
  getBlocksForPage: (pageId: string) => BlockData[];
  getPageRootBlock: (pageId: string) => BlockData | undefined;
  hasPageBlocks: (pageId: string) => boolean;
  setPageBlocksLoading: (pageId: string, loading: boolean) => void;
  setPageBlocksGenerated: (pageId: string, generated: boolean) => void;
  addGeneratedBlocks: (blocks: BlockData[]) => void;

  // Roadmap state
  roadmapPhases: RoadmapPhase[];
  roadmapItems: RoadmapItem[];
  milestones: Milestone[];
  selectedRoadmapItemId: string | null;
  selectedMilestoneId: string | null;

  // Block comments for review
  blockComments: Record<string, Array<{
    id: string;
    author: string;
    authorAvatar: string;
    content: string;
    timestamp: Date;
    isResolved: boolean;
  }>>;
  addBlockComment: (blockId: string, comment: {
    id: string;
    author: string;
    authorAvatar: string;
    content: string;
    timestamp: Date;
    isResolved: boolean;
  }) => void;
  resolveBlockComment: (blockId: string, commentId: string) => void;

  // Roadmap actions
  initRoadmap: () => void;
  addRoadmapItem: (item: Omit<RoadmapItem, "id">) => RoadmapItem;
  updateRoadmapItem: (id: string, updates: Partial<RoadmapItem>) => void;
  removeRoadmapItem: (id: string) => void;
  updateRoadmapItemStatus: (id: string, status: RoadmapStatus) => void;
  linkBlockToRoadmapItem: (itemId: string, blockId: string) => void;
  unlinkBlockFromRoadmapItem: (itemId: string, blockId: string) => void;
  selectRoadmapItem: (id: string | null) => void;
  addRoadmapPhase: (phase: Omit<RoadmapPhase, "id">) => RoadmapPhase;
  updateRoadmapPhase: (id: string, updates: Partial<RoadmapPhase>) => void;
  
  // Milestone actions
  addMilestone: (milestone: Omit<Milestone, "id">) => Milestone;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  removeMilestone: (id: string) => void;
  selectMilestone: (id: string | null) => void;
  linkItemToMilestone: (milestoneId: string, itemId: string) => void;
  unlinkItemFromMilestone: (milestoneId: string, itemId: string) => void;
  getMilestoneProgress: (milestoneId: string) => { total: number; completed: number; percentage: number };

  // CEO Dashboard state
  suggestions: ContentSuggestion[];
  pageReviews: PageReview[];

  // CEO Dashboard actions
  addSuggestion: (suggestion: Omit<ContentSuggestion, "id" | "submittedAt" | "status">) => ContentSuggestion;
  updateSuggestion: (id: string, updates: Partial<ContentSuggestion>) => void;
  removeSuggestion: (id: string) => void;
  approveSuggestion: (id: string, comment?: string) => void;
  rejectSuggestion: (id: string, comment?: string) => void;
  
  addPageReview: (pageId: string, pageName: string, company: Company, submittedBy: string) => PageReview;
  updatePageReview: (pageId: string, updates: Partial<PageReview>) => void;
  approvePageReview: (pageId: string, comment?: string) => void;
  requestPageChanges: (pageId: string, comment: string) => void;
  
  // Helper: Submit content for review
  submitBlockForReview: (blockId: string) => void;
  approveBlock: (blockId: string) => void;
  requestBlockChanges: (blockId: string) => void;

  // Comments system
  addComment: (blockId: string, authorName: string, content: string, mentions?: string[]) => BlockComment;
  replyToComment: (blockId: string, commentId: string, authorName: string, content: string) => void;
  resolveComment: (blockId: string, commentId: string) => void;
  deleteComment: (blockId: string, commentId: string) => void;

  // Batch approval actions
  batchApproveBlocks: (blockIds: string[]) => void;
  batchRejectBlocks: (blockIds: string[]) => void;
  batchSetStatus: (blockIds: string[], status: BlockStatus) => void;

  // Block ownership
  setBlockOwner: (blockId: string, ownerId: string, ownerName: string) => void;

  // ============ LIFECYCLE ENFORCEMENT ============
  
  // Check if status transition is valid
  canChangeStatus: (blockId: string, newStatus: BlockStatus) => boolean;
  // Get available transitions for a block
  getAvailableStatusTransitions: (blockId: string) => BlockStatus[];
  // Transition block status with validation
  transitionBlockStatus: (blockId: string, newStatus: BlockStatus) => { success: boolean; error?: string };
  // Publish approved block (APPROVED -> LIVE)
  publishBlock: (blockId: string) => { success: boolean; error?: string };
  
  // ============ REVISION SYSTEM ============
  
  blockRevisions: BlockRevision[];
  // Create a revision of a LIVE block (creates a draft copy for editing)
  createRevision: (blockId: string, createdBy: string, createdByName: string, comment?: string) => BlockRevision | null;
  // Get revisions for a block
  getBlockRevisions: (blockId: string) => BlockRevision[];
  // Restore a specific revision
  restoreRevision: (revisionId: string) => void;
  
  // ============ REVIEW REQUESTS ============
  
  reviewRequests: ReviewRequest[];
  // Create a new review request
  createReviewRequest: (
    blockIds: string[],
    requestedBy: { id: string; name: string; avatar?: string },
    reviewerId: string,
    reviewerName: string,
    dueBy: Date,
    context: string
  ) => ReviewRequest;
  // Update review request status
  updateReviewRequest: (id: string, updates: Partial<ReviewRequest>) => void;
  // Complete a review request
  completeReviewRequest: (id: string, resolution: ReviewResolution, comment?: string) => void;
  // Cancel a review request
  cancelReviewRequest: (id: string) => void;
  // Get pending review requests for a reviewer
  getPendingReviewsForReviewer: (reviewerId: string) => ReviewRequest[];
  // Get review requests by requester
  getReviewRequestsByRequester: (requesterId: string) => ReviewRequest[];
  
  // ============ IMPACT ANALYSIS ============
  
  // Get usage information for a block
  getBlockUsage: (blockId: string) => BlockUsage;
  // Check if a block has any usages
  hasBlockUsage: (blockId: string) => boolean;
  
  // ============ ROADMAP-CONTENT SYNC ============
  
  // Get status of all linked blocks for a roadmap item
  getLinkedBlocksStatus: (itemId: string) => LinkedBlocksStatus;
  // Publish all approved blocks linked to a roadmap item
  publishAllLinkedBlocks: (itemId: string) => { published: number; failed: number };
  // Auto-suggest roadmap status based on linked block status
  getSuggestedRoadmapStatus: (itemId: string) => RoadmapStatus | null;
  
  // ============ GOVERNANCE ============
  
  // Generate recommendations based on current state
  generateRecommendations: () => ContentRecommendation[];
  // Calculate governance metrics
  calculateGovernanceMetrics: () => GovernanceMetrics;
  
  // ============ FAVORITES ============
  
  // Toggle block favorite status
  toggleFavorite: (blockId: string) => void;
  // Check if block is favorite
  isFavorite: (blockId: string) => boolean;
  // Get all favorite blocks
  getFavoriteBlocks: () => Node<BlockData>[];
}

const defaultFilters: FilterOptions = {
  companies: ["CERE", "CEF", "SHARED"],
  statuses: ["LIVE", "VISION", "DRAFT", "PENDING_REVIEW", "APPROVED", "NEEDS_CHANGES"],
  types: [
    "COMPANY",
    "PAGE_ROOT",
    "CORE_VALUE_PROP",
    "PAIN_POINT",
    "SOLUTION",
    "FEATURE",
    "VERTICAL",
    "ARTICLE",
    "TECH_COMPONENT",
  ],
  searchQuery: "",
};

export const useCanvasStore = create<CanvasState>()(
  devtools(
    (set, get) => ({
      // Initial state
      workspaceId: null,
      workspaceName: "Untitled Workspace",
      nodes: [],
      edges: [],
      favoriteBlockIds: [],
      selectedNodeIds: [],
      selectedEdgeId: null,
      sidebarOpen: true,
      filters: defaultFilters,
      viewport: { x: 0, y: 0, zoom: 1 },
      isConnecting: false,
      connectingFromId: null,
      draggedBlockType: null,
      focusNodeId: null,

      // Focus actions
      focusOnNode: (id) => {
        set({
          focusNodeId: id,
          selectedNodeIds: [id],
          selectedEdgeId: null,
          sidebarOpen: true,
        });
      },

      clearFocusNode: () => {
        set({ focusNodeId: null });
      },

      // Actions
      setWorkspace: (id, name) => set({ workspaceId: id, workspaceName: name }),

      setNodes: (nodes) => set({ nodes }),

      setEdges: (edges) => set({ edges }),

      addNode: (block) => {
        const id = block.id || nanoid();
        const newNode: Node<BlockData> = {
          id,
          type: "contentBlock",
          position: { x: block.positionX || 0, y: block.positionY || 0 },
          data: {
            id,
            type: block.type || "FEATURE",
            company: block.company || "SHARED",
            status: block.status || "DRAFT",
            title: block.title || "New Block",
            subtitle: block.subtitle || null,
            content: block.content || null,
            tags: block.tags || [],
            positionX: block.positionX || 0,
            positionY: block.positionY || 0,
            width: block.width || 280,
            height: block.height || 120,
            externalUrl: block.externalUrl || null,
            parentId: block.parentId || null,
            workspaceId: get().workspaceId || "",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          style: {
            width: block.width || 280,
            height: block.height || 120,
          },
        };

        set((state) => ({
          nodes: [...state.nodes, newNode],
          selectedNodeIds: [id],
          sidebarOpen: true,
        }));

        return newNode;
      },

      updateNode: (id, data) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    ...data,
                    updatedAt: new Date(),
                  },
                  style: {
                    ...node.style,
                    width: data.width ?? node.style?.width,
                    height: data.height ?? node.style?.height,
                  },
                }
              : node
          ),
        }));
      },

      updateMultipleNodes: (ids, data) => {
        const idSet = new Set(ids);
        set((state) => ({
          nodes: state.nodes.map((node) =>
            idSet.has(node.id)
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    ...data,
                    updatedAt: new Date(),
                  },
                  style: {
                    ...node.style,
                    width: data.width ?? node.style?.width,
                    height: data.height ?? node.style?.height,
                  },
                }
              : node
          ),
        }));
      },

      updateNodePosition: (id, x, y) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  position: { x, y },
                  data: {
                    ...node.data,
                    positionX: x,
                    positionY: y,
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      removeNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          edges: state.edges.filter(
            (edge) => edge.source !== id && edge.target !== id
          ),
          selectedNodeIds: state.selectedNodeIds.filter((nodeId) => nodeId !== id),
          sidebarOpen: state.selectedNodeIds.length === 1 && state.selectedNodeIds[0] === id ? false : state.sidebarOpen,
        }));
      },

      removeSelectedNodes: () => {
        const { selectedNodeIds } = get();
        if (selectedNodeIds.length === 0) return;
        const idSet = new Set(selectedNodeIds);
        set((state) => ({
          nodes: state.nodes.filter((node) => !idSet.has(node.id)),
          edges: state.edges.filter(
            (edge) => !idSet.has(edge.source) && !idSet.has(edge.target)
          ),
          selectedNodeIds: [],
          sidebarOpen: false,
        }));
      },

      addEdge: (connection) => {
        const id = connection.id || nanoid();
        const newEdge: Edge = {
          id,
          source: connection.fromBlockId || "",
          target: connection.toBlockId || "",
          type: "contentConnection",
          animated: connection.animated || false,
          data: {
            relationshipType: connection.relationshipType || "REFERENCES",
            label: connection.label || null,
          },
        };

        set((state) => ({
          edges: [...state.edges, newEdge],
        }));

        return newEdge;
      },

      updateEdge: (id, data) => {
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === id
              ? {
                  ...edge,
                  animated: data.animated ?? edge.animated,
                  data: {
                    ...edge.data,
                    relationshipType:
                      data.relationshipType ?? edge.data?.relationshipType,
                    label: data.label ?? edge.data?.label,
                  },
                }
              : edge
          ),
        }));
      },

      removeEdge: (id) => {
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== id),
          selectedEdgeId:
            state.selectedEdgeId === id ? null : state.selectedEdgeId,
        }));
      },

      selectNode: (id) => {
        set({
          selectedNodeIds: id ? [id] : [],
          selectedEdgeId: null,
          sidebarOpen: id !== null,
        });
      },

      selectNodes: (ids) => {
        set({
          selectedNodeIds: ids,
          selectedEdgeId: null,
          sidebarOpen: ids.length > 0,
        });
      },

      toggleNodeSelection: (id) => {
        set((state) => {
          const isSelected = state.selectedNodeIds.includes(id);
          const newSelection = isSelected
            ? state.selectedNodeIds.filter((nodeId) => nodeId !== id)
            : [...state.selectedNodeIds, id];
          return {
            selectedNodeIds: newSelection,
            selectedEdgeId: null,
            sidebarOpen: newSelection.length > 0,
          };
        });
      },

      selectEdge: (id) => {
        set({
          selectedNodeIds: [],
          selectedEdgeId: id,
        });
      },

      clearSelection: () => {
        set({
          selectedNodeIds: [],
          selectedEdgeId: null,
          sidebarOpen: false,
        });
      },

      toggleSidebar: (open) => {
        set((state) => ({
          sidebarOpen: open !== undefined ? open : !state.sidebarOpen,
        }));
      },

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      resetFilters: () => {
        set({ filters: defaultFilters });
      },

      setViewport: (viewport) => {
        set({ viewport });
      },

      startConnecting: (fromId) => {
        set({
          isConnecting: true,
          connectingFromId: fromId,
        });
      },

      finishConnecting: (toId) => {
        const { connectingFromId, addEdge } = get();
        if (connectingFromId && connectingFromId !== toId) {
          addEdge({
            fromBlockId: connectingFromId,
            toBlockId: toId,
            relationshipType: "FLOWS_INTO",
          });
        }
        set({
          isConnecting: false,
          connectingFromId: null,
        });
      },

      cancelConnecting: () => {
        set({
          isConnecting: false,
          connectingFromId: null,
        });
      },

      setDraggedBlockType: (type) => {
        set({ draggedBlockType: type });
      },

      loadFromData: (blocks, connections) => {
        const nodes = blocks.map(blockToNode);
        const edges = connections.map(connectionToEdge);
        set({ nodes, edges });
      },

      // Wireframe state
      wireframeSections: [],
      selectedSectionId: null,
      selectedWireframePageId: null,
      
      // Page block management state
      pageBlocksLoading: {},
      pageBlocksGenerated: {},

      // Wireframe actions
      initWireframes: () => {
        const { wireframeSections, nodes } = get();
        
        // Check if sections exist and have linked blocks
        const hasLinkedBlocks = wireframeSections.some((s) => s.linkedBlockIds.length > 0);
        
        // Skip if already initialized with linked blocks
        if (wireframeSections.length > 0 && hasLinkedBlocks) return;
        
        // If sections exist but no blocks linked, we need to re-initialize with blocks
        // This handles the case where wireframes were created before blocks were loaded

        // Import DEFAULT_PAGES dynamically to avoid circular deps
        const { DEFAULT_PAGES } = require("./wireframe-types");
        
        // Load saved section statuses from localStorage
        let savedStatuses: Record<string, string> = {};
        try {
          savedStatuses = JSON.parse(localStorage.getItem("wireframe-section-statuses") || "{}");
        } catch (e) {
          // Silently ignore localStorage errors
        }
        
        // Create sections for all pages
        const allSections: WireframeSection[] = [];
        
        for (const page of DEFAULT_PAGES) {
          // Use appropriate wireframe based on page depth
          const pageSections = getWireframeForPage(page.id, page.company);
          const isDeeper = isDeeperPage(page.id);
          const pageRootId = isDeeper ? getPageRootBlockId(page.id) : null;
          
          // Auto-link blocks to sections based on type
          const linkedSections = pageSections.map((section) => {
            const linkedBlocks = nodes.filter((node) => {
              const data = node.data as unknown as BlockData;
              if (data.company !== section.company && data.company !== "SHARED") return false;

              // For deeper pages, only link blocks that have matching parentId
              if (isDeeper && pageRootId) {
                if (data.parentId !== pageRootId) return false;
              }

              switch (section.type) {
                case "HERO":
                  return data.type === "COMPANY" || data.type === "CORE_VALUE_PROP";
                case "VALUE_PROPS":
                  return data.type === "CORE_VALUE_PROP";
                case "PAIN_POINTS":
                  return data.type === "PAIN_POINT";
                case "SOLUTIONS":
                  return data.type === "SOLUTION";
                case "FEATURES":
                  return data.type === "FEATURE" || data.type === "TECH_COMPONENT";
                case "VERTICALS":
                  return data.type === "VERTICAL";
                case "CONTENT":
                  return data.type === "ARTICLE" || data.type === "FEATURE";
                default:
                  return false;
              }
            });

            // Restore saved status if available
            const savedStatus = savedStatuses[section.id] as BlockStatus | undefined;

            return {
              ...section,
              linkedBlockIds: linkedBlocks.map((n) => n.id),
              status: savedStatus || section.status,
            } as WireframeSection;
          });
          
          allSections.push(...linkedSections);
        }

        set({ wireframeSections: allSections });
      },

      addWireframeSection: (company, type, pageId) => {
        const { wireframeSections } = get();
        const pageSections = wireframeSections.filter((s) => s.pageId === pageId);
        const maxOrder = Math.max(...pageSections.map((s) => s.order), -1);

        const newSection: WireframeSection = {
          id: nanoid(),
          type,
          company,
          pageId: pageId || `${company.toLowerCase()}-home`,
          linkedBlockIds: [],
          order: maxOrder + 1,
          config: DEFAULT_SECTION_CONFIGS[type],
          status: "DRAFT",
        };

        set({ wireframeSections: [...wireframeSections, newSection] });
        return newSection;
      },

      updateWireframeSection: (id, updates) => {
        set((state) => ({
          wireframeSections: state.wireframeSections.map((section) =>
            section.id === id ? { ...section, ...updates } : section
          ),
        }));
        
        // Persist section statuses to localStorage
        if (updates.status) {
          try {
            const savedStatuses = JSON.parse(localStorage.getItem("wireframe-section-statuses") || "{}");
            savedStatuses[id] = updates.status;
            localStorage.setItem("wireframe-section-statuses", JSON.stringify(savedStatuses));
          } catch (e) {
            // Silently ignore localStorage errors
          }
        }
      },

      removeWireframeSection: (id) => {
        set((state) => ({
          wireframeSections: state.wireframeSections.filter((s) => s.id !== id),
          selectedSectionId: state.selectedSectionId === id ? null : state.selectedSectionId,
        }));
      },

      reorderSections: (company, sectionIds) => {
        set((state) => ({
          wireframeSections: state.wireframeSections.map((section) => {
            if (section.company !== company) return section;
            const newOrder = sectionIds.indexOf(section.id);
            return newOrder >= 0 ? { ...section, order: newOrder } : section;
          }),
        }));
      },

      linkBlockToSection: (sectionId, blockId) => {
        set((state) => ({
          wireframeSections: state.wireframeSections.map((section) =>
            section.id === sectionId && !section.linkedBlockIds.includes(blockId)
              ? { ...section, linkedBlockIds: [...section.linkedBlockIds, blockId] }
              : section
          ),
        }));
      },

      unlinkBlockFromSection: (sectionId, blockId) => {
        set((state) => ({
          wireframeSections: state.wireframeSections.map((section) =>
            section.id === sectionId
              ? { ...section, linkedBlockIds: section.linkedBlockIds.filter((id) => id !== blockId) }
              : section
          ),
        }));
      },

      selectSection: (id) => {
        set({ selectedSectionId: id });
      },

      selectWireframePage: (pageId) => {
        set({ selectedWireframePageId: pageId });
      },

      updateSectionConfig: (id, config) => {
        set((state) => ({
          wireframeSections: state.wireframeSections.map((section) =>
            section.id === id ? { ...section, config } : section
          ),
        }));
      },

      // Page block management actions
      getBlocksForPage: (pageId) => {
        const { nodes } = get();
        const pageRootId = getPageRootBlockId(pageId);
        
        // Find blocks with parentId matching the page root block ID
        return nodes
          .filter((node) => {
            const data = node.data as unknown as BlockData;
            return data.parentId === pageRootId;
          })
          .map((node) => node.data as unknown as BlockData);
      },

      getPageRootBlock: (pageId) => {
        const { nodes } = get();
        const pageRootId = getPageRootBlockId(pageId);
        
        const rootNode = nodes.find((node) => node.id === pageRootId);
        return rootNode ? (rootNode.data as unknown as BlockData) : undefined;
      },

      hasPageBlocks: (pageId) => {
        const blocks = get().getBlocksForPage(pageId);
        return blocks.length > 0;
      },

      setPageBlocksLoading: (pageId, loading) => {
        set((state) => ({
          pageBlocksLoading: { ...state.pageBlocksLoading, [pageId]: loading },
        }));
      },

      setPageBlocksGenerated: (pageId, generated) => {
        set((state) => ({
          pageBlocksGenerated: { ...state.pageBlocksGenerated, [pageId]: generated },
        }));
      },

      addGeneratedBlocks: (blocks) => {
        const { nodes, wireframeSections } = get();
        
        // Convert blocks to nodes
        const newNodes = blocks.map((block) => ({
          id: block.id,
          type: "contentBlock" as const,
          position: { x: block.positionX, y: block.positionY },
          data: block,
          style: {
            width: block.width,
            height: block.height,
          },
        }));

        // Update wireframe sections to link new blocks
        const updatedSections = wireframeSections.map((section) => {
          // Find blocks that match this section's page and type
          const matchingBlocks = blocks.filter((block) => {
            const pageRootId = getPageRootBlockId(section.pageId);
            if (block.parentId !== pageRootId) return false;
            
            switch (section.type) {
              case "HERO":
                return block.type === "CORE_VALUE_PROP";
              case "CONTENT":
                return block.type === "ARTICLE" || block.type === "FEATURE";
              case "FEATURES":
                return block.type === "FEATURE";
              default:
                return false;
            }
          });

          if (matchingBlocks.length > 0) {
            return {
              ...section,
              linkedBlockIds: [...section.linkedBlockIds, ...matchingBlocks.map((b) => b.id)],
            };
          }
          return section;
        });

        set({
          nodes: [...nodes, ...newNodes],
          wireframeSections: updatedSections,
        });
      },

      // Roadmap state
      roadmapPhases: [],
      roadmapItems: [],
      milestones: [],
      selectedRoadmapItemId: null,
      selectedMilestoneId: null,

      // Block comments state
      blockComments: {},

      addBlockComment: (blockId, comment) => {
        set((state) => ({
          blockComments: {
            ...state.blockComments,
            [blockId]: [...(state.blockComments[blockId] || []), comment],
          },
        }));
      },

      resolveBlockComment: (blockId, commentId) => {
        set((state) => ({
          blockComments: {
            ...state.blockComments,
            [blockId]: (state.blockComments[blockId] || []).map((c) =>
              c.id === commentId ? { ...c, isResolved: true } : c
            ),
          },
        }));
      },

      // Roadmap actions
      initRoadmap: () => {
        const { roadmapPhases } = get();
        if (roadmapPhases.length > 0) return; // Already initialized

        const phases = getDefaultPhases();
        const items = getSampleRoadmapItems();
        const milestones = getDefaultMilestones();

        set({ roadmapPhases: phases, roadmapItems: items, milestones });
      },

      addRoadmapItem: (itemData) => {
        const newItem: RoadmapItem = {
          ...itemData,
          id: nanoid(),
        };
        set((state) => ({
          roadmapItems: [...state.roadmapItems, newItem],
        }));
        return newItem;
      },

      updateRoadmapItem: (id, updates) => {
        set((state) => ({
          roadmapItems: state.roadmapItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      removeRoadmapItem: (id) => {
        set((state) => ({
          roadmapItems: state.roadmapItems.filter((item) => item.id !== id),
          selectedRoadmapItemId: state.selectedRoadmapItemId === id ? null : state.selectedRoadmapItemId,
        }));
      },

      updateRoadmapItemStatus: (id, status) => {
        set((state) => ({
          roadmapItems: state.roadmapItems.map((item) =>
            item.id === id ? { ...item, status } : item
          ),
        }));
      },

      linkBlockToRoadmapItem: (itemId, blockId) => {
        set((state) => ({
          roadmapItems: state.roadmapItems.map((item) =>
            item.id === itemId && !item.linkedBlockIds.includes(blockId)
              ? { ...item, linkedBlockIds: [...item.linkedBlockIds, blockId] }
              : item
          ),
        }));
      },

      unlinkBlockFromRoadmapItem: (itemId, blockId) => {
        set((state) => ({
          roadmapItems: state.roadmapItems.map((item) =>
            item.id === itemId
              ? { ...item, linkedBlockIds: item.linkedBlockIds.filter((id) => id !== blockId) }
              : item
          ),
        }));
      },

      selectRoadmapItem: (id) => {
        set({ selectedRoadmapItemId: id });
      },

      addRoadmapPhase: (phaseData) => {
        const newPhase: RoadmapPhase = {
          ...phaseData,
          id: nanoid(),
        };
        set((state) => ({
          roadmapPhases: [...state.roadmapPhases, newPhase],
        }));
        return newPhase;
      },

      updateRoadmapPhase: (id, updates) => {
        set((state) => ({
          roadmapPhases: state.roadmapPhases.map((phase) =>
            phase.id === id ? { ...phase, ...updates } : phase
          ),
        }));
      },

      // Milestone actions
      addMilestone: (milestoneData) => {
        const newMilestone: Milestone = {
          ...milestoneData,
          id: `ms-${nanoid(8)}`,
          linkedItemIds: milestoneData.linkedItemIds || [],
        };
        set((state) => ({
          milestones: [...state.milestones, newMilestone],
        }));
        return newMilestone;
      },

      updateMilestone: (id, updates) => {
        set((state) => ({
          milestones: state.milestones.map((milestone) =>
            milestone.id === id ? { ...milestone, ...updates } : milestone
          ),
        }));
      },

      removeMilestone: (id) => {
        set((state) => ({
          milestones: state.milestones.filter((m) => m.id !== id),
          selectedMilestoneId: state.selectedMilestoneId === id ? null : state.selectedMilestoneId,
        }));
      },

      selectMilestone: (id) => {
        set({ selectedMilestoneId: id });
      },

      linkItemToMilestone: (milestoneId, itemId) => {
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === milestoneId && !m.linkedItemIds.includes(itemId)
              ? { ...m, linkedItemIds: [...m.linkedItemIds, itemId] }
              : m
          ),
          // Also update the item's milestoneId reference
          roadmapItems: state.roadmapItems.map((item) =>
            item.id === itemId ? { ...item, milestoneId } : item
          ),
        }));
      },

      unlinkItemFromMilestone: (milestoneId, itemId) => {
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === milestoneId
              ? { ...m, linkedItemIds: m.linkedItemIds.filter((id) => id !== itemId) }
              : m
          ),
          // Also clear the item's milestoneId reference
          roadmapItems: state.roadmapItems.map((item) =>
            item.id === itemId && item.milestoneId === milestoneId
              ? { ...item, milestoneId: undefined }
              : item
          ),
        }));
      },

      getMilestoneProgress: (milestoneId) => {
        const { milestones, roadmapItems } = get();
        const milestone = milestones.find((m) => m.id === milestoneId);
        
        if (!milestone || milestone.linkedItemIds.length === 0) {
          return { total: 0, completed: 0, percentage: 0 };
        }

        const linkedItems = roadmapItems.filter((item) =>
          milestone.linkedItemIds.includes(item.id)
        );
        const completedItems = linkedItems.filter(
          (item) => item.status === "PUBLISHED"
        );

        return {
          total: linkedItems.length,
          completed: completedItems.length,
          percentage: Math.round((completedItems.length / linkedItems.length) * 100),
        };
      },

      // CEO Dashboard state
      suggestions: [],
      pageReviews: [],

      // CEO Dashboard actions
      addSuggestion: (suggestionData) => {
        const newSuggestion: ContentSuggestion = {
          ...suggestionData,
          id: nanoid(),
          status: "PENDING",
          submittedAt: new Date(),
        };
        set((state) => ({
          suggestions: [...state.suggestions, newSuggestion],
        }));
        return newSuggestion;
      },

      updateSuggestion: (id, updates) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      removeSuggestion: (id) => {
        set((state) => ({
          suggestions: state.suggestions.filter((s) => s.id !== id),
        }));
      },

      approveSuggestion: (id, comment) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: "APPROVED" as SuggestionStatus,
                  reviewedAt: new Date(),
                  reviewerComment: comment,
                }
              : s
          ),
        }));
      },

      rejectSuggestion: (id, comment) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: "REJECTED" as SuggestionStatus,
                  reviewedAt: new Date(),
                  reviewerComment: comment,
                }
              : s
          ),
        }));
      },

      addPageReview: (pageId, pageName, company, submittedBy) => {
        const newReview: PageReview = {
          pageId,
          pageName,
          company,
          status: "PENDING",
          submittedBy,
          submittedAt: new Date(),
        };
        set((state) => ({
          pageReviews: [...state.pageReviews.filter((r) => r.pageId !== pageId), newReview],
        }));
        return newReview;
      },

      updatePageReview: (pageId, updates) => {
        set((state) => ({
          pageReviews: state.pageReviews.map((r) =>
            r.pageId === pageId ? { ...r, ...updates } : r
          ),
        }));
      },

      approvePageReview: (pageId, comment) => {
        set((state) => ({
          pageReviews: state.pageReviews.map((r) =>
            r.pageId === pageId
              ? {
                  ...r,
                  status: "APPROVED" as PageReviewStatus,
                  reviewerComment: comment,
                }
              : r
          ),
        }));
      },

      requestPageChanges: (pageId, comment) => {
        set((state) => ({
          pageReviews: state.pageReviews.map((r) =>
            r.pageId === pageId
              ? {
                  ...r,
                  status: "NEEDS_CHANGES" as PageReviewStatus,
                  reviewerComment: comment,
                }
              : r
          ),
        }));
      },

      submitBlockForReview: (blockId) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === blockId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "PENDING_REVIEW",
                    submittedForReviewAt: new Date(),
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      approveBlock: (blockId) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === blockId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "APPROVED",
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      requestBlockChanges: (blockId) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === blockId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "NEEDS_CHANGES",
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      // Comments system
      addComment: (blockId, authorName, content, mentions) => {
        const newComment: BlockComment = {
          id: nanoid(),
          authorId: nanoid(),
          authorName,
          content,
          createdAt: new Date(),
          resolved: false,
          mentions: mentions || [],
          replies: [],
        };

        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === blockId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    comments: [...(node.data.comments || []), newComment],
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));

        return newComment;
      },

      replyToComment: (blockId, commentId, authorName, content) => {
        const newReply = {
          id: nanoid(),
          authorId: nanoid(),
          authorName,
          content,
          createdAt: new Date(),
        };

        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === blockId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    comments: (node.data.comments || []).map((c: BlockComment) =>
                      c.id === commentId
                        ? { ...c, replies: [...(c.replies || []), newReply] }
                        : c
                    ),
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      resolveComment: (blockId, commentId) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === blockId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    comments: (node.data.comments || []).map((c: BlockComment) =>
                      c.id === commentId ? { ...c, resolved: true } : c
                    ),
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      deleteComment: (blockId, commentId) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === blockId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    comments: (node.data.comments || []).filter(
                      (c: BlockComment) => c.id !== commentId
                    ),
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      // Batch approval actions
      batchApproveBlocks: (blockIds) => {
        const idSet = new Set(blockIds);
        set((state) => ({
          nodes: state.nodes.map((node) =>
            idSet.has(node.id)
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "APPROVED",
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      batchRejectBlocks: (blockIds) => {
        const idSet = new Set(blockIds);
        set((state) => ({
          nodes: state.nodes.map((node) =>
            idSet.has(node.id)
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "NEEDS_CHANGES",
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      batchSetStatus: (blockIds, status) => {
        const idSet = new Set(blockIds);
        set((state) => ({
          nodes: state.nodes.map((node) =>
            idSet.has(node.id)
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status,
                    submittedForReviewAt:
                      status === "PENDING_REVIEW" ? new Date() : node.data.submittedForReviewAt,
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      // Block ownership
      setBlockOwner: (blockId, ownerId, ownerName) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === blockId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    ownerId,
                    ownerName,
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      // ============ LIFECYCLE ENFORCEMENT ============

      canChangeStatus: (blockId, newStatus) => {
        const { nodes } = get();
        const node = nodes.find((n) => n.id === blockId);
        if (!node) return false;
        const currentStatus = node.data.status as BlockStatus;
        return canTransitionTo(currentStatus, newStatus);
      },

      getAvailableStatusTransitions: (blockId) => {
        const { nodes } = get();
        const node = nodes.find((n) => n.id === blockId);
        if (!node) return [];
        const currentStatus = node.data.status as BlockStatus;
        return getAvailableTransitions(currentStatus);
      },

      transitionBlockStatus: (blockId, newStatus) => {
        const { nodes, canChangeStatus } = get();
        const node = nodes.find((n) => n.id === blockId);
        if (!node) {
          return { success: false, error: "Block not found" };
        }

        const currentStatus = node.data.status as BlockStatus;
        if (!canChangeStatus(blockId, newStatus)) {
          return {
            success: false,
            error: `Cannot transition from ${currentStatus} to ${newStatus}`,
          };
        }

        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === blockId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: newStatus,
                    submittedForReviewAt:
                      newStatus === "PENDING_REVIEW" ? new Date() : n.data.submittedForReviewAt,
                    updatedAt: new Date(),
                  },
                }
              : n
          ),
        }));

        return { success: true };
      },

      publishBlock: (blockId) => {
        const { nodes } = get();
        const node = nodes.find((n) => n.id === blockId);
        if (!node) {
          return { success: false, error: "Block not found" };
        }

        const currentStatus = node.data.status as BlockStatus;
        if (currentStatus !== "APPROVED") {
          return {
            success: false,
            error: `Block must be APPROVED to publish. Current status: ${currentStatus}`,
          };
        }

        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === blockId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: "LIVE",
                    updatedAt: new Date(),
                  },
                }
              : n
          ),
        }));

        return { success: true };
      },

      // ============ REVISION SYSTEM ============

      blockRevisions: [],

      createRevision: (blockId, createdBy, createdByName, comment) => {
        const { nodes, blockRevisions } = get();
        const node = nodes.find((n) => n.id === blockId);
        if (!node) return null;

        // Only allow revisions of LIVE content
        if (node.data.status !== "LIVE") return null;

        // Get highest version number for this block
        const existingRevisions = blockRevisions.filter((r) => r.blockId === blockId);
        const maxVersion = Math.max(...existingRevisions.map((r) => r.version), 0);

        const revision: BlockRevision = {
          id: nanoid(),
          blockId,
          version: maxVersion + 1,
          data: {
            type: node.data.type,
            company: node.data.company,
            status: "DRAFT", // Revisions start as drafts
            title: node.data.title,
            subtitle: node.data.subtitle,
            content: node.data.content,
            tags: node.data.tags || [],
            positionX: node.data.positionX,
            positionY: node.data.positionY,
            width: node.data.width || 280,
            height: node.data.height || 120,
            externalUrl: node.data.externalUrl,
            parentId: node.data.parentId,
            workspaceId: node.data.workspaceId,
          },
          createdAt: new Date(),
          createdBy,
          createdByName,
          comment,
        };

        set((state) => ({
          blockRevisions: [...state.blockRevisions, revision],
        }));

        return revision;
      },

      getBlockRevisions: (blockId) => {
        const { blockRevisions } = get();
        return blockRevisions
          .filter((r) => r.blockId === blockId)
          .sort((a, b) => b.version - a.version);
      },

      restoreRevision: (revisionId) => {
        const { blockRevisions } = get();
        const revision = blockRevisions.find((r) => r.id === revisionId);
        if (!revision) return;

        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === revision.blockId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    ...revision.data,
                    id: node.id,
                    status: "DRAFT", // Restored content becomes a draft
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      // ============ REVIEW REQUESTS ============

      reviewRequests: [],

      createReviewRequest: (blockIds, requestedBy, reviewerId, reviewerName, dueBy, context) => {
        const newRequest: ReviewRequest = {
          id: nanoid(),
          blockIds,
          requestedBy,
          reviewerId,
          reviewerName,
          requestedAt: new Date(),
          dueBy,
          context,
          status: "PENDING",
        };

        // Also transition the blocks to PENDING_REVIEW
        const idSet = new Set(blockIds);
        set((state) => ({
          reviewRequests: [...state.reviewRequests, newRequest],
          nodes: state.nodes.map((node) =>
            idSet.has(node.id) && node.data.status === "DRAFT"
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "PENDING_REVIEW",
                    submittedForReviewAt: new Date(),
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));

        return newRequest;
      },

      updateReviewRequest: (id, updates) => {
        set((state) => ({
          reviewRequests: state.reviewRequests.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },

      completeReviewRequest: (id, resolution, comment) => {
        const { reviewRequests } = get();
        const request = reviewRequests.find((r) => r.id === id);
        if (!request) return;

        const newStatus: BlockStatus = resolution === "APPROVED" ? "APPROVED" : "NEEDS_CHANGES";
        const idSet = new Set(request.blockIds);

        set((state) => ({
          reviewRequests: state.reviewRequests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "COMPLETED" as ReviewRequestStatus,
                  resolution,
                  resolvedAt: new Date(),
                  resolverComment: comment,
                }
              : r
          ),
          nodes: state.nodes.map((node) =>
            idSet.has(node.id) && node.data.status === "PENDING_REVIEW"
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: newStatus,
                    updatedAt: new Date(),
                  },
                }
              : node
          ),
        }));
      },

      cancelReviewRequest: (id) => {
        set((state) => ({
          reviewRequests: state.reviewRequests.map((r) =>
            r.id === id ? { ...r, status: "CANCELLED" as ReviewRequestStatus } : r
          ),
        }));
      },

      getPendingReviewsForReviewer: (reviewerId) => {
        const { reviewRequests } = get();
        return reviewRequests.filter(
          (r) => r.reviewerId === reviewerId && r.status === "PENDING"
        );
      },

      getReviewRequestsByRequester: (requesterId) => {
        const { reviewRequests } = get();
        return reviewRequests.filter((r) => r.requestedBy.id === requesterId);
      },

      // ============ IMPACT ANALYSIS ============

      getBlockUsage: (blockId) => {
        const { nodes, edges, wireframeSections, roadmapItems } = get();

        // Find wireframe sections using this block
        const usedInSections = wireframeSections
          .filter((s) => s.linkedBlockIds.includes(blockId))
          .map((s) => ({
            id: s.id,
            pageId: s.pageId,
            pageName: s.pageId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            type: s.type,
          }));

        // Find roadmap items linking this block
        const usedInRoadmap = roadmapItems
          .filter((item) => item.linkedBlockIds.includes(blockId))
          .map((item) => ({
            id: item.id,
            title: item.title,
          }));

        // Find blocks that depend on this block (via edges)
        const dependentEdges = edges.filter((e) => e.source === blockId);
        const dependentBlockIds = new Set(dependentEdges.map((e) => e.target));
        const dependentBlocks = nodes
          .filter((n) => dependentBlockIds.has(n.id))
          .map((n) => ({
            id: n.id,
            title: n.data.title as string,
          }));

        return {
          wireframeSections: usedInSections,
          roadmapItems: usedInRoadmap,
          dependentBlocks,
          totalUsages: usedInSections.length + usedInRoadmap.length + dependentBlocks.length,
        };
      },

      hasBlockUsage: (blockId) => {
        const usage = get().getBlockUsage(blockId);
        return usage.totalUsages > 0;
      },

      // ============ ROADMAP-CONTENT SYNC ============

      getLinkedBlocksStatus: (itemId) => {
        const { roadmapItems, nodes } = get();
        const item = roadmapItems.find((i) => i.id === itemId);
        if (!item) {
          return {
            total: 0,
            byStatus: {},
            allApproved: false,
            allLive: false,
            hasIssues: false,
            readyToPublish: false,
          };
        }

        const linkedNodes = nodes.filter((n) => item.linkedBlockIds.includes(n.id));
        const byStatus: Partial<Record<BlockStatus, number>> = {};

        for (const node of linkedNodes) {
          const status = node.data.status as BlockStatus;
          byStatus[status] = (byStatus[status] || 0) + 1;
        }

        const total = linkedNodes.length;
        const approvedCount = byStatus.APPROVED || 0;
        const liveCount = byStatus.LIVE || 0;
        const needsChangesCount = byStatus.NEEDS_CHANGES || 0;

        return {
          total,
          byStatus,
          allApproved: total > 0 && approvedCount === total,
          allLive: total > 0 && liveCount === total,
          hasIssues: needsChangesCount > 0,
          readyToPublish: total > 0 && approvedCount + liveCount === total && approvedCount > 0,
        };
      },

      publishAllLinkedBlocks: (itemId) => {
        const { roadmapItems, nodes } = get();
        const item = roadmapItems.find((i) => i.id === itemId);
        if (!item) return { published: 0, failed: 0 };

        let published = 0;
        let failed = 0;

        const updatedNodes: Node<BlockData>[] = nodes.map((node) => {
          if (!item.linkedBlockIds.includes(node.id)) return node;
          if (node.data.status !== "APPROVED") {
            failed++;
            return node;
          }
          published++;
          return {
            ...node,
            data: {
              ...node.data,
              status: "LIVE" as BlockStatus,
              updatedAt: new Date(),
            },
          };
        });

        set({ nodes: updatedNodes });
        return { published, failed };
      },

      getSuggestedRoadmapStatus: (itemId) => {
        const status = get().getLinkedBlocksStatus(itemId);
        if (status.total === 0) return null;

        if (status.allLive) return "PUBLISHED";
        if (status.readyToPublish) return "REVIEW";
        if (status.hasIssues) return "IN_PROGRESS";
        if (status.byStatus.PENDING_REVIEW && status.byStatus.PENDING_REVIEW > 0) return "REVIEW";

        return "IN_PROGRESS";
      },

      // ============ GOVERNANCE ============

      generateRecommendations: () => {
        const { nodes, wireframeSections, roadmapItems } = get();
        const recommendations: ContentRecommendation[] = [];
        const now = new Date();

        // 1. Stale content (not updated in 90+ days)
        const staleBlocks = nodes.filter((n) => {
          const updatedAt = new Date(n.data.updatedAt);
          const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceUpdate > 90 && n.data.status !== "ARCHIVED";
        });

        if (staleBlocks.length > 0) {
          recommendations.push({
            id: nanoid(),
            type: "stale_content",
            severity: "warning",
            title: `${staleBlocks.length} blocks haven't been updated in 90+ days`,
            message: "Consider reviewing and updating or archiving this content.",
            affectedItems: staleBlocks.map((n) => ({
              type: "block",
              id: n.id,
              title: n.data.title as string,
            })),
            action: {
              label: "Review stale content",
              type: "navigate",
              target: "schema",
            },
            createdAt: now,
          });
        }

        // 2. Stuck in review (PENDING_REVIEW for 7+ days)
        const stuckInReview = nodes.filter((n) => {
          if (n.data.status !== "PENDING_REVIEW") return false;
          const submittedAt = n.data.submittedForReviewAt
            ? new Date(n.data.submittedForReviewAt)
            : new Date(n.data.updatedAt);
          const daysSinceSubmission = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceSubmission > 7;
        });

        if (stuckInReview.length > 0) {
          recommendations.push({
            id: nanoid(),
            type: "stuck_review",
            severity: "critical",
            title: `${stuckInReview.length} blocks stuck in review for 7+ days`,
            message: "These items need attention from reviewers.",
            affectedItems: stuckInReview.map((n) => ({
              type: "block",
              id: n.id,
              title: n.data.title as string,
            })),
            action: {
              label: "Go to review queue",
              type: "navigate",
              target: "ceo-dashboard",
            },
            createdAt: now,
          });
        }

        // 3. Orphaned blocks (not linked anywhere)
        const allLinkedBlockIds = new Set<string>();
        wireframeSections.forEach((s) => s.linkedBlockIds.forEach((id) => allLinkedBlockIds.add(id)));
        roadmapItems.forEach((item) => item.linkedBlockIds.forEach((id) => allLinkedBlockIds.add(id)));

        const orphanedBlocks = nodes.filter(
          (n) => !allLinkedBlockIds.has(n.id) && n.data.status !== "ARCHIVED"
        );

        if (orphanedBlocks.length > 0) {
          recommendations.push({
            id: nanoid(),
            type: "orphaned_block",
            severity: "info",
            title: `${orphanedBlocks.length} blocks not linked to any page or roadmap item`,
            message: "Consider linking these blocks or archiving if no longer needed.",
            affectedItems: orphanedBlocks.map((n) => ({
              type: "block",
              id: n.id,
              title: n.data.title as string,
            })),
            action: {
              label: "View orphaned blocks",
              type: "navigate",
              target: "schema",
            },
            createdAt: now,
          });
        }

        // 4. Broken links (sections linking to non-existent blocks)
        const nodeIds = new Set(nodes.map((n) => n.id));
        const brokenSections = wireframeSections.filter((s) =>
          s.linkedBlockIds.some((id) => !nodeIds.has(id))
        );

        if (brokenSections.length > 0) {
          recommendations.push({
            id: nanoid(),
            type: "broken_link",
            severity: "critical",
            title: `${brokenSections.length} sections have broken block links`,
            message: "These sections reference blocks that no longer exist.",
            affectedItems: brokenSections.map((s) => ({
              type: "section",
              id: s.id,
              title: `${s.pageId} - ${s.type}`,
            })),
            action: {
              label: "Fix broken links",
              type: "navigate",
              target: "wireframe",
            },
            createdAt: now,
          });
        }

        // 5. Missing coverage (companies with no content of certain types)
        const companies: Company[] = ["CERE", "CEF"];
        const requiredTypes: BlockType[] = ["CORE_VALUE_PROP", "FEATURE", "SOLUTION"];

        for (const company of companies) {
          for (const blockType of requiredTypes) {
            const hasContent = nodes.some(
              (n) => n.data.company === company && n.data.type === blockType
            );
            if (!hasContent) {
              recommendations.push({
                id: nanoid(),
                type: "missing_coverage",
                severity: "warning",
                title: `${company} has no ${blockType.replace(/_/g, " ").toLowerCase()} content`,
                message: "Consider creating content for better coverage.",
                affectedItems: [],
                action: {
                  label: `Create ${blockType.replace(/_/g, " ").toLowerCase()}`,
                  type: "navigate",
                  target: "schema",
                },
                createdAt: now,
              });
            }
          }
        }

        return recommendations.sort((a, b) => {
          const severityOrder = { critical: 0, warning: 1, info: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });
      },

      calculateGovernanceMetrics: () => {
        const { nodes, wireframeSections, roadmapItems } = get();
        const now = new Date();

        // Freshness metrics
        let fresh = 0, stale = 0, veryStale = 0;
        nodes.forEach((n) => {
          if (n.data.status === "ARCHIVED") return;
          const updatedAt = new Date(n.data.updatedAt);
          const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceUpdate <= 30) fresh++;
          else if (daysSinceUpdate <= 90) stale++;
          else veryStale++;
        });

        // Orphan detection
        const allLinkedBlockIds = new Set<string>();
        wireframeSections.forEach((s) => s.linkedBlockIds.forEach((id) => allLinkedBlockIds.add(id)));
        roadmapItems.forEach((item) => item.linkedBlockIds.forEach((id) => allLinkedBlockIds.add(id)));

        const orphanBlocks = nodes
          .filter((n) => !allLinkedBlockIds.has(n.id) && n.data.status !== "ARCHIVED")
          .map((n) => ({ id: n.id, title: n.data.title as string }));

        // Broken links
        const nodeIds = new Set(nodes.map((n) => n.id));
        const brokenSections = wireframeSections
          .filter((s) => s.linkedBlockIds.some((id) => !nodeIds.has(id)))
          .map((s) => ({
            id: s.id,
            pageName: s.pageId,
            missingBlockId: s.linkedBlockIds.find((id) => !nodeIds.has(id)) || "",
          }));

        // Coverage
        const companies: Company[] = ["CERE", "CEF", "SHARED"];
        const blockTypes: BlockType[] = [
          "COMPANY", "CORE_VALUE_PROP", "PAIN_POINT", "SOLUTION",
          "FEATURE", "VERTICAL", "ARTICLE", "TECH_COMPONENT"
        ];

        const byCompany: Record<Company, number> = { CERE: 0, CEF: 0, SHARED: 0 };
        const byType: Record<BlockType, number> = {} as Record<BlockType, number>;
        blockTypes.forEach((t) => (byType[t] = 0));

        nodes.forEach((n) => {
          if (n.data.status !== "ARCHIVED") {
            byCompany[n.data.company as Company]++;
            byType[n.data.type as BlockType]++;
          }
        });

        const gaps: { company: Company; type: BlockType }[] = [];
        for (const company of ["CERE", "CEF"] as Company[]) {
          for (const blockType of ["CORE_VALUE_PROP", "FEATURE", "SOLUTION"] as BlockType[]) {
            const hasContent = nodes.some(
              (n) => n.data.company === company && n.data.type === blockType && n.data.status !== "ARCHIVED"
            );
            if (!hasContent) {
              gaps.push({ company, type: blockType });
            }
          }
        }

        return {
          freshness: { fresh, stale, veryStale },
          orphans: { count: orphanBlocks.length, blocks: orphanBlocks },
          brokenLinks: { count: brokenSections.length, sections: brokenSections },
          coverage: { byCompany, byType, gaps },
        };
      },

      // ============ FAVORITES ============

      toggleFavorite: (blockId) => {
        set((state) => {
          const isFav = state.favoriteBlockIds.includes(blockId);
          return {
            favoriteBlockIds: isFav
              ? state.favoriteBlockIds.filter((id) => id !== blockId)
              : [...state.favoriteBlockIds, blockId],
          };
        });
      },

      isFavorite: (blockId) => {
        return get().favoriteBlockIds.includes(blockId);
      },

      getFavoriteBlocks: () => {
        const { nodes, favoriteBlockIds } = get();
        return nodes.filter((n) => favoriteBlockIds.includes(n.id));
      },
    }),
    {
      name: "content-visualizer-store",
    }
  )
);

