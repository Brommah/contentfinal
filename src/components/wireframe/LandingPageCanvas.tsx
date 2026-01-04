"use client";

import React, { useState, useCallback, useRef } from "react";
import type { Company } from "@/lib/types";
import type { WireframeSection } from "@/lib/wireframe-types";
import { getPageById } from "@/lib/wireframe-types";
import SectionRenderer from "./SectionRenderer";
import { useCanvasStore } from "@/lib/store";

interface LandingPageCanvasProps {
  company: Company;
  sections: WireframeSection[];
  pageId?: string;
}

interface DropZone {
  index: number;
  position: "left" | "right" | "above" | "below";
  targetSectionId?: string;
}

/**
 * LandingPageCanvas - Scrollable wireframe preview with smart drag-and-drop
 * Auto-detects horizontal drops for 2-column layouts
 */
export default function LandingPageCanvas({
  company,
  sections,
  pageId,
}: LandingPageCanvasProps) {
  const currentPage = pageId ? getPageById(pageId) : null;
  const { 
    selectedSectionId, 
    selectSection, 
    reorderSections, 
    updateWireframeSection 
  } = useCanvasStore();

  const [activeDropZone, setActiveDropZone] = useState<DropZone | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const companyColors = {
    CERE: {
      accent: "cyan",
      bg: "from-slate-900 via-slate-900 to-slate-950",
      border: "border-cyan-500/30",
      headerBg: "bg-slate-900/95",
    },
    CEF: {
      accent: "emerald",
      bg: "from-slate-900 via-slate-900 to-slate-950",
      border: "border-emerald-500/30",
      headerBg: "bg-slate-900/95",
    },
    SHARED: {
      accent: "purple",
      bg: "from-slate-900 via-slate-900 to-slate-950",
      border: "border-purple-500/30",
      headerBg: "bg-slate-900/95",
    },
  };

  const colors = companyColors[company];

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    e.dataTransfer.setData("sectionId", sectionId);
    e.dataTransfer.effectAllowed = "move";
  };

  // Enhanced drag over to detect horizontal vs vertical positioning
  const handleDragOver = useCallback((e: React.DragEvent, sectionId: string, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    // Determine drop position based on mouse location
    let position: "left" | "right" | "above" | "below";

    // Horizontal threshold (30% from edges)
    const horizontalThreshold = width * 0.3;
    
    if (mouseX < horizontalThreshold) {
      position = "left";
    } else if (mouseX > width - horizontalThreshold) {
      position = "right";
    } else if (mouseY < height / 2) {
      position = "above";
    } else {
      position = "below";
    }

    setActiveDropZone({
      index,
      position,
      targetSectionId: sectionId,
    });
  }, []);

  const handleDragLeave = useCallback(() => {
    setActiveDropZone(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("sectionId");
    if (!draggedId || !activeDropZone) return;

    const currentIndex = sections.findIndex((s) => s.id === draggedId);
    const targetSection = sections[targetIndex];
    const draggedSection = sections.find((s) => s.id === draggedId);
    
    if (currentIndex === targetIndex) {
      setActiveDropZone(null);
      return;
    }

    // Handle horizontal drops - auto-enable 2-column layout
    if (activeDropZone.position === "left" || activeDropZone.position === "right") {
      // Set both sections to 2-column layout
      if (targetSection && draggedSection) {
        // Merge blocks into target section with 2-column layout
        const allBlockIds = [
          ...(activeDropZone.position === "left" 
            ? [...draggedSection.linkedBlockIds, ...targetSection.linkedBlockIds]
            : [...targetSection.linkedBlockIds, ...draggedSection.linkedBlockIds]
          ),
        ];

        // Update target section to 2 columns with merged blocks
        updateWireframeSection(targetSection.id, {
          columns: 2,
          columnSplit: "50-50",
          linkedBlockIds: allBlockIds,
        });

        // Remove the dragged section (merged into target)
        const newOrder = sections
          .filter((s) => s.id !== draggedId)
          .map((s) => s.id);
        
        reorderSections(company, newOrder);
      }
    } else {
      // Vertical drop - standard reorder
      const newOrder = [...sections];
      const [removed] = newOrder.splice(currentIndex, 1);
      const adjustedIndex = activeDropZone.position === "above" ? targetIndex : targetIndex + 1;
      const finalIndex = currentIndex < targetIndex ? adjustedIndex - 1 : adjustedIndex;
      newOrder.splice(finalIndex, 0, removed);

      reorderSections(
        company,
        newOrder.map((s) => s.id)
      );
    }

    setActiveDropZone(null);
  }, [activeDropZone, sections, company, reorderSections, updateWireframeSection]);

  // Render drop indicator
  const renderDropIndicator = (sectionId: string, position: "left" | "right" | "above" | "below") => {
    if (!activeDropZone || activeDropZone.targetSectionId !== sectionId) return null;
    if (activeDropZone.position !== position) return null;

    const baseClasses = "absolute transition-all duration-150 bg-blue-500/30 border-2 border-blue-500 rounded-lg z-20";
    
    switch (position) {
      case "left":
        return (
          <div className={`${baseClasses} left-0 top-2 bottom-2 w-[48%] flex items-center justify-center`}>
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
              ← Drop to create 2 columns
            </div>
          </div>
        );
      case "right":
        return (
          <div className={`${baseClasses} right-0 top-2 bottom-2 w-[48%] flex items-center justify-center`}>
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
              Drop to create 2 columns →
            </div>
          </div>
        );
      case "above":
        return (
          <div className={`${baseClasses} left-2 right-2 -top-1 h-1`} />
        );
      case "below":
        return (
          <div className={`${baseClasses} left-2 right-2 -bottom-1 h-1`} />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        flex-1 overflow-y-auto rounded-xl border-2
        bg-gradient-to-b ${colors.bg} ${colors.border}
      `}
    >
      {/* Browser chrome mockup */}
      <div className={`sticky top-0 z-10 ${colors.headerBg} backdrop-blur-md border-b border-white/10 px-4 py-2`}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white/10 rounded-md px-3 py-1 text-xs text-gray-400 max-w-xs mx-auto text-center">
              {company === "CERE" ? "cere.network" : "cef.ai"}{currentPage?.slug || ""}
            </div>
          </div>
        </div>
      </div>

      {/* Wireframe sections */}
      <div className="p-4 space-y-3">
        {sections.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <span className="text-4xl">📄</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Start Building Your Page</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
              Add sections from the palette on the left, or use a template to get started quickly.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  const palette = document.querySelector('[data-section-palette]');
                  if (palette) palette.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Section
              </button>
              <button
                onClick={() => {
                  const palette = document.querySelector('[data-section-palette]');
                  if (palette) palette.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-4 py-2 border border-gray-600 hover:border-gray-500 text-gray-300 font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <span>📦</span>
                Use Template
              </button>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800/50">
              <p className="text-xs text-gray-500 mb-3">Quick start with common sections:</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {["HERO", "VALUE_PROPS", "FEATURES", "CTA"].map((type) => (
                  <button
                    key={type}
                    className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                  >
                    + {type.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          sections.map((section, index) => (
            <div
              key={section.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(section.id, el);
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, section.id)}
              onDragOver={(e) => handleDragOver(e, section.id, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onClickCapture={() => selectSection(section.id)}
              className={`
                relative cursor-pointer transition-all duration-200
                ${selectedSectionId === section.id 
                  ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900 scale-[1.01]" 
                  : "hover:scale-[1.005]"
                }
              `}
            >
              {/* Drop indicators for all positions */}
              {renderDropIndicator(section.id, "left")}
              {renderDropIndicator(section.id, "right")}
              {renderDropIndicator(section.id, "above")}
              {renderDropIndicator(section.id, "below")}
              
              <SectionRenderer section={section} company={company} />
            </div>
          ))
        )}
      </div>

      {/* Helper text */}
      {sections.length > 1 && (
        <div className="px-4 pb-4">
          <div className="text-center text-[10px] text-gray-600 py-2 border-t border-gray-800/50">
            💡 Tip: Drag a section to the left or right of another to create a 2-column layout
          </div>
        </div>
      )}

      {/* Floating Add Section Button */}
      <div className="sticky bottom-4 flex justify-center py-4">
        <button
          onClick={() => {
            // Scroll to section palette or show add section modal
            const palette = document.querySelector('[data-section-palette]');
            if (palette) {
              palette.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="
            flex items-center gap-2 px-5 py-2.5
            bg-gradient-to-r from-emerald-500 to-teal-500
            hover:from-emerald-400 hover:to-teal-400
            text-white font-medium rounded-full
            shadow-lg shadow-emerald-500/25
            transition-all duration-200
            hover:shadow-xl hover:shadow-emerald-500/40
            hover:scale-105 active:scale-95
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Section</span>
        </button>
      </div>
    </div>
  );
}
