"use client";

import React, { useState, useRef, useEffect } from "react";
import { BlockData, BlockType, Company, BlockStatus, BLOCK_CONFIGS, COMPANY_COLORS } from "@/lib/types";

interface ConnectedBlock {
  block: BlockData | undefined;
  relationship: string | undefined;
}

interface BlockContentEditorProps {
  block: BlockData;
  onUpdate: (updates: Partial<BlockData>) => void;
  connectedBlocks: {
    incoming: ConnectedBlock[];
    outgoing: ConnectedBlock[];
  };
  onSelectBlock: (id: string) => void;
}

/**
 * BlockContentEditor - Rich editor for a single content block
 * Includes title, subtitle, content, metadata, and relationship info
 */
export default function BlockContentEditor({
  block,
  onUpdate,
  connectedBlocks,
  onSelectBlock,
}: BlockContentEditorProps) {
  const [localContent, setLocalContent] = useState(block.content || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(block.title);
  const [newTag, setNewTag] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state with block changes
  useEffect(() => {
    setLocalContent(block.content || "");
    setLocalTitle(block.title);
  }, [block.id, block.content, block.title]);

  // Auto-resize textarea
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [localContent]);

  const handleContentChange = (value: string) => {
    setLocalContent(value);
  };

  const handleContentBlur = () => {
    if (localContent !== block.content) {
      onUpdate({ content: localContent });
    }
  };

  const handleTitleSave = () => {
    if (localTitle !== block.title && localTitle.trim()) {
      onUpdate({ title: localTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !block.tags?.includes(newTag.trim())) {
      onUpdate({ tags: [...(block.tags || []), newTag.trim()] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    onUpdate({ tags: block.tags?.filter((t) => t !== tag) || [] });
  };

  const config = BLOCK_CONFIGS[block.type];
  const companyColor = COMPANY_COLORS[block.company];

  // Word count
  const wordCount = localContent.trim().split(/\s+/).filter(Boolean).length;
  const charCount = localContent.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-start gap-4">
          {/* Block type icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${companyColor.primary}20` }}
          >
            {config.icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            {isEditingTitle ? (
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                className="w-full bg-transparent text-2xl font-bold text-white border-b border-blue-500 focus:outline-none"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-2xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors"
              >
                {block.title}
              </h1>
            )}

            {/* Subtitle */}
            <input
              type="text"
              value={block.subtitle || ""}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              placeholder="Add a subtitle..."
              className="w-full mt-1 bg-transparent text-slate-400 focus:outline-none focus:text-white transition-colors"
            />

            {/* Metadata row */}
            <div className="flex items-center gap-4 mt-3">
              {/* Type */}
              <select
                value={block.type}
                onChange={(e) => onUpdate({ type: e.target.value as BlockType })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(BLOCK_CONFIGS).map((c) => (
                  <option key={c.type} value={c.type}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>

              {/* Company */}
              <select
                value={block.company}
                onChange={(e) => onUpdate({ company: e.target.value as Company })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CERE">🔵 CERE</option>
                <option value="CEF">🟣 CEF</option>
                <option value="SHARED">🟢 SHARED</option>
              </select>

              {/* Status */}
              <select
                value={block.status}
                onChange={(e) => onUpdate({ status: e.target.value as BlockStatus })}
                className={`bg-slate-800 border rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  block.status === "PENDING_REVIEW" ? "border-amber-500 bg-amber-500/10" :
                  block.status === "NEEDS_CHANGES" ? "border-red-500 bg-red-500/10" :
                  block.status === "APPROVED" ? "border-emerald-500 bg-emerald-500/10" :
                  "border-slate-700"
                }`}
              >
                <option value="LIVE">🟢 Live</option>
                <option value="VISION">🔮 Vision</option>
                <option value="DRAFT">📝 Draft</option>
                <option value="ARCHIVED">📦 Archived</option>
                <option value="PENDING_REVIEW">⏳ Pending Review</option>
                <option value="APPROVED">✅ Approved</option>
                <option value="NEEDS_CHANGES">🔄 Needs Changes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          {/* Main content editor */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Content
            </label>
            <textarea
              ref={contentRef}
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              onBlur={handleContentBlur}
              placeholder="Write your content here... Supports markdown formatting."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[200px] font-mono text-sm leading-relaxed"
            />
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>{wordCount} words • {charCount} characters</span>
              <span>Markdown supported</span>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {block.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                placeholder="Add a tag..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* External URL */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              External URL
            </label>
            <input
              type="url"
              value={block.externalUrl || ""}
              onChange={(e) => onUpdate({ externalUrl: e.target.value || null })}
              placeholder="https://..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Connected blocks */}
          {(connectedBlocks.incoming.length > 0 || connectedBlocks.outgoing.length > 0) && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-400 mb-3">
                Relationships
              </label>
              
              {/* Incoming */}
              {connectedBlocks.incoming.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs text-slate-500 mb-2 uppercase tracking-wider">
                    Incoming ({connectedBlocks.incoming.length})
                  </h4>
                  <div className="space-y-1">
                    {connectedBlocks.incoming.map((conn, i) => (
                      conn.block && (
                        <button
                          key={i}
                          onClick={() => onSelectBlock(conn.block!.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800 transition-colors text-left"
                        >
                          <span className="text-xs text-slate-500">←</span>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: COMPANY_COLORS[conn.block.company].primary }}
                          />
                          <span className="text-sm text-white flex-1">{conn.block.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {conn.relationship?.replace(/_/g, " ")}
                          </span>
                        </button>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Outgoing */}
              {connectedBlocks.outgoing.length > 0 && (
                <div>
                  <h4 className="text-xs text-slate-500 mb-2 uppercase tracking-wider">
                    Outgoing ({connectedBlocks.outgoing.length})
                  </h4>
                  <div className="space-y-1">
                    {connectedBlocks.outgoing.map((conn, i) => (
                      conn.block && (
                        <button
                          key={i}
                          onClick={() => onSelectBlock(conn.block!.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800 transition-colors text-left"
                        >
                          <span className="text-xs text-slate-500">→</span>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: COMPANY_COLORS[conn.block.company].primary }}
                          />
                          <span className="text-sm text-white flex-1">{conn.block.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {conn.relationship?.replace(/_/g, " ")}
                          </span>
                        </button>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          ID: <code className="text-slate-400">{block.id}</code>
        </div>
        <div className="text-xs text-slate-500">
          Last updated: {new Date(block.updatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}


