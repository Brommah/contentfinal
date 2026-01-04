"use client";

import React, { useState } from "react";
import { useCanvasStore } from "@/lib/store";
import {
  exportToMarkdown,
  exportToJSON,
  exportToNotion,
  exportToCSV,
  downloadFile,
} from "@/lib/export";
import type { Company } from "@/lib/types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = "markdown" | "json" | "notion" | "csv";

const FORMAT_INFO: Record<ExportFormat, { label: string; icon: string; desc: string; ext: string; mime: string }> = {
  markdown: {
    label: "Markdown",
    icon: "📝",
    desc: "Formatted document with headers and sections",
    ext: "md",
    mime: "text/markdown",
  },
  json: {
    label: "JSON",
    icon: "📦",
    desc: "Structured data for programmatic use",
    ext: "json",
    mime: "application/json",
  },
  notion: {
    label: "Notion",
    icon: "📒",
    desc: "Markdown optimized for Notion import",
    ext: "md",
    mime: "text/markdown",
  },
  csv: {
    label: "CSV",
    icon: "📊",
    desc: "Spreadsheet-compatible format",
    ext: "csv",
    mime: "text/csv",
  },
};

/**
 * Export modal with format options and preview
 */
export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { nodes, edges, workspaceName } = useCanvasStore();
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [includeConnections, setIncludeConnections] = useState(true);
  const [includeStatus, setIncludeStatus] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [groupByCompany, setGroupByCompany] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>(["CERE", "CEF", "SHARED"]);
  const [preview, setPreview] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const toggleCompany = (company: Company) => {
    setSelectedCompanies((prev) =>
      prev.includes(company)
        ? prev.filter((c) => c !== company)
        : [...prev, company]
    );
  };

  const generateExport = (): string => {
    switch (format) {
      case "markdown":
        return exportToMarkdown(nodes, edges, workspaceName, {
          includeConnections,
          includeStatus,
          includeTags,
          groupByCompany,
          companies: selectedCompanies,
        });
      case "json":
        return exportToJSON(nodes, edges, workspaceName);
      case "notion":
        return exportToNotion(nodes, edges, workspaceName);
      case "csv":
        return exportToCSV(nodes);
      default:
        return "";
    }
  };

  const handlePreview = () => {
    setPreview(generateExport());
    setShowPreview(true);
  };

  const handleExport = () => {
    const content = generateExport();
    const info = FORMAT_INFO[format];
    const filename = `${workspaceName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.${info.ext}`;
    downloadFile(content, filename, info.mime);
    onClose();
  };

  const handleCopyToClipboard = () => {
    const content = generateExport();
    navigator.clipboard.writeText(content);
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
      <div className="relative bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Export Content</h2>
            <p className="text-sm text-slate-400 mt-1">
              {nodes.length} blocks, {edges.length} connections
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Format selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(FORMAT_INFO) as [ExportFormat, typeof FORMAT_INFO[ExportFormat]][]).map(
                ([key, info]) => (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${format === key
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 hover:border-slate-600"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{info.icon}</span>
                      <span className="font-medium text-white">{info.label}</span>
                    </div>
                    <p className="text-xs text-slate-400">{info.desc}</p>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Options (for markdown/notion) */}
          {(format === "markdown" || format === "notion") && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">
                Options
              </label>
              
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeConnections}
                    onChange={(e) => setIncludeConnections(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                  />
                  Include relationships
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeStatus}
                    onChange={(e) => setIncludeStatus(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                  />
                  Show status
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeTags}
                    onChange={(e) => setIncludeTags(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                  />
                  Include tags
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={groupByCompany}
                    onChange={(e) => setGroupByCompany(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                  />
                  Group by company
                </label>
              </div>

              {/* Company filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Companies
                </label>
                <div className="flex gap-2">
                  {(["CERE", "CEF", "SHARED"] as Company[]).map((company) => (
                    <button
                      key={company}
                      onClick={() => toggleCompany(company)}
                      className={`
                        px-3 py-1.5 rounded-md text-sm font-medium transition-all
                        ${selectedCompanies.includes(company)
                          ? company === "CERE"
                            ? "bg-blue-500 text-white"
                            : company === "CEF"
                            ? "bg-purple-500 text-white"
                            : "bg-emerald-500 text-white"
                          : "bg-slate-800 text-slate-400"
                        }
                      `}
                    >
                      {company}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {showPreview && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300">
                  Preview
                </label>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Hide
                </button>
              </div>
              <pre className="bg-slate-950 rounded-lg p-4 text-xs text-slate-300 overflow-auto max-h-64 font-mono">
                {preview}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={handlePreview}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            👁️ Preview
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleCopyToClipboard}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              📋 Copy to Clipboard
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              ⬇️ Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


