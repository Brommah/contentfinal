"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCanvasStore } from "@/lib/store";
import { getSectionMeta, SECTION_METAS, type SectionType, type ColumnLayout } from "@/lib/wireframe-types";
import type { BlockData, BlockType, BlockStatus } from "@/lib/types";
import BlockLinker from "./BlockLinker";
import SectionVariants, { type VariantType, VARIANTS_BY_TYPE } from "./SectionVariants";
import SectionNotes from "./SectionNotes";
import ColumnLayoutSelector from "./ColumnLayoutSelector";
import { nanoid } from "nanoid";

/**
 * SectionEditor - Sidebar for editing selected section properties
 */
interface Note {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
  color: string;
}

export default function SectionEditor() {
  const {
    selectedSectionId,
    wireframeSections,
    nodes,
    selectSection,
    updateWireframeSection,
    linkBlockToSection,
    unlinkBlockFromSection,
    removeWireframeSection,
  } = useCanvasStore();

  const section = wireframeSections.find((s) => s.id === selectedSectionId);
  const [notes, setNotes] = useState<Record<string, Note[]>>({});

  if (!section) {
    return (
      <aside className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Section Editor
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center text-gray-500">
          <div>
            <div className="text-4xl mb-3">📐</div>
            <p className="text-sm">Click a section to edit</p>
          </div>
        </div>
      </aside>
    );
  }

  const meta = getSectionMeta(section.type);

  // Get available blocks to link based on section type
  const getAvailableBlocks = (): BlockData[] => {
    const linkedTypes = meta.linkedBlockType?.split(",") || [];
    return nodes
      .filter((n) => {
        const data = n.data as unknown as BlockData;
        return (
          linkedTypes.includes(data.type) &&
          (data.company === section.company || data.company === "SHARED")
        );
      })
      .map((n) => n.data as unknown as BlockData);
  };

  const availableBlocks = getAvailableBlocks();
  const linkedBlocks = section.linkedBlockIds
    .map((id) => {
      const node = nodes.find((n) => n.id === id);
      return node ? (node.data as unknown as BlockData) : null;
    })
    .filter((b): b is BlockData => b !== null);

  const handleTypeChange = (newType: SectionType) => {
    updateWireframeSection(section.id, { type: newType });
  };

  const handleToggleBlock = (blockId: string) => {
    if (section.linkedBlockIds.includes(blockId)) {
      unlinkBlockFromSection(section.id, blockId);
    } else {
      linkBlockToSection(section.id, blockId);
    }
  };

  return (
    <aside className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: `${meta.color}20` }}
          >
            {meta.icon}
          </span>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
              {meta.label}
            </h2>
            <p className="text-[10px] text-gray-500">{section.company}</p>
          </div>
        </div>
        <button
          onClick={() => selectSection(null)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Section Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
            Section Type
          </label>
          <select
            value={section.type}
            onChange={(e) => handleTypeChange(e.target.value as SectionType)}
            className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm border-0 focus:ring-2 focus:ring-blue-500"
          >
            {SECTION_METAS.map((m) => (
              <option key={m.type} value={m.type}>
                {m.icon} {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {(["DRAFT", "PENDING_REVIEW", "APPROVED", "NEEDS_CHANGES", "LIVE", "ARCHIVED"] as BlockStatus[]).map((status) => {
              const isActive = section.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateWireframeSection(section.id, { status })}
                  className={`
                    px-2 py-1 rounded-md text-[10px] font-semibold transition-all
                    ${isActive ? "ring-2 ring-offset-1 ring-blue-500" : "opacity-60 hover:opacity-100"}
                    ${status === "DRAFT" ? "bg-gray-500/20 text-gray-400" : ""}
                    ${status === "PENDING_REVIEW" ? "bg-blue-500/20 text-blue-400" : ""}
                    ${status === "APPROVED" ? "bg-green-500/20 text-green-400" : ""}
                    ${status === "NEEDS_CHANGES" ? "bg-red-500/20 text-red-400" : ""}
                    ${status === "LIVE" ? "bg-emerald-500/20 text-emerald-400" : ""}
                    ${status === "ARCHIVED" ? "bg-gray-600/20 text-gray-500" : ""}
                  `}
                >
                  {status === "DRAFT" && "📝"}
                  {status === "PENDING_REVIEW" && "👀"}
                  {status === "APPROVED" && "✅"}
                  {status === "NEEDS_CHANGES" && "❌"}
                  {status === "LIVE" && "🟢"}
                  {status === "ARCHIVED" && "📦"}
                  {" "}{status.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            Set to "Pending Review" to request Fred&apos;s feedback
          </p>
        </div>

        {/* Layout Variant */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
            Layout Variant
          </label>
          <SectionVariants
            sectionType={section.type}
            currentVariant={(section.variant as VariantType) || "default"}
            onVariantChange={(variant) => updateWireframeSection(section.id, { variant })}
          />
        </div>

        {/* Column Layout */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
            Column Layout
          </label>
          <ColumnLayoutSelector
            columns={section.columns || 1}
            columnSplit={section.columnSplit || "50-50"}
            onColumnsChange={(columns: ColumnLayout) => updateWireframeSection(section.id, { columns })}
            onSplitChange={(columnSplit) => updateWireframeSection(section.id, { columnSplit })}
          />
        </div>

        {/* Linked Blocks - using BlockLinker component */}
        {meta.linkedBlockType && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              Content Blocks
            </label>
            <BlockLinker
              sectionId={section.id}
              company={section.company}
              linkedBlockIds={section.linkedBlockIds}
              suggestedTypes={meta.linkedBlockType.split(",") as BlockType[]}
            />
          </div>
        )}

        {/* Cross-navigation to Schema */}
        {linkedBlocks.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-2">
              {linkedBlocks.length} block{linkedBlocks.length !== 1 ? "s" : ""} linked
            </p>
            <ViewInSchemaButton 
              blockIds={section.linkedBlockIds}
              label={`View ${linkedBlocks.length === 1 ? "block" : "blocks"} in Schema`}
            />
          </div>
        )}

        {/* Section Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
            Notes & Feedback
          </label>
          <SectionNotes
            sectionId={section.id}
            notes={notes[section.id] || []}
            onAddNote={(text, color) => {
              const newNote: Note = {
                id: nanoid(),
                text,
                author: "You",
                createdAt: new Date(),
                color,
              };
              setNotes((prev) => ({
                ...prev,
                [section.id]: [...(prev[section.id] || []), newNote],
              }));
            }}
            onDeleteNote={(noteId) => {
              setNotes((prev) => ({
                ...prev,
                [section.id]: (prev[section.id] || []).filter((n) => n.id !== noteId),
              }));
            }}
          />
        </div>

        {/* Section Order */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
            Position
          </label>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Section #{section.order + 1}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            Drag sections in the wireframe to reorder
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => {
            removeWireframeSection(section.id);
            selectSection(null);
          }}
          className="w-full px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
        >
          Remove Section
        </button>
      </div>
    </aside>
  );
}

/**
 * ViewInSchemaButton - Navigates to Schema view and focuses on specified blocks
 */
function ViewInSchemaButton({ blockIds, label }: { blockIds: string[]; label: string }) {
  const router = useRouter();
  const { focusOnNode, selectNodes } = useCanvasStore();

  const handleClick = () => {
    // Focus on the first block if there's only one, otherwise select all
    if (blockIds.length === 1) {
      focusOnNode(blockIds[0]);
    } else if (blockIds.length > 0) {
      selectNodes(blockIds);
    }
    // Navigate to schema tab
    router.push("/?tab=schema");
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
      {label}
    </button>
  );
}

