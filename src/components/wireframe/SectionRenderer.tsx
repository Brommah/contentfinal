"use client";

import React from "react";
import type { Company } from "@/lib/types";
import type { WireframeSection } from "@/lib/wireframe-types";
import { getSectionMeta } from "@/lib/wireframe-types";
import { useCanvasStore } from "@/lib/store";
import type { BlockData } from "@/lib/types";

// Section components
import HeroSection from "./sections/HeroSection";
import ValuePropsSection from "./sections/ValuePropsSection";
import PainPointsSection from "./sections/PainPointsSection";
import SolutionsSection from "./sections/SolutionsSection";
import FeaturesSection from "./sections/FeaturesSection";
import ContentSection from "./sections/ContentSection";
import CTASection from "./sections/CTASection";

interface SectionRendererProps {
  section: WireframeSection;
  company: Company;
}

/**
 * SectionRenderer - Renders the appropriate section component based on type
 * Now with proper 2-column layout support
 */
export default function SectionRenderer({ section, company }: SectionRendererProps) {
  const { nodes, removeWireframeSection, selectedSectionId } = useCanvasStore();
  const meta = getSectionMeta(section.type);

  // Get linked block data
  const linkedBlocks = section.linkedBlockIds
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is typeof n & NonNullable<typeof n> => n !== undefined)
    .map((n) => n.data as unknown as BlockData);

  const isSelected = selectedSectionId === section.id;

  const companyAccent = company === "CERE" ? "cyan" : "emerald";

  // Get column layout settings
  const columns = section.columns || 1;
  const columnSplit = section.columnSplit || "50-50";

  // Calculate column widths based on split
  const getColumnWidths = () => {
    switch (columnSplit) {
      case "60-40": return { left: "60%", right: "40%" };
      case "40-60": return { left: "40%", right: "60%" };
      case "70-30": return { left: "70%", right: "30%" };
      case "30-70": return { left: "30%", right: "70%" };
      default: return { left: "50%", right: "50%" };
    }
  };

  const columnWidths = getColumnWidths();

  // Common wrapper for all sections
  const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative group">
      {/* Section type label */}
      <div className="absolute -top-2 left-3 z-10 flex items-center gap-2">
        <span
          className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: `${meta.color}30`,
            color: meta.color,
          }}
        >
          {meta.icon} {meta.label}
        </span>
        {linkedBlocks.length > 0 && (
          <span className="text-[9px] text-gray-400">
            {linkedBlocks.length} block{linkedBlocks.length !== 1 ? "s" : ""} linked
          </span>
        )}
        {columns === 2 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-medium">
            {columnSplit}
          </span>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeWireframeSection(section.id);
        }}
        className="absolute -top-2 right-2 z-10 w-5 h-5 rounded bg-red-500/20 text-red-400 text-xs
          opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/30"
        title="Remove section"
      >
        ×
      </button>

      {/* Drag handle */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-2 h-8 flex flex-col items-center justify-center gap-0.5 text-gray-400">
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
        </div>
      </div>

      {/* Content with column layout */}
      <div
        className={`
          rounded-lg border-2 border-dashed
          ${isSelected ? "border-blue-500/50" : "border-slate-700/50"}
          bg-slate-900/90 backdrop-blur-sm
          overflow-hidden transition-all
          shadow-lg shadow-black/20
        `}
      >
        {children}
      </div>
    </div>
  );

  // Get variant (default to 'default')
  const variant = section.variant || "default";

  // For 2-column layouts, split content
  const leftBlocks = linkedBlocks.filter((_, i) => i % 2 === 0);
  const rightBlocks = linkedBlocks.filter((_, i) => i % 2 === 1);

  // Render section content with column wrapper
  const renderSectionContent = () => {
    switch (section.type) {
      case "HERO":
        return <HeroSection blocks={linkedBlocks} company={company} accent={companyAccent} variant={variant} />;
      case "VALUE_PROPS":
        return <ValuePropsSection blocks={linkedBlocks} accent={companyAccent} variant={variant} />;
      case "PAIN_POINTS":
        return <PainPointsSection blocks={linkedBlocks} variant={variant} />;
      case "SOLUTIONS":
        return <SolutionsSection blocks={linkedBlocks} accent={companyAccent} variant={variant} />;
      case "FEATURES":
        return <FeaturesSection blocks={linkedBlocks} accent={companyAccent} variant={variant} />;
      case "CONTENT":
        return <ContentSection blocks={linkedBlocks} accent={companyAccent} variant={variant} />;
      case "VERTICALS":
        return (
          <div className="p-6">
            <div className="flex gap-4 mb-4">
              {linkedBlocks.slice(0, 4).map((block, i) => (
                <button
                  key={i}
                  className={`px-4 py-2 rounded-md text-sm ${
                    i === 0
                      ? `bg-${companyAccent}-500/20 text-${companyAccent}-400 border border-${companyAccent}-500/30`
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {block.title}
                </button>
              ))}
              {linkedBlocks.length === 0 && (
                <div className="text-gray-500 text-sm">No verticals linked</div>
              )}
            </div>
            <div className="h-24 rounded-lg bg-gray-700/30 flex items-center justify-center text-gray-500 text-sm">
              Vertical content area
            </div>
          </div>
        );
      case "CTA":
        return <CTASection accent={companyAccent} variant={variant} />;
      case "FOOTER":
        return (
          <div className="p-6 bg-gray-900/50">
            <div className="grid grid-cols-4 gap-4 mb-6">
              {["Product", "Company", "Resources", "Legal"].map((col) => (
                <div key={col}>
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">{col}</h4>
                  <div className="space-y-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-2 bg-gray-700/50 rounded w-16" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-700/50">
              <div className="h-3 w-20 bg-gray-700/50 rounded" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-5 h-5 rounded-full bg-gray-700/50" />
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Render with column layout if 2 columns
  if (columns === 2) {
    return (
      <SectionWrapper>
        <div 
          className="flex gap-3 p-4"
          style={{ 
            display: "flex", 
            flexDirection: "row",
            alignItems: "stretch" 
          }}
        >
          {/* Left Column */}
          <div 
            className="flex-shrink-0 min-h-[100px] rounded-lg overflow-hidden"
            style={{ 
              width: columnWidths.left,
              flexBasis: columnWidths.left,
            }}
          >
            {leftBlocks.length > 0 ? (
              <div className="h-full">
                {section.type === "VALUE_PROPS" && (
                  <ValuePropsSection blocks={leftBlocks} accent={companyAccent} variant="compact" />
                )}
                {section.type === "HERO" && (
                  <HeroSection blocks={leftBlocks} company={company} accent={companyAccent} variant="split" />
                )}
                {section.type === "PAIN_POINTS" && (
                  <PainPointsSection blocks={leftBlocks} variant="compact" />
                )}
                {section.type === "SOLUTIONS" && (
                  <SolutionsSection blocks={leftBlocks} accent={companyAccent} variant="compact" />
                )}
                {section.type === "FEATURES" && (
                  <FeaturesSection blocks={leftBlocks} accent={companyAccent} variant="compact" />
                )}
                {section.type === "CONTENT" && (
                  <ContentSection blocks={leftBlocks} accent={companyAccent} variant="cards" />
                )}
                {(section.type === "VERTICALS" || section.type === "CTA" || section.type === "FOOTER") && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    {leftBlocks.map(b => b.title).join(", ") || "Left column content"}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[80px] border-2 border-dashed border-gray-600/40 rounded-lg flex items-center justify-center text-gray-500 text-xs bg-gray-800/20">
                <div className="text-center p-3">
                  <div className="text-lg mb-1">📋</div>
                  <div>Drop blocks here</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div 
            className="flex-shrink-0 min-h-[100px] rounded-lg overflow-hidden"
            style={{ 
              width: columnWidths.right,
              flexBasis: columnWidths.right,
            }}
          >
            {rightBlocks.length > 0 ? (
              <div className="h-full">
                {section.type === "VALUE_PROPS" && (
                  <ValuePropsSection blocks={rightBlocks} accent={companyAccent} variant="compact" />
                )}
                {section.type === "HERO" && (
                  <HeroSection blocks={rightBlocks} company={company} accent={companyAccent} variant="split" />
                )}
                {section.type === "PAIN_POINTS" && (
                  <PainPointsSection blocks={rightBlocks} variant="compact" />
                )}
                {section.type === "SOLUTIONS" && (
                  <SolutionsSection blocks={rightBlocks} accent={companyAccent} variant="compact" />
                )}
                {section.type === "FEATURES" && (
                  <FeaturesSection blocks={rightBlocks} accent={companyAccent} variant="compact" />
                )}
                {section.type === "CONTENT" && (
                  <ContentSection blocks={rightBlocks} accent={companyAccent} variant="cards" />
                )}
                {(section.type === "VERTICALS" || section.type === "CTA" || section.type === "FOOTER") && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    {rightBlocks.map(b => b.title).join(", ") || "Right column content"}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[80px] border-2 border-dashed border-gray-600/40 rounded-lg flex items-center justify-center text-gray-500 text-xs bg-gray-800/20">
                <div className="text-center p-3">
                  <div className="text-lg mb-1">📋</div>
                  <div>Drop blocks here</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionWrapper>
    );
  }

  // Single column layout
  return (
    <SectionWrapper>
      {renderSectionContent()}
    </SectionWrapper>
  );
}
