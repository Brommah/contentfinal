"use client";

import React, { useState, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { STATUS_CONFIGS } from "@/lib/roadmap-types";
import type { RoadmapItem } from "@/lib/roadmap-types";
import type { Company } from "@/lib/types";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from "date-fns";

type CalendarView = "month" | "week";

interface ContentCalendarProps {
  companyFilter?: Company | "ALL";
  onItemClick?: (item: RoadmapItem) => void;
}

/**
 * ContentCalendar - Calendar view for roadmap items
 * 
 * Shows:
 * - Target dates of roadmap items
 * - Scheduled publish dates
 * - Milestones
 * - Week/month view toggle
 */
export default function ContentCalendar({
  companyFilter = "ALL",
  onItemClick,
}: ContentCalendarProps) {
  const { roadmapItems, roadmapPhases, selectRoadmapItem } = useCanvasStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");

  // Filter items by company
  const filteredItems = useMemo(() => {
    return roadmapItems.filter((item) => {
      if (companyFilter === "ALL") return true;
      return item.company === companyFilter;
    });
  }, [roadmapItems, companyFilter]);

  // Get calendar days
  const calendarDays = useMemo(() => {
    if (view === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, view]);

  // Group items by date
  const itemsByDate = useMemo(() => {
    const map = new Map<string, RoadmapItem[]>();
    
    filteredItems.forEach((item) => {
      const dateKey = format(new Date(item.targetDate), "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, item]);
    });
    
    return map;
  }, [filteredItems]);

  const navigatePrev = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    }
  };

  const navigateNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleItemClick = (item: RoadmapItem) => {
    selectRoadmapItem(item.id);
    onItemClick?.(item);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span>📅</span>
            Content Calendar
          </h2>
          <span className="text-slate-400 text-sm">
            {format(currentDate, view === "month" ? "MMMM yyyy" : "'Week of' MMM d")}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg bg-slate-700/50 p-0.5">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                view === "month"
                  ? "bg-slate-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                view === "week"
                  ? "bg-slate-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Week
            </button>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={navigatePrev}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={navigateNext}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-slate-700/50 bg-slate-800/30">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-medium text-slate-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className={`grid grid-cols-7 ${view === "week" ? "min-h-[400px]" : ""}`}>
          {calendarDays.map((day, index) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayItems = itemsByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);

            return (
              <div
                key={index}
                className={`
                  border-r border-b border-slate-700/30 p-1 min-h-[100px]
                  ${!isCurrentMonth ? "bg-slate-800/30" : ""}
                  ${isDayToday ? "bg-blue-500/5" : ""}
                `}
              >
                {/* Day Number */}
                <div className={`
                  text-right text-xs font-medium mb-1 px-1
                  ${isDayToday 
                    ? "text-blue-400" 
                    : isCurrentMonth 
                    ? "text-slate-400" 
                    : "text-slate-600"
                  }
                `}>
                  {isDayToday ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white">
                      {format(day, "d")}
                    </span>
                  ) : (
                    format(day, "d")
                  )}
                </div>

                {/* Items */}
                <div className="space-y-0.5">
                  {dayItems.slice(0, view === "week" ? 10 : 3).map((item) => {
                    const statusConfig = STATUS_CONFIGS[item.status];
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`
                          w-full text-left px-1.5 py-1 rounded text-[10px] font-medium truncate
                          transition-all hover:scale-105 hover:shadow-md
                        `}
                        style={{
                          backgroundColor: `${statusConfig.color}20`,
                          color: statusConfig.color,
                        }}
                        title={item.title}
                      >
                        <span className="flex items-center gap-1">
                          <span>{item.company === "CERE" ? "🔵" : "🟣"}</span>
                          <span className="truncate">{item.title}</span>
                        </span>
                      </button>
                    );
                  })}
                  {dayItems.length > (view === "week" ? 10 : 3) && (
                    <div className="text-[10px] text-slate-500 px-1">
                      +{dayItems.length - (view === "week" ? 10 : 3)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/30 flex items-center gap-4">
        <span className="text-xs text-slate-500">Status:</span>
        {Object.entries(STATUS_CONFIGS).slice(0, 4).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-xs text-slate-400">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


