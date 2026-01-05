"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { PHASE_CONFIGS, STATUS_CONFIGS, PRIORITY_CONFIGS, DEFAULT_TEAM } from "@/lib/roadmap-types";
import type { RoadmapItem, Milestone } from "@/lib/roadmap-types";
import RoadmapItemEditor from "./RoadmapItemEditor";
import AddItemModal from "./AddItemModal";
import GanttView from "./GanttView";
import MilestoneEditor from "./MilestoneEditor";
import TeamAssignment, { TeamFilter } from "./TeamAssignment";
import ContentCalendar from "./ContentCalendar";
import { nanoid } from "nanoid";
import { ResizableSidebar } from "@/components/ui";

type ViewMode = "kanban" | "gantt" | "calendar";

/**
 * RoadmapDesigner - Timeline view of content roadmap
 * Shows phases, items, dependencies, and compounding content strategy
 */
export default function RoadmapDesigner() {
  const {
    initRoadmap,
    roadmapPhases,
    roadmapItems,
    milestones,
    selectedRoadmapItemId,
    selectRoadmapItem,
    updateRoadmapItemStatus,
    updateRoadmapItem,
  } = useCanvasStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCompany, setFilterCompany] = useState<"ALL" | "CERE" | "CEF">("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("gantt");
  const [showMilestones, setShowMilestones] = useState(false);
  const [filterAssignees, setFilterAssignees] = useState<string[]>([]);

  // Initialize roadmap on mount
  useEffect(() => {
    initRoadmap();
  }, [initRoadmap]);

  // Filter items
  const filteredItems = useMemo(() => {
    return roadmapItems.filter((item) => {
      if (filterCompany !== "ALL" && item.company !== filterCompany) return false;
      if (filterAssignees.length > 0 && !filterAssignees.includes(item.assigneeId || "")) return false;
      return true;
    });
  }, [roadmapItems, filterCompany, filterAssignees]);

  const getItemsForPhase = (phaseId: string) =>
    filteredItems
      .filter((item) => item.phaseId === phaseId)
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

  const getCompoundingScore = (item: RoadmapItem): number => {
    return roadmapItems.filter((i) => i.dependsOn.includes(item.id)).length;
  };

  const handleToggleAssigneeFilter = (id: string) => {
    setFilterAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleItemDrag = (itemId: string, newDate: Date, newEndDate?: Date) => {
    updateRoadmapItem(itemId, { targetDate: newDate, endDate: newEndDate });
  };


  return (
    <div className="h-full flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Main Timeline View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4" data-tour="roadmap-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Content Roadmap
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Plan and track your compounding content strategy
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1" data-tour="view-toggle">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1
                    ${viewMode === "kanban"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }
                  `}
                >
                  <span>📊</span>
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode("gantt")}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1
                    ${viewMode === "gantt"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }
                  `}
                >
                  <span>📅</span>
                  Gantt
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1
                    ${viewMode === "calendar"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }
                  `}
                >
                  <span>🗓️</span>
                  Calendar
                </button>
              </div>

              {/* Team filter */}
              <TeamFilter selectedIds={filterAssignees} onToggle={handleToggleAssigneeFilter} />

              {/* Company filter */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1" data-tour="company-filter">
                {(["ALL", "CERE", "CEF"] as const).map((company) => (
                  <button
                    key={company}
                    onClick={() => setFilterCompany(company)}
                    className={`
                      px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                      ${filterCompany === company
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }
                    `}
                  >
                    {company === "ALL" ? "All" : company}
                  </button>
                ))}
              </div>

              {/* Milestones toggle */}
              <button
                onClick={() => setShowMilestones(!showMilestones)}
                data-tour="milestones-toggle"
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1
                  ${showMilestones
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }
                `}
              >
                <span>📌</span>
                Milestones
              </button>

              {/* Add item button */}
              <button
                onClick={() => setShowAddModal(true)}
                data-tour="add-content"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2"
              >
                <span>+</span>
                Add Content
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Milestones Sidebar (Resizable) */}
          {showMilestones && (
            <ResizableSidebar
              position="left"
              defaultWidth={320}
              minWidth={280}
              maxWidth={450}
              storageKey="roadmap-milestones-sidebar"
              className="border-r border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 z-20"
            >
              <MilestoneEditor />
            </ResizableSidebar>
          )}

          {/* Main View */}
          {viewMode === "calendar" ? (
            /* Calendar View */
            <div className="flex-1 overflow-hidden p-4">
              <ContentCalendar
                companyFilter={filterCompany}
                onItemClick={(item) => selectRoadmapItem(item.id)}
              />
            </div>
          ) : viewMode === "kanban" ? (
            /* Kanban View */
            <div className="flex-1 overflow-x-auto overflow-y-auto p-6" data-tour="phase-columns">
              <div className="flex gap-6 min-w-max">
                {roadmapPhases.sort((a, b) => a.order - b.order).map((phase) => {
                  const phaseItems = getItemsForPhase(phase.id);
                  const config = PHASE_CONFIGS[phase.type];

                  return (
                    <div key={phase.id} className="w-80 flex-shrink-0 flex flex-col">
                      {/* Phase header */}
                      <div
                        className="rounded-t-xl px-4 py-3 border-b-4"
                        style={{
                          backgroundColor: `${config.color}15`,
                          borderBottomColor: config.color,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{config.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {phase.name}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300">{config.description}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                          <span>
                            {new Date(phase.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span>→</span>
                          <span>
                            {new Date(phase.endDate).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Phase items */}
                      <div className="flex-1 bg-gray-100 dark:bg-gray-900/50 rounded-b-xl p-3 space-y-2 min-h-[400px]">
                        {phaseItems.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                            No items in this phase
                          </div>
                        ) : (
                          phaseItems.map((item) => {
                            const statusConfig = STATUS_CONFIGS[item.status];
                            const priorityConfig = PRIORITY_CONFIGS[item.priority];
                            const compoundingScore = getCompoundingScore(item);
                            const isSelected = selectedRoadmapItemId === item.id;
                            const assignee = DEFAULT_TEAM.find((t) => t.id === item.assigneeId);

                            return (
                              <div
                                key={item.id}
                                onClick={() => selectRoadmapItem(item.id)}
                                className={`
                                  p-3 rounded-lg bg-white dark:bg-gray-800 border-2 cursor-pointer
                                  transition-all hover:shadow-md
                                  ${isSelected
                                    ? "border-blue-500 ring-2 ring-blue-500/20"
                                    : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                                  }
                                `}
                              >
                                {/* Header row */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`
                                        px-2 py-0.5 rounded text-[10px] font-semibold
                                        ${item.company === "CERE"
                                          ? "bg-cyan-500/20 text-cyan-400"
                                          : "bg-emerald-500/20 text-emerald-400"
                                        }
                                      `}
                                    >
                                      {item.company}
                                    </span>
                                    {compoundingScore > 0 && (
                                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-semibold">
                                        +{compoundingScore}
                                      </span>
                                    )}
                                  </div>
                                  <TeamAssignment
                                    assigneeId={item.assigneeId}
                                    onAssign={(id) => updateRoadmapItem(item.id, { assigneeId: id })}
                                    size="sm"
                                  />
                                </div>

                                {/* Title */}
                                <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                                  {item.title}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                                  {item.description}
                                </p>

                                {/* Status & Priority */}
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const statuses = Object.keys(STATUS_CONFIGS) as (keyof typeof STATUS_CONFIGS)[];
                                      const currentIndex = statuses.indexOf(item.status);
                                      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                                      updateRoadmapItemStatus(item.id, nextStatus);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                                    style={{
                                      backgroundColor: `${statusConfig.color}20`,
                                      color: statusConfig.color,
                                    }}
                                  >
                                    <span>{statusConfig.icon}</span>
                                    <span>{statusConfig.label}</span>
                                  </button>
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: priorityConfig.color }}
                                    title={`${priorityConfig.label} priority`}
                                  />
                                </div>

                                {/* Dependencies indicator */}
                                {item.dependsOn.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                      Depends on {item.dependsOn.length} item(s)
                                    </span>
                                  </div>
                                )}

                                {/* Target date */}
                                <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
                                  Target: {new Date(item.targetDate).toLocaleDateString()}
                                </div>

                                {/* External Links */}
                                {(item.googleDocsUrl || item.notionPageUrl || item.figmaUrl) && (
                                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                    {item.googleDocsUrl && (
                                      <a
                                        href={item.googleDocsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-6 h-6 rounded bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center transition-colors"
                                        title="Open Google Doc"
                                      >
                                        <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z"/>
                                          <path d="M8 12h8v2H8zm0 4h5v2H8z"/>
                                        </svg>
                                      </a>
                                    )}
                                    {item.notionPageUrl && (
                                      <a
                                        href={item.notionPageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-6 h-6 rounded bg-slate-500/20 hover:bg-slate-500/30 flex items-center justify-center transition-colors"
                                        title="Open Notion Page"
                                      >
                                        <svg className="w-3.5 h-3.5 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h6v2H8v-2z"/>
                                        </svg>
                                      </a>
                                    )}
                                    {item.figmaUrl && (
                                      <a
                                        href={item.figmaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-6 h-6 rounded bg-purple-500/20 hover:bg-purple-500/30 flex items-center justify-center transition-colors"
                                        title="Open Figma Design"
                                      >
                                        <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M12 2H8a4 4 0 000 8 4 4 0 004 4h4a4 4 0 100-8 4 4 0 00-4-4zm0 12a4 4 0 104 4v-4h-4z"/>
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Gantt View */
            <GanttView
              items={filteredItems}
              phases={roadmapPhases}
              milestones={milestones}
              onItemClick={(item) => selectRoadmapItem(item.id)}
              onItemDrag={handleItemDrag}
              selectedItemId={selectedRoadmapItemId}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-3">
          <div className="flex items-center gap-6 text-xs text-gray-600 dark:text-gray-300">
            <span className="font-semibold">Status:</span>
            {Object.entries(STATUS_CONFIGS).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1">
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </div>
            ))}
            <span className="ml-4 font-semibold">Priority:</span>
            {Object.entries(PRIORITY_CONFIGS).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                <span>{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right sidebar - Item Editor (Resizable) */}
      {selectedRoadmapItemId && (
        <ResizableSidebar
          position="right"
          defaultWidth={360}
          minWidth={280}
          maxWidth={550}
          storageKey="roadmap-item-sidebar"
          className="border-l border-gray-200 dark:border-gray-800 overflow-y-auto bg-white dark:bg-gray-900"
          data-tour="item-editor"
        >
          <RoadmapItemEditor />
        </ResizableSidebar>
      )}

      {/* Add Item Modal */}
      {showAddModal && <AddItemModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
