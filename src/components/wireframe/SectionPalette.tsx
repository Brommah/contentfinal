"use client";

import React, { useState } from "react";
import { useCanvasStore } from "@/lib/store";
import { SECTION_METAS, getPageById, type SectionType } from "@/lib/wireframe-types";
import SectionTemplates from "./SectionTemplates";

interface SectionPaletteProps {
  currentPageId?: string;
}

/**
 * SectionPalette - Draggable palette of landing page section types
 */
export default function SectionPalette({ currentPageId }: SectionPaletteProps) {
  const { addWireframeSection } = useCanvasStore();
  const [showTemplates, setShowTemplates] = useState(false);
  
  const currentPage = currentPageId ? getPageById(currentPageId) : null;

  const handleDragStart = (e: React.DragEvent, type: SectionType) => {
    e.dataTransfer.setData("sectionType", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleAddSection = (type: SectionType) => {
    if (currentPage && currentPageId) {
      addWireframeSection(currentPage.company, type, currentPageId);
    }
  };

  return (
    <aside className="h-full flex flex-col" data-section-palette>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Page Sections
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
          Drag to add or click to insert
        </p>
        
        {/* Tab toggle */}
        <div className="flex gap-1 mt-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setShowTemplates(false)}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
              !showTemplates
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Sections
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
              showTemplates
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            📦 Templates
          </button>
        </div>
      </div>

      {/* Templates view */}
      {showTemplates && currentPage && (
        <div className="flex-1 overflow-y-auto">
          <SectionTemplates company={currentPage.company} pageId={currentPageId || `${currentPage.company}-home`} />
        </div>
      )}

      {/* Section list */}
      {!showTemplates && (
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {SECTION_METAS.map((meta) => (
          <div
            key={meta.type}
            draggable
            onDragStart={(e) => handleDragStart(e, meta.type)}
            className="group relative bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 cursor-grab active:cursor-grabbing
              border border-gray-200 dark:border-gray-700/50
              hover:border-gray-300 dark:hover:border-gray-600
              transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span
                className="text-xl flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md"
                style={{ backgroundColor: `${meta.color}20` }}
              >
                {meta.icon}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                  {meta.label}
                </h3>
                <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5">
                  {meta.description}
                </p>
                {meta.linkedBlockType && (
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">
                    Links to: {meta.linkedBlockType}
                  </p>
                )}
              </div>
            </div>

            {/* Quick add button */}
            {currentPage && (
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleAddSection(meta.type)}
                  className={`px-2 py-1 rounded text-[9px] font-bold ${
                    currentPage.company === "CERE"
                      ? "bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30"
                      : "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
                  }`}
                  title={`Add to ${currentPage.name}`}
                >
                  + Add
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Current page indicator */}
      {currentPage && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Adding to
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span>{currentPage.icon}</span>
            <span className="font-medium text-gray-900 dark:text-white">{currentPage.name}</span>
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: currentPage.company === "CERE" ? "#06b6d4" : "#10b981",
              }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}

