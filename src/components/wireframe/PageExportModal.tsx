"use client";

import React, { useMemo, useState } from "react";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, BlockData } from "@/lib/types";
import { 
  WireframePage, 
  WireframeSection, 
  getSectionMeta,
  SectionType
} from "@/lib/wireframe-types";
import { useToast } from "@/components/ui/Toast";

interface PageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: WireframePage;
  sections: WireframeSection[];
}

// Format section config for the export
function formatSectionConfig(section: WireframeSection): string {
  const config = section.config;
  const lines: string[] = [];
  
  if (config.type === "HERO") {
    lines.push(`  - Variant: ${config.config.variant}`);
    lines.push(`  - Show Subtitle: ${config.config.showSubtitle ? "Yes" : "No"}`);
    lines.push(`  - Show CTA: ${config.config.showCTA ? "Yes" : "No"}`);
  } else if (config.type === "VALUE_PROPS") {
    lines.push(`  - Columns: ${config.config.columns}`);
    lines.push(`  - Show Icons: ${config.config.showIcons ? "Yes" : "No"}`);
    lines.push(`  - Style: ${config.config.style}`);
  } else if (config.type === "PAIN_POINTS") {
    lines.push(`  - Layout: ${config.config.layout}`);
    lines.push(`  - Show Numbers: ${config.config.showNumbers ? "Yes" : "No"}`);
  } else if (config.type === "SOLUTIONS") {
    lines.push(`  - Layout: ${config.config.layout}`);
    lines.push(`  - Columns: ${config.config.columns}`);
  } else if (config.type === "FEATURES") {
    lines.push(`  - Layout: ${config.config.layout}`);
    lines.push(`  - Columns: ${config.config.columns}`);
    lines.push(`  - Show Descriptions: ${config.config.showDescriptions ? "Yes" : "No"}`);
  } else if (config.type === "VERTICALS") {
    lines.push(`  - Style: ${config.config.style}`);
  } else if (config.type === "CONTENT") {
    lines.push(`  - Layout: ${config.config.layout}`);
    lines.push(`  - Show Icons: ${config.config.showIcons ? "Yes" : "No"}`);
    lines.push(`  - Columns: ${config.config.columns}`);
  } else if (config.type === "CTA") {
    lines.push(`  - Variant: ${config.config.variant}`);
    lines.push(`  - Button Text: "${config.config.buttonText}"`);
    lines.push(`  - Secondary Button: ${config.config.secondaryButton ? "Yes" : "No"}`);
  } else if (config.type === "FOOTER") {
    lines.push(`  - Columns: ${config.config.columns}`);
    lines.push(`  - Show Social: ${config.config.showSocial ? "Yes" : "No"}`);
    lines.push(`  - Show Newsletter: ${config.config.showNewsletter ? "Yes" : "No"}`);
  }

  // Add column layout if set
  if (section.columns && section.columns > 1) {
    lines.push(`  - Column Layout: ${section.columns} columns`);
    if (section.columnSplit) {
      lines.push(`  - Column Split: ${section.columnSplit}`);
    }
  }

  return lines.join("\n");
}

// Format a single block for export
function formatBlock(block: BlockData, index: number): string {
  const config = BLOCK_CONFIGS[block.type];
  const lines: string[] = [];
  
  lines.push(`      ${index + 1}. ${block.title}`);
  lines.push(`         Type: ${config.label}`);
  lines.push(`         Status: ${block.status.replace(/_/g, " ")}`);
  
  if (block.subtitle) {
    lines.push(`         Subtitle: ${block.subtitle}`);
  }
  
  if (block.content) {
    // Truncate content for preview, show full in export
    const content = block.content.replace(/\n/g, " ").trim();
    lines.push(`         Content: ${content}`);
  }
  
  if (block.tags && block.tags.length > 0) {
    lines.push(`         Tags: ${block.tags.join(", ")}`);
  }

  return lines.join("\n");
}

export function PageExportModal({ isOpen, onClose, page, sections }: PageExportModalProps) {
  const { nodes } = useCanvasStore();
  const { success } = useToast();
  const [includeStatus, setIncludeStatus] = useState(true);
  const [includeConfig, setIncludeConfig] = useState(true);
  const [includeEmptySections, setIncludeEmptySections] = useState(false);

  // Get blocks by their IDs
  const getBlocksById = (ids: string[]): BlockData[] => {
    return ids
      .map(id => nodes.find(n => n.id === id)?.data)
      .filter((block): block is BlockData => block !== undefined);
  };

  // Generate the export content
  const exportContent = useMemo(() => {
    const timestamp = new Date().toLocaleString();
    const lines: string[] = [];

    // Header
    lines.push("═".repeat(60));
    lines.push("WEBSITE PAGE DESIGN & COPY INSTRUCTIONS");
    lines.push("═".repeat(60));
    lines.push("");
    lines.push(`Page: ${page.name}`);
    lines.push(`URL: ${page.slug}`);
    lines.push(`Company: ${page.company}`);
    lines.push(`Description: ${page.description}`);
    lines.push(`Generated: ${timestamp}`);
    lines.push("");
    lines.push("─".repeat(60));
    lines.push("");

    // Sort sections by order
    const sortedSections = [...sections].sort((a, b) => a.order - b.order);

    sortedSections.forEach((section, sectionIndex) => {
      const meta = getSectionMeta(section.type);
      const linkedBlocks = getBlocksById(section.linkedBlockIds);
      
      // Skip empty sections if not including them
      if (!includeEmptySections && linkedBlocks.length === 0) {
        return;
      }

      lines.push(`SECTION ${sectionIndex + 1}: ${meta.label.toUpperCase()}`);
      lines.push(`${"─".repeat(40)}`);
      lines.push(`${meta.icon} ${meta.description}`);
      lines.push("");

      if (includeStatus) {
        lines.push(`Status: ${section.status.replace(/_/g, " ")}`);
      }

      if (includeConfig) {
        lines.push("");
        lines.push("Design Configuration:");
        lines.push(formatSectionConfig(section));
      }

      lines.push("");
      lines.push("Linked Content Blocks:");
      
      if (linkedBlocks.length === 0) {
        lines.push("   (No content blocks linked to this section)");
      } else {
        linkedBlocks.forEach((block, blockIndex) => {
          lines.push("");
          lines.push(formatBlock(block, blockIndex));
        });
      }

      lines.push("");
      lines.push("");
    });

    // Footer
    lines.push("═".repeat(60));
    lines.push("END OF DESIGN INSTRUCTIONS");
    lines.push("═".repeat(60));
    lines.push("");
    lines.push("NOTES FOR DESIGNER/DEVELOPER:");
    lines.push("- Each section should be implemented in order from top to bottom");
    lines.push("- Use the Design Configuration to guide layout decisions");
    lines.push("- Content blocks provide the actual copy and structure");
    lines.push("- Status indicates approval state of each element");
    lines.push("");

    return lines.join("\n");
  }, [page, sections, nodes, includeStatus, includeConfig, includeEmptySections]);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportContent);
      success("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Download as TXT
  const handleDownload = () => {
    const blob = new Blob([exportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${page.slug.replace(/\//g, "-") || "page"}-design-instructions.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success("Downloaded design instructions!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Export Design Instructions</h2>
              <p className="text-sm text-slate-400">{page.icon} {page.name} • {page.slug}</p>
            </div>
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

        {/* Options Bar */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-800 bg-slate-900/50">
          <span className="text-sm text-slate-400">Include:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeStatus}
              onChange={(e) => setIncludeStatus(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-300">Status</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeConfig}
              onChange={(e) => setIncludeConfig(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-300">Design Config</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeEmptySections}
              onChange={(e) => setIncludeEmptySections(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-300">Empty Sections</span>
          </label>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-auto p-6">
          <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-[50vh] overflow-auto">
            {exportContent}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-900/80">
          <p className="text-sm text-slate-500">
            {sections.length} sections • {sections.reduce((acc, s) => acc + s.linkedBlockIds.length, 0)} linked blocks
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to Clipboard
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download TXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


