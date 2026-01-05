"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import type { RoadmapItem, RoadmapPhase, Milestone } from "@/lib/roadmap-types";
import { STATUS_CONFIGS, PRIORITY_CONFIGS, DEFAULT_TEAM, PHASE_CONFIGS } from "@/lib/roadmap-types";
import { COMPANY_COLORS } from "@/lib/types";

interface GanttViewProps {
  items: RoadmapItem[];
  phases: RoadmapPhase[];
  milestones: Milestone[];
  onItemClick: (item: RoadmapItem) => void;
  onItemDrag: (itemId: string, newDate: Date, newEndDate?: Date) => void;
  selectedItemId: string | null;
}

type ZoomLevel = "day" | "week" | "month";

const ZOOM_CONFIGS: Record<ZoomLevel, { dayWidth: number; label: string; gridLines: "day" | "week" }> = {
  day: { dayWidth: 40, label: "Day", gridLines: "day" },
  week: { dayWidth: 20, label: "Week", gridLines: "week" },
  month: { dayWidth: 8, label: "Month", gridLines: "week" },
};

/**
 * GanttView - Professional Gantt chart with advanced features
 */
export default function GanttView({
  items,
  phases,
  milestones,
  onItemClick,
  onItemDrag,
  selectedItemId,
}: GanttViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragInfo, setDragInfo] = useState<{
    itemId: string;
    startX: number;
    originalDate: Date;
    mode: "move" | "resize-start" | "resize-end";
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("week");
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const zoomConfig = ZOOM_CONFIGS[zoomLevel];

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    const allDates = [
      ...phases.map((p) => new Date(p.startDate).getTime()),
      ...phases.map((p) => new Date(p.endDate).getTime()),
      ...items.map((i) => new Date(i.targetDate).getTime()),
      ...items.filter((i) => i.endDate).map((i) => new Date(i.endDate!).getTime()),
      ...milestones.map((m) => new Date(m.date).getTime()),
      Date.now(),
    ];
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    // Add padding
    minDate.setDate(minDate.getDate() - 14);
    maxDate.setDate(maxDate.getDate() + 30);

    return { minDate, maxDate };
  }, [phases, items, milestones]);

  // Total days in timeline
  const totalDays = useMemo(() => {
    const { minDate, maxDate } = timelineRange;
    return Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [timelineRange]);

  const totalWidth = totalDays * zoomConfig.dayWidth;

  // Generate time headers (months)
  const timeHeaders = useMemo(() => {
    const result: { label: string; startPx: number; widthPx: number; isCurrentMonth: boolean }[] = [];
    const { minDate, maxDate } = timelineRange;
    const now = new Date();

    let current = new Date(minDate);
    current.setDate(1);

    while (current <= maxDate) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const startDayOffset = Math.max(0, Math.ceil((monthStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
      const endDayOffset = Math.min(totalDays, Math.ceil((monthEnd.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

      const isCurrentMonth = now.getMonth() === monthStart.getMonth() && now.getFullYear() === monthStart.getFullYear();

      result.push({
        label: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        startPx: startDayOffset * zoomConfig.dayWidth,
        widthPx: (endDayOffset - startDayOffset) * zoomConfig.dayWidth,
        isCurrentMonth,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return result;
  }, [timelineRange, totalDays, zoomConfig.dayWidth]);

  // Generate grid lines (weeks)
  const gridLines = useMemo(() => {
    const result: { px: number; isWeekStart: boolean; label?: string }[] = [];
    const { minDate } = timelineRange;
    const current = new Date(minDate);

    for (let i = 0; i <= totalDays; i++) {
      const dayOfWeek = current.getDay();
      const isWeekStart = dayOfWeek === 1; // Monday

      if (zoomConfig.gridLines === "day" || (zoomConfig.gridLines === "week" && isWeekStart)) {
        result.push({
          px: i * zoomConfig.dayWidth,
          isWeekStart,
          label: isWeekStart && zoomLevel !== "month" ? current.getDate().toString() : undefined,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [timelineRange, totalDays, zoomConfig, zoomLevel]);

  // Today marker position
  const todayPosition = useMemo(() => {
    const today = new Date();
    const { minDate } = timelineRange;
    const dayOffset = Math.ceil((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return dayOffset * zoomConfig.dayWidth;
  }, [timelineRange, zoomConfig.dayWidth]);

  // Calculate position for a date
  const getPositionForDate = useCallback(
    (date: Date | string) => {
      const d = new Date(date);
      const { minDate } = timelineRange;
      const dayOffset = (d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
      return dayOffset * zoomConfig.dayWidth;
    },
    [timelineRange, zoomConfig.dayWidth]
  );

  // Get item duration and width
  const getItemDimensions = useCallback(
    (item: RoadmapItem) => {
      const startDate = new Date(item.targetDate);
      const endDate = item.endDate ? new Date(item.endDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        left: getPositionForDate(startDate),
        width: Math.max(days * zoomConfig.dayWidth, 80),
      };
    },
    [getPositionForDate, zoomConfig.dayWidth]
  );

  // Group items by phase
  const itemsByPhase = useMemo(() => {
    const grouped: Record<string, RoadmapItem[]> = {};
    phases.forEach((p) => {
      grouped[p.id] = items.filter((i) => i.phaseId === p.id).sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
    });
    return grouped;
  }, [items, phases]);

  // Toggle phase collapse
  const togglePhase = (phaseId: string) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent, item: RoadmapItem, mode: "move" | "resize-start" | "resize-end" = "move") => {
    e.preventDefault();
    e.stopPropagation();
    setDragInfo({
      itemId: item.id,
      startX: e.clientX,
      originalDate: new Date(item.targetDate),
      mode,
    });
  };

  // Handle drag move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragInfo) return;

      const deltaX = e.clientX - dragInfo.startX;
      const deltaDays = Math.round(deltaX / zoomConfig.dayWidth);
      const newDate = new Date(dragInfo.originalDate);
      newDate.setDate(newDate.getDate() + deltaDays);

      onItemDrag(dragInfo.itemId, newDate);
    },
    [dragInfo, zoomConfig.dayWidth, onItemDrag]
  );

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setDragInfo(null);
  }, []);

  // Set up global mouse event listeners for dragging
  useEffect(() => {
    if (dragInfo) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragInfo, handleMouseMove, handleMouseUp]);

  // Scroll to today on mount
  useEffect(() => {
    if (timelineRef.current) {
      const scrollPosition = todayPosition - 200;
      timelineRef.current.scrollLeft = Math.max(0, scrollPosition);
    }
  }, [todayPosition]);

  // Handle item hover for tooltip
  const handleItemHover = (e: React.MouseEvent, itemId: string | null) => {
    setHoveredItem(itemId);
    if (itemId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setTooltipPosition(null);
    }
  };

  const hoveredItemData = hoveredItem ? items.find((i) => i.id === hoveredItem) : null;

  return (
    <div ref={containerRef} className="h-full flex flex-col overflow-hidden bg-slate-900 relative">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-300">Timeline View</span>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Today</span>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 mr-2">Zoom:</span>
          {(["month", "week", "day"] as ZoomLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setZoomLevel(level)}
              className={`
                px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${zoomLevel === level
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }
              `}
            >
              {ZOOM_CONFIGS[level].label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div ref={timelineRef} className="flex-1 overflow-auto">
        {/* Time header */}
        <div className="sticky top-0 z-20 flex bg-slate-800">
          <div className="w-56 flex-shrink-0 px-4 py-3 border-r border-slate-700 bg-slate-800 sticky left-0 z-30">
            <span className="text-sm font-semibold text-slate-200">Phases / Items</span>
          </div>
          <div className="relative" style={{ width: totalWidth }}>
            {/* Month labels */}
            <div className="flex h-10 border-b border-slate-700">
              {timeHeaders.map((header, i) => (
                <div
                  key={i}
                  className={`
                    border-r border-slate-700 flex items-center justify-center text-xs font-medium
                    ${header.isCurrentMonth ? "bg-blue-900/30 text-blue-300" : "text-slate-400"}
                  `}
                  style={{ width: header.widthPx, minWidth: header.widthPx }}
                >
                  {header.label}
                </div>
              ))}
            </div>

            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {gridLines.map((line, i) => (
                <div
                  key={i}
                  className={`absolute top-0 h-full ${line.isWeekStart ? "border-l border-slate-700/50" : "border-l border-slate-800"}`}
                  style={{ left: line.px }}
                />
              ))}
            </div>

            {/* Today marker in header */}
            <div
              className="absolute top-0 h-full w-0.5 bg-red-500 z-10"
              style={{ left: todayPosition }}
            >
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-red-500 rounded text-[10px] font-bold text-white whitespace-nowrap">
                Today
              </div>
            </div>
          </div>
        </div>

        {/* Milestones row */}
        {milestones.length > 0 && (
          <div className="flex border-b border-slate-700 bg-slate-850">
            <div className="w-56 flex-shrink-0 px-4 py-2 border-r border-slate-700 flex items-center gap-2 sticky left-0 z-20 bg-slate-800">
              <span className="text-amber-400">📌</span>
              <span className="text-sm font-medium text-slate-300">Milestones</span>
            </div>
            <div className="relative flex-1 h-12 bg-slate-900/50 overflow-visible" style={{ width: totalWidth }}>
              {/* Today line extending through */}
              <div className="absolute top-0 h-full w-0.5 bg-red-500/30" style={{ left: todayPosition }} />

              {milestones.map((milestone) => {
                const pos = getPositionForDate(milestone.date);
                return (
                  <div
                    key={milestone.id}
                    className="absolute top-1/2 -translate-y-1/2 z-[5] group"
                    style={{ left: pos }}
                  >
                    {/* Diamond marker */}
                    <div
                      className="w-6 h-6 rotate-45 rounded-sm shadow-lg cursor-pointer transition-transform group-hover:scale-125"
                      style={{ backgroundColor: milestone.color }}
                    />
                    {/* Label - appears on hover, positioned to the right */}
                    <div
                      className="absolute left-8 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-30 pointer-events-none"
                      style={{ backgroundColor: milestone.color }}
                    >
                      {milestone.icon} {milestone.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Phase rows with items */}
        {phases.sort((a, b) => a.order - b.order).map((phase) => {
          const phaseItems = itemsByPhase[phase.id] || [];
          const isCollapsed = collapsedPhases.has(phase.id);
          const phaseConfig = PHASE_CONFIGS[phase.type];

          return (
            <div key={phase.id} className="border-b border-slate-700/50">
              {/* Phase header */}
              <div
                className="flex cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => togglePhase(phase.id)}
              >
                <div className="w-56 flex-shrink-0 px-4 py-2.5 border-r border-slate-700 flex items-center gap-3 sticky left-0 z-20 bg-slate-900">
                  <button className="text-slate-400 hover:text-white transition-colors">
                    <svg
                      className={`w-4 h-4 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div
                    className="w-3 h-3 rounded-full shadow-lg"
                    style={{ backgroundColor: phase.color, boxShadow: `0 0 8px ${phase.color}50` }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-white">{phase.name}</span>
                    <span className="ml-2 text-xs text-slate-500">({phaseItems.length})</span>
                  </div>
                </div>
                <div className="relative flex-1 h-10" style={{ width: totalWidth }}>
                  {/* Today line */}
                  <div className="absolute top-0 h-full w-0.5 bg-red-500/30" style={{ left: todayPosition }} />

                  {/* Phase duration bar */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full"
                    style={{
                      left: getPositionForDate(phase.startDate),
                      width: Math.max(getPositionForDate(phase.endDate) - getPositionForDate(phase.startDate), 20),
                      background: `linear-gradient(90deg, ${phase.color}40, ${phase.color}20)`,
                    }}
                  />
                </div>
              </div>

              {/* Items in phase */}
              {!isCollapsed && (
                <div className="bg-slate-900/30">
                  {phaseItems.length === 0 ? (
                    <div className="flex">
                      <div className="w-56 flex-shrink-0 px-4 py-3 border-r border-slate-700 text-slate-500 text-xs italic sticky left-0 z-20 bg-slate-900/30">
                        No items
                      </div>
                      <div className="relative flex-1 h-10" style={{ width: totalWidth }}>
                        <div className="absolute top-0 h-full w-0.5 bg-red-500/10" style={{ left: todayPosition }} />
                      </div>
                    </div>
                  ) : (
                    phaseItems.map((item) => {
                      const companyColor = COMPANY_COLORS[item.company];
                      const statusConfig = STATUS_CONFIGS[item.status];
                      const priorityConfig = PRIORITY_CONFIGS[item.priority];
                      const assignee = DEFAULT_TEAM.find((t) => t.id === item.assigneeId);
                      const dimensions = getItemDimensions(item);
                      const isSelected = selectedItemId === item.id;
                      const isDragging = dragInfo?.itemId === item.id;
                      const isHovered = hoveredItem === item.id;
                      const dependentsCount = items.filter((i) => i.dependsOn.includes(item.id)).length;

                      return (
                        <div key={item.id} className="flex group">
                          {/* Item label */}
                          <div className="w-56 flex-shrink-0 px-4 py-2 border-r border-slate-700/50 flex items-center gap-2 sticky left-0 z-20 bg-slate-900/95">
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: companyColor.primary }}
                            />
                            <span className="text-sm text-slate-300 truncate flex-1">{item.title}</span>
                            {dependentsCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-semibold">
                                +{dependentsCount}
                              </span>
                            )}
                          </div>

                          {/* Item bar area */}
                          <div className="relative flex-1 h-11" style={{ width: totalWidth }}>
                            {/* Today line */}
                            <div className="absolute top-0 h-full w-0.5 bg-red-500/10" style={{ left: todayPosition }} />

                            {/* Dependency lines */}
                            {item.dependsOn.map((depId) => {
                              const depItem = items.find((i) => i.id === depId);
                              if (!depItem) return null;

                              const depDimensions = getItemDimensions(depItem);
                              const fromX = depDimensions.left + depDimensions.width;
                              const toX = dimensions.left;
                              const midY = 22;

                              if (toX <= fromX) return null;

                              return (
                                <svg
                                  key={depId}
                                  className="absolute inset-0 pointer-events-none overflow-visible"
                                  style={{ width: totalWidth, height: "100%" }}
                                >
                                  <defs>
                                    <marker
                                      id={`arrow-${item.id}-${depId}`}
                                      viewBox="0 0 10 10"
                                      refX="9"
                                      refY="5"
                                      markerWidth="5"
                                      markerHeight="5"
                                      orient="auto"
                                    >
                                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
                                    </marker>
                                    <linearGradient id={`gradient-${item.id}-${depId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                                    </linearGradient>
                                  </defs>
                                  <path
                                    d={`M ${fromX} ${midY} C ${fromX + 30} ${midY}, ${toX - 30} ${midY}, ${toX - 6} ${midY}`}
                                    stroke={`url(#gradient-${item.id}-${depId})`}
                                    strokeWidth="2"
                                    fill="none"
                                    strokeDasharray="6 3"
                                    markerEnd={`url(#arrow-${item.id}-${depId})`}
                                    className="transition-opacity"
                                    style={{ opacity: isHovered || isSelected ? 1 : 0.5 }}
                                  />
                                </svg>
                              );
                            })}

                            {/* Item bar */}
                            <div
                              className={`
                                absolute top-1/2 -translate-y-1/2 h-8 rounded-lg cursor-pointer
                                flex items-center gap-2 px-3 
                                transition-all duration-150 ease-out
                                ${isSelected ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900" : ""}
                                ${isDragging ? "opacity-80 scale-105 shadow-2xl cursor-grabbing z-30" : "hover:shadow-xl hover:scale-[1.02]"}
                                ${isHovered && !isDragging ? "z-20" : "z-10"}
                              `}
                              style={{
                                left: dimensions.left,
                                width: dimensions.width,
                                background: `linear-gradient(135deg, ${companyColor.primary}30, ${companyColor.primary}15)`,
                                borderLeft: `3px solid ${companyColor.primary}`,
                                boxShadow: isSelected || isHovered ? `0 4px 20px ${companyColor.primary}30` : undefined,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onItemClick(item);
                              }}
                              onMouseDown={(e) => handleDragStart(e, item, "move")}
                              onMouseEnter={(e) => handleItemHover(e, item.id)}
                              onMouseLeave={() => handleItemHover({} as React.MouseEvent, null)}
                            >
                              {/* Status indicator */}
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: statusConfig.color }}
                              />

                              {/* Title */}
                              <span
                                className="text-xs font-medium truncate flex-1"
                                style={{ color: companyColor.primary }}
                              >
                                {item.title}
                              </span>

                              {/* Priority dot */}
                              <div
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: priorityConfig.color }}
                              />

                              {/* Assignee */}
                              {assignee && (
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm"
                                  style={{ backgroundColor: assignee.color }}
                                  title={assignee.name}
                                >
                                  {assignee.avatar}
                                </div>
                              )}

                              {/* Resize handles (visible on hover) */}
                              <div
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ background: `linear-gradient(90deg, transparent, ${companyColor.primary}50)` }}
                                onMouseDown={(e) => handleDragStart(e, item, "resize-end")}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredItemData && tooltipPosition && !dragInfo && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: tooltipPosition.x + 15,
            top: tooltipPosition.y - 10,
            maxWidth: 280,
          }}
        >
          <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 p-3 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`
                  px-2 py-0.5 rounded text-[10px] font-bold
                  ${hoveredItemData.company === "CERE" ? "bg-cyan-500/20 text-cyan-300" : "bg-emerald-500/20 text-emerald-300"}
                `}
              >
                {hoveredItemData.company}
              </span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-medium"
                style={{
                  backgroundColor: `${STATUS_CONFIGS[hoveredItemData.status].color}20`,
                  color: STATUS_CONFIGS[hoveredItemData.status].color,
                }}
              >
                {STATUS_CONFIGS[hoveredItemData.status].icon} {STATUS_CONFIGS[hoveredItemData.status].label}
              </span>
            </div>
            <h4 className="font-semibold text-white mb-1">{hoveredItemData.title}</h4>
            <p className="text-slate-400 text-xs mb-2 line-clamp-2">{hoveredItemData.description}</p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>📅 {new Date(hoveredItemData.targetDate).toLocaleDateString()}</span>
              {hoveredItemData.dependsOn.length > 0 && (
                <span>🔗 {hoveredItemData.dependsOn.length} dependencies</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
