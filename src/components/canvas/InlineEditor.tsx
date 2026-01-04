"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, type BlockData, type BlockStatus } from "@/lib/types";

interface InlineEditorProps {
  blockId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

const STATUS_OPTIONS: { value: BlockStatus; label: string; color: string }[] = [
  { value: "DRAFT", label: "Draft", color: "bg-gray-500" },
  { value: "PENDING_REVIEW", label: "Review", color: "bg-amber-500" },
  { value: "APPROVED", label: "Approved", color: "bg-emerald-500" },
  { value: "LIVE", label: "Live", color: "bg-blue-500" },
  { value: "VISION", label: "Vision", color: "bg-purple-500" },
];

/**
 * InlineEditor - Quick edit popover for blocks on double-click
 */
export default function InlineEditor({ blockId, position, onClose }: InlineEditorProps) {
  const { nodes, updateNode } = useCanvasStore();
  const node = nodes.find((n) => n.id === blockId);
  const block = node?.data as unknown as BlockData | undefined;
  
  const [title, setTitle] = useState(block?.title || "");
  const [subtitle, setSubtitle] = useState(block?.subtitle || "");
  const [status, setStatus] = useState<BlockStatus>(block?.status || "DRAFT");
  const [mounted, setMounted] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    // Focus title input on open
    setTimeout(() => titleRef.current?.focus(), 100);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        handleSave();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [title, subtitle, status]);

  const handleSave = () => {
    if (block) {
      updateNode(blockId, {
        title,
        subtitle,
        status,
        updatedAt: new Date(),
      });
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  if (!block || !mounted) return null;

  const config = BLOCK_CONFIGS[block.type];

  // Calculate position to keep within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 360),
    y: Math.min(position.y, window.innerHeight - 300),
  };

  return createPortal(
    <div
      ref={editorRef}
      className="fixed z-[100] w-[340px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-slate-700 flex items-center gap-3"
        style={{ backgroundColor: `${config.borderColor}15` }}
      >
        <span className="text-xl">{config.icon}</span>
        <div className="flex-1">
          <p className="text-xs text-slate-400">{config.label}</p>
          <p className="text-[10px] text-slate-500">Quick Edit</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Title
          </label>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Block title..."
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Subtitle
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Short description..."
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Status
          </label>
          <div className="flex gap-1 mt-1">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  status === opt.value
                    ? `${opt.color} text-white`
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
        <p className="text-[10px] text-slate-500">
          <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[9px]">⌘</kbd>
          <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[9px] ml-0.5">↵</kbd>
          <span className="ml-1">to save</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

