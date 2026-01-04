"use client";

import React, { useState, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, type BlockData, type Company } from "@/lib/types";
import { DEFAULT_PAGES, getSectionMeta, type WireframeSection } from "@/lib/wireframe-types";

interface ExportFormat {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: "full",
    name: "Full Instructions",
    icon: "📋",
    description: "Complete update instructions with all context",
  },
  {
    id: "changes",
    name: "Changes Only",
    icon: "📝",
    description: "Only blocks with APPROVED or LIVE status changes",
  },
  {
    id: "page",
    name: "Single Page",
    icon: "📄",
    description: "Export instructions for a specific page",
  },
];

/**
 * AIExportInstructions - Generates instructions for AI website updater agent
 */
export default function AIExportInstructions() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("full");
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { nodes, wireframeSections } = useCanvasStore();
  const pages = DEFAULT_PAGES;

  // Generate export content
  const exportContent = useMemo(() => {
    const blocks = nodes.map((n) => n.data as unknown as BlockData);
    const approvedBlocks = blocks.filter((b) => b.status === "APPROVED" || b.status === "LIVE");
    const approvedSections = wireframeSections.filter((s) => s.status === "APPROVED" || s.status === "LIVE");

    // Build the instruction document
    let content = `# Website Content Update Instructions

Generated: ${new Date().toISOString()}
Source: Content Visualizer - CERE & CEF Content Architecture

---

## Overview

This document contains structured instructions for updating the website content.
These changes have been approved through the content review workflow.

---

## CRITICAL: Before Making Changes

1. **Create a backup** of existing content files
2. **Review each section** before implementing
3. **Preserve existing styles** - only update content, not layout
4. **Test locally** before deploying

---

`;

    if (selectedFormat === "changes" || selectedFormat === "full") {
      // Add approved content blocks
      content += `## Approved Content Blocks

`;

      const blocksByCompany: Record<Company, BlockData[]> = {
        CERE: approvedBlocks.filter((b) => b.company === "CERE"),
        CEF: approvedBlocks.filter((b) => b.company === "CEF"),
        SHARED: approvedBlocks.filter((b) => b.company === "SHARED"),
      };

      Object.entries(blocksByCompany).forEach(([company, companyBlocks]) => {
        if (companyBlocks.length === 0) return;

        content += `### ${company} Website

`;

        companyBlocks.forEach((block) => {
          const config = BLOCK_CONFIGS[block.type];
          content += `#### ${config.icon} ${block.title}

- **Type:** ${config.label}
- **ID:** \`${block.id}\`
- **Status:** ${block.status}

**Title:** ${block.title}
**Subtitle:** ${block.subtitle || "N/A"}

**Content:**
\`\`\`
${block.content || "No content specified"}
\`\`\`

---

`;
        });
      });
    }

    // Add page structure
    if (selectedFormat === "full" || selectedFormat === "page") {
      const targetPages = selectedFormat === "page" && selectedPage
        ? pages.filter((p) => p.id === selectedPage)
        : pages;

      content += `## Page Structures

`;

      targetPages.forEach((page) => {
        const pageSections = wireframeSections.filter((s) => s.pageId === page.id);
        if (pageSections.length === 0 && selectedFormat === "page") return;

        content += `### ${page.icon} ${page.name} (${page.company})

**URL:** \`${page.slug || "/"}\`
**Description:** ${page.description || "Main page"}

**Sections (in order):**

`;

        pageSections.forEach((section, index) => {
          const meta = getSectionMeta(section.type);
          const linkedBlocks = section.linkedBlockIds
            .map((id) => blocks.find((b) => b.id === id))
            .filter(Boolean);

          content += `${index + 1}. **${meta.label}** (${section.type})
   - Status: ${section.status || "DRAFT"}
   - Variant: ${section.variant || "default"}
   - Columns: ${section.columns || 1}
`;

          if (linkedBlocks.length > 0) {
            content += `   - Linked Blocks:\n`;
            linkedBlocks.forEach((block) => {
              if (block) {
                content += `     - ${block.title} (\`${block.id}\`)\n`;
              }
            });
          }

          content += `\n`;
        });

        content += `---

`;
      });
    }

    // Add implementation notes
    content += `## Implementation Notes

### File Locations (Expected)

- **CERE Website:** \`/pages/cere/\` or \`/app/(cere)/\`
- **CEF Website:** \`/pages/cef/\` or \`/app/(cef)/\`
- **Shared Components:** \`/components/shared/\`
- **Content Data:** \`/data/content/\` or \`/lib/content/\`

### Content Block Types

| Type | Expected Component | Update Location |
|------|-------------------|-----------------|
| COMPANY | Header, Footer, Meta | Site-wide config |
| CORE_VALUE_PROP | Hero, ValueProps sections | Landing pages |
| PAIN_POINT | Problem sections | Landing pages |
| SOLUTION | Solution sections | Landing, Product pages |
| FEATURE | Feature grids, lists | Product pages |
| VERTICAL | Industry pages | Vertical landing pages |
| ARTICLE | Blog, Docs | Content sections |
| TECH_COMPONENT | Technical docs | Documentation |

### CSS Classes to Preserve

The website uses consistent styling. Only update text content, not:
- Layout classes
- Color themes
- Animation classes
- Responsive breakpoints

---

## Change Summary

- **Approved Blocks:** ${approvedBlocks.length}
- **Approved Sections:** ${approvedSections.length}
- **Companies:** ${new Set(approvedBlocks.map((b) => b.company)).size}
- **Pages:** ${pages.length}

---

*Generated by Content Visualizer*
*Review workflow: CEO Dashboard → Approved → Export*
`;

    return content;
  }, [nodes, wireframeSections, selectedFormat, selectedPage, pages]);

  // Generate JSON export
  const jsonExport = useMemo(() => {
    const blocks = nodes.map((n) => n.data as unknown as BlockData);
    const approvedBlocks = blocks.filter((b) => b.status === "APPROVED" || b.status === "LIVE");

    return JSON.stringify({
      metadata: {
        generatedAt: new Date().toISOString(),
        source: "Content Visualizer",
        format: selectedFormat,
      },
      blocks: approvedBlocks.map((b) => ({
        id: b.id,
        type: b.type,
        company: b.company,
        title: b.title,
        subtitle: b.subtitle,
        content: b.content,
        status: b.status,
      })),
      sections: wireframeSections
        .filter((s) => s.status === "APPROVED" || s.status === "LIVE")
        .map((s) => ({
          id: s.id,
          type: s.type,
          pageId: s.pageId,
          company: s.company,
          linkedBlockIds: s.linkedBlockIds,
          variant: s.variant,
          columns: s.columns,
        })),
    }, null, 2);
  }, [nodes, wireframeSections, selectedFormat]);

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Export for AI Agent
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🤖</span>
                  AI Agent Export Instructions
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Generate instructions for your website updater AI agent
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Format selector */}
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Export Format:</span>
                <div className="flex gap-2">
                  {EXPORT_FORMATS.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedFormat === format.id
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {format.icon} {format.name}
                    </button>
                  ))}
                </div>

                {selectedFormat === "page" && (
                  <select
                    value={selectedPage || ""}
                    onChange={(e) => setSelectedPage(e.target.value)}
                    className="ml-2 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                  >
                    <option value="">Select page...</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.icon} {page.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Markdown view */}
              <div className="flex-1 flex flex-col border-r border-slate-700">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                  <span className="text-xs font-medium text-slate-400">📋 Markdown Instructions</span>
                  <button
                    onClick={() => handleCopy(exportContent)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      copied ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {exportContent}
                  </pre>
                </div>
              </div>

              {/* JSON view */}
              <div className="w-[400px] flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                  <span className="text-xs font-medium text-slate-400">📦 JSON Data</span>
                  <button
                    onClick={() => handleCopy(jsonExport)}
                    className="px-3 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50">
                  <pre className="text-xs text-emerald-400 whitespace-pre-wrap font-mono">
                    {jsonExport}
                  </pre>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  💡 Paste these instructions into your AI coding assistant (Cursor, GitHub Copilot, etc.)
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleCopy(exportContent)}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
                  >
                    Copy Instructions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

