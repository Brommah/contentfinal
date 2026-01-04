"use client";

import React, { useState } from "react";
import { useCanvasStore } from "@/lib/store";
import { PHASE_CONFIGS } from "@/lib/roadmap-types";
import type { BlockType, Company } from "@/lib/types";

interface AddItemModalProps {
  onClose: () => void;
}

/**
 * AddItemModal - Modal for adding new roadmap items
 */
export default function AddItemModal({ onClose }: AddItemModalProps) {
  const { roadmapPhases, addRoadmapItem, selectRoadmapItem } = useCanvasStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState<Company>("CERE");
  const [phaseId, setPhaseId] = useState(roadmapPhases[0]?.id || "");
  const [contentType, setContentType] = useState<BlockType>("ARTICLE");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [googleDocsUrl, setGoogleDocsUrl] = useState("");
  const [notionPageUrl, setNotionPageUrl] = useState("");
  const [figmaUrl, setFigmaUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const item = addRoadmapItem({
      title: title.trim(),
      description: description.trim(),
      company,
      contentType,
      phaseId,
      status: "PLANNED",
      linkedBlockIds: [],
      dependsOn: [],
      targetDate: new Date(),
      priority,
      tags: [],
      googleDocsUrl: googleDocsUrl.trim() || undefined,
      notionPageUrl: notionPageUrl.trim() || undefined,
      figmaUrl: figmaUrl.trim() || undefined,
    });

    selectRoadmapItem(item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Content Item
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Blog Post: AI Infrastructure"
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm border-0 focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this content piece"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm border-0 focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Company
            </label>
            <div className="flex gap-2">
              {(["CERE", "CEF"] as Company[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCompany(c)}
                  className={`
                    flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${company === c
                      ? c === "CERE"
                        ? "bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500"
                        : "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }
                  `}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Phase */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Phase
            </label>
            <select
              value={phaseId}
              onChange={(e) => setPhaseId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm border-0 focus:ring-2 focus:ring-blue-500"
            >
              {roadmapPhases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {PHASE_CONFIGS[phase.type].icon} {phase.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as BlockType)}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm border-0 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ARTICLE">Article / Blog</option>
              <option value="CORE_VALUE_PROP">Value Proposition</option>
              <option value="VERTICAL">Vertical / Use Case</option>
              <option value="FEATURE">Feature</option>
              <option value="TECH_COMPONENT">Technical Content</option>
              <option value="SOLUTION">Solution</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Priority
            </label>
            <div className="flex gap-2">
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`
                    flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${priority === p
                      ? "ring-2 ring-blue-500 bg-blue-500/20 text-blue-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }
                  `}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* External Links */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              External Links <span className="font-normal">(optional)</span>
            </label>
            <div className="space-y-2">
              {/* Google Docs */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z"/>
                    <path d="M8 12h8v2H8zm0 4h5v2H8z"/>
                  </svg>
                </div>
                <input
                  type="url"
                  value={googleDocsUrl}
                  onChange={(e) => setGoogleDocsUrl(e.target.value)}
                  placeholder="Google Docs URL"
                  className="flex-1 px-2 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs border-0 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notion */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-slate-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h6v2H8v-2z"/>
                  </svg>
                </div>
                <input
                  type="url"
                  value={notionPageUrl}
                  onChange={(e) => setNotionPageUrl(e.target.value)}
                  placeholder="Notion Page URL"
                  className="flex-1 px-2 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs border-0 focus:ring-2 focus:ring-slate-500"
                />
              </div>

              {/* Figma */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2H8a4 4 0 000 8 4 4 0 004 4h4a4 4 0 100-8 4 4 0 00-4-4zm0 12a4 4 0 104 4v-4h-4z"/>
                  </svg>
                </div>
                <input
                  type="url"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="Figma Design URL"
                  className="flex-1 px-2 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs border-0 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

