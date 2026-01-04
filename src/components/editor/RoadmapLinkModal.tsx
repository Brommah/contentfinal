"use client";

import React, { useState, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { STATUS_CONFIGS, PRIORITY_CONFIGS, PHASE_CONFIGS } from "@/lib/roadmap-types";
import type { RoadmapItem, RoadmapStatus, RoadmapPriority, PhaseType } from "@/lib/roadmap-types";
import type { Company } from "@/lib/types";

interface RoadmapLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockId: string | null;
  blockTitle: string;
  onLink: (itemIds: string[]) => void;
  onCreateAndLink?: (newItem: Partial<RoadmapItem>) => void;
}

type ModalMode = "attach" | "create";

/**
 * RoadmapLinkModal - Modal for linking content to roadmap items
 * Supports two modes:
 * 1. Attach to existing roadmap items
 * 2. Create a new roadmap item
 */
export default function RoadmapLinkModal({
  isOpen,
  onClose,
  blockId,
  blockTitle,
  onLink,
  onCreateAndLink,
}: RoadmapLinkModalProps) {
  const { roadmapItems, roadmapPhases, initRoadmap, addRoadmapItem, linkBlockToRoadmapItem } = useCanvasStore();
  const [mode, setMode] = useState<ModalMode>("attach");
  
  // Attach mode state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [filterCompany, setFilterCompany] = useState<Company | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<RoadmapStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create mode state
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemCompany, setNewItemCompany] = useState<Company>("CERE");
  const [newItemPhase, setNewItemPhase] = useState<string>("");
  const [newItemPriority, setNewItemPriority] = useState<RoadmapPriority>("MEDIUM");
  const [newItemTargetDate, setNewItemTargetDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [newItemTags, setNewItemTags] = useState("");
  const [newItemGoogleDocsUrl, setNewItemGoogleDocsUrl] = useState("");
  const [newItemNotionUrl, setNewItemNotionUrl] = useState("");
  const [newItemFigmaUrl, setNewItemFigmaUrl] = useState("");

  // Initialize roadmap if needed
  React.useEffect(() => {
    if (isOpen && roadmapItems.length === 0) {
      initRoadmap();
    }
    // Set default phase
    if (isOpen && roadmapPhases.length > 0 && !newItemPhase) {
      setNewItemPhase(roadmapPhases[0].id);
    }
  }, [isOpen, roadmapItems.length, roadmapPhases, newItemPhase, initRoadmap]);

  // Pre-fill title from block title
  React.useEffect(() => {
    if (isOpen && blockTitle && !newItemTitle) {
      setNewItemTitle(blockTitle);
    }
  }, [isOpen, blockTitle, newItemTitle]);

  // Filter items
  const filteredItems = useMemo(() => {
    return roadmapItems.filter((item) => {
      if (filterCompany !== "ALL" && item.company !== filterCompany) return false;
      if (filterStatus !== "ALL" && item.status !== filterStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !item.title.toLowerCase().includes(query) &&
          !item.description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [roadmapItems, filterCompany, filterStatus, searchQuery]);

  // Group items by phase
  const itemsByPhase = useMemo(() => {
    const grouped: Record<string, RoadmapItem[]> = {};
    filteredItems.forEach((item) => {
      if (!grouped[item.phaseId]) {
        grouped[item.phaseId] = [];
      }
      grouped[item.phaseId].push(item);
    });
    return grouped;
  }, [filteredItems]);

  const toggleItem = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleAttachConfirm = () => {
    onLink(Array.from(selectedItemIds));
    setSelectedItemIds(new Set());
    onClose();
  };

  const handleCreateConfirm = () => {
    if (!newItemTitle.trim()) return;

    const tagsArray = newItemTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // Add the roadmap item - store generates the id
    const newItem = addRoadmapItem({
      title: newItemTitle.trim(),
      description: newItemDescription.trim() || `Content for ${blockTitle}`,
      company: newItemCompany,
      phaseId: newItemPhase,
      status: "PLANNED",
      priority: newItemPriority,
      targetDate: new Date(newItemTargetDate),
      assignee: null,
      linkedBlockIds: blockId ? [blockId] : [],
      tags: tagsArray,
      googleDocsUrl: newItemGoogleDocsUrl.trim() || undefined,
      notionPageUrl: newItemNotionUrl.trim() || undefined,
      figmaUrl: newItemFigmaUrl.trim() || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Link the block if we have one (redundant since linkedBlockIds is set, but keeps state consistent)
    if (blockId && newItem) {
      linkBlockToRoadmapItem(newItem.id, blockId);
    }

    // Call optional callback
    if (onCreateAndLink && newItem) {
      onCreateAndLink(newItem);
    }

    // Reset form
    setNewItemTitle("");
    setNewItemDescription("");
    setNewItemTags("");
    setNewItemGoogleDocsUrl("");
    setNewItemNotionUrl("");
    setNewItemFigmaUrl("");
    
    alert(`✅ Created new roadmap item "${newItem.title}" and linked your content!`);
    onClose();
  };

  const resetState = () => {
    setSelectedItemIds(new Set());
    setSearchQuery("");
    setFilterCompany("ALL");
    setFilterStatus("ALL");
    setNewItemTitle(blockTitle || "");
    setNewItemDescription("");
    setNewItemTags("");
    setNewItemGoogleDocsUrl("");
    setNewItemNotionUrl("");
    setNewItemFigmaUrl("");
  };

  React.useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🗓️</span>
                Link to Roadmap
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Connect &quot;{blockTitle}&quot; to roadmap
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setMode("attach")}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                mode === "attach"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                  : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Attach to Existing
            </button>
            <button
              onClick={() => setMode("create")}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                mode === "create"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Item
            </button>
          </div>
        </div>

        {/* Content - Attach Mode */}
        {mode === "attach" && (
          <>
            {/* Filters */}
            <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search roadmap items..."
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <select
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value as Company | "ALL")}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300"
                >
                  <option value="ALL">All Companies</option>
                  <option value="CERE">CERE</option>
                  <option value="CEF">CEF</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as RoadmapStatus | "ALL")}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300"
                >
                  <option value="ALL">All Status</option>
                  {Object.entries(STATUS_CONFIGS).map(([status, config]) => (
                    <option key={status} value={status}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {roadmapPhases.map((phase) => {
                const phaseItems = itemsByPhase[phase.id] || [];
                if (phaseItems.length === 0) return null;

                const phaseConfig = PHASE_CONFIGS[phase.type];

                return (
                  <div key={phase.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{phaseConfig.icon}</span>
                      <h3 className="font-semibold text-white">{phase.name}</h3>
                      <span className="text-xs text-slate-500">
                        {phaseItems.length} item{phaseItems.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {phaseItems.map((item) => {
                        const isSelected = selectedItemIds.has(item.id);
                        const statusConfig = STATUS_CONFIGS[item.status];
                        const priorityConfig = PRIORITY_CONFIGS[item.priority];
                        const isAlreadyLinked = blockId && item.linkedBlockIds.includes(blockId);

                        return (
                          <button
                            key={item.id}
                            onClick={() => !isAlreadyLinked && toggleItem(item.id)}
                            disabled={!!isAlreadyLinked}
                            className={`w-full p-4 rounded-xl text-left transition-all ${
                              isAlreadyLinked
                                ? "bg-emerald-500/10 border border-emerald-500/30 cursor-not-allowed"
                                : isSelected
                                ? "bg-purple-500/20 border-2 border-purple-500 ring-2 ring-purple-500/30"
                                : "bg-slate-800/50 border border-slate-700 hover:border-slate-600 hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  isAlreadyLinked
                                    ? "bg-emerald-500 text-white"
                                    : isSelected
                                    ? "bg-purple-500 text-white"
                                    : "bg-slate-700 border border-slate-600"
                                }`}
                              >
                                {(isSelected || isAlreadyLinked) && (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-white">{item.title}</h4>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      item.company === "CERE"
                                        ? "bg-cyan-500/20 text-cyan-400"
                                        : "bg-emerald-500/20 text-emerald-400"
                                    }`}
                                  >
                                    {item.company}
                                  </span>
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded"
                                    style={{
                                      backgroundColor: `${statusConfig.color}20`,
                                      color: statusConfig.color,
                                    }}
                                  >
                                    {statusConfig.icon} {statusConfig.label}
                                  </span>
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded"
                                    style={{
                                      backgroundColor: `${priorityConfig.color}20`,
                                      color: priorityConfig.color,
                                    }}
                                  >
                                    {item.priority}
                                  </span>
                                  {isAlreadyLinked && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                      ✓ Already Linked
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                  <span>📅 {new Date(item.targetDate).toLocaleDateString()}</span>
                                  {item.linkedBlockIds.length > 0 && (
                                    <span>🔗 {item.linkedBlockIds.length} linked</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🗓️</div>
                  <h3 className="text-lg font-semibold text-white mb-2">No roadmap items found</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {searchQuery
                      ? "Try adjusting your search or filters"
                      : "No existing items to link to"}
                  </p>
                  <button
                    onClick={() => setMode("create")}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm"
                  >
                    + Create New Item Instead
                  </button>
                </div>
              )}
            </div>

            {/* Footer - Attach Mode */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                {selectedItemIds.size > 0 ? (
                  <span className="text-purple-400 font-medium">
                    {selectedItemIds.size} item{selectedItemIds.size !== 1 ? "s" : ""} selected
                  </span>
                ) : (
                  "Select roadmap items to link"
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAttachConfirm}
                  disabled={selectedItemIds.size === 0}
                  className={`px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                    selectedItemIds.size === 0
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/25"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Link to {selectedItemIds.size} Item{selectedItemIds.size !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Content - Create Mode */}
        {mode === "create" && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Item Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="e.g., Blog Post: Verifiable AI"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="Brief description of this roadmap item..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Company & Phase Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Company
                  </label>
                  <select
                    value={newItemCompany}
                    onChange={(e) => setNewItemCompany(e.target.value as Company)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="CERE">CERE Network</option>
                    <option value="CEF">CEF.AI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Phase
                  </label>
                  <select
                    value={newItemPhase}
                    onChange={(e) => setNewItemPhase(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {roadmapPhases.map((phase) => (
                      <option key={phase.id} value={phase.id}>
                        {PHASE_CONFIGS[phase.type].icon} {phase.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Target Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Priority
                  </label>
                  <select
                    value={newItemPriority}
                    onChange={(e) => setNewItemPriority(e.target.value as RoadmapPriority)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {Object.entries(PRIORITY_CONFIGS).map(([priority, config]) => (
                      <option key={priority} value={priority}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newItemTargetDate}
                    onChange={(e) => setNewItemTargetDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Tags <span className="text-slate-500 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={newItemTags}
                  onChange={(e) => setNewItemTags(e.target.value)}
                  placeholder="e.g., blog, content, marketing"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* External Links */}
              <div className="border-t border-slate-700 pt-5">
                <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <span className="text-lg">🔗</span>
                  External Links <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <div className="space-y-3">
                  {/* Google Docs */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z"/>
                        <path d="M8 12h8v2H8zm0 4h5v2H8z"/>
                      </svg>
                    </div>
                    <input
                      type="url"
                      value={newItemGoogleDocsUrl}
                      onChange={(e) => setNewItemGoogleDocsUrl(e.target.value)}
                      placeholder="https://docs.google.com/document/d/..."
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  {/* Notion */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h6v2H8v-2z"/>
                      </svg>
                    </div>
                    <input
                      type="url"
                      value={newItemNotionUrl}
                      onChange={(e) => setNewItemNotionUrl(e.target.value)}
                      placeholder="https://notion.so/..."
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                    />
                  </div>
                  {/* Figma */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2H8a4 4 0 000 8 4 4 0 004 4h4a4 4 0 100-8 4 4 0 00-4-4zm0 12a4 4 0 104 4v-4h-4z"/>
                      </svg>
                    </div>
                    <input
                      type="url"
                      value={newItemFigmaUrl}
                      onChange={(e) => setNewItemFigmaUrl(e.target.value)}
                      placeholder="https://figma.com/file/..."
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-500">Preview</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white">
                    {newItemTitle || "New Roadmap Item"}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      newItemCompany === "CERE"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {newItemCompany}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    📋 Planned
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${PRIORITY_CONFIGS[newItemPriority].color}20`,
                      color: PRIORITY_CONFIGS[newItemPriority].color,
                    }}
                  >
                    {newItemPriority}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {newItemDescription || "No description"}
                </p>
                <div className="text-xs text-slate-500 mt-2">
                  📅 {new Date(newItemTargetDate).toLocaleDateString()}
                  {blockId && <span className="ml-2">🔗 1 linked block</span>}
                </div>
              </div>
            </div>

            {/* Footer - Create Mode */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <button
                onClick={() => setMode("attach")}
                className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                ← Back to existing items
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateConfirm}
                  disabled={!newItemTitle.trim()}
                  className={`px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                    !newItemTitle.trim()
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/25"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create & Link
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
