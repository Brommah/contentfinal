"use client";

import React from "react";
import type { BlockData } from "@/lib/types";
import { useCanvasStore } from "@/lib/store";
import EditableText from "../EditableText";

interface ContentSectionProps {
  blocks: BlockData[];
  accent: string;
  variant?: string;
}

/**
 * ContentSection - Generic content section for deeper pages
 * Supports variants: prose (default), cards, steps, grid
 */
export default function ContentSection({ blocks, accent, variant = "prose" }: ContentSectionProps) {
  const { updateNode } = useCanvasStore();

  const contentBlocks = blocks.filter((b) => b.type === "ARTICLE" || b.type === "FEATURE").slice(0, 4);

  const displayItems = contentBlocks.length > 0
    ? contentBlocks
    : [
        { id: "placeholder-1", title: "Content Block", subtitle: "Add your content here", content: "This section displays content blocks linked to this page. Click to edit the text directly.", type: "ARTICLE" },
      ] as BlockData[];

  const handleTitleChange = (blockId: string, value: string) => {
    if (!blockId.startsWith("placeholder")) {
      updateNode(blockId, { title: value });
    }
  };

  const handleSubtitleChange = (blockId: string, value: string) => {
    if (!blockId.startsWith("placeholder")) {
      updateNode(blockId, { subtitle: value });
    }
  };

  const handleContentChange = (blockId: string, value: string) => {
    if (!blockId.startsWith("placeholder")) {
      updateNode(blockId, { content: value });
    }
  };

  // Steps variant - numbered list style
  if (variant === "steps") {
    return (
      <div className="p-6">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          How It Works
        </h2>
        <p className="text-center text-xs text-gray-500 mb-6">
          Follow these steps to get started
        </p>

        <div className="space-y-4">
          {displayItems.map((item, i) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-xl bg-gray-700/20 border border-gray-700/30"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{ backgroundColor: `${accent}20`, color: accent }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <EditableText
                  value={item.title}
                  onChange={(value) => handleTitleChange(item.id, value)}
                  placeholder="Step Title"
                  className="text-base font-semibold text-white mb-1 block"
                  as="h3"
                />
                <EditableText
                  value={item.content || item.subtitle || ""}
                  onChange={(value) => handleContentChange(item.id, value)}
                  placeholder="Describe this step..."
                  className="text-sm text-gray-400 block"
                  as="p"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Cards variant - card grid layout
  if (variant === "cards") {
    return (
      <div className="p-6">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Key Points
        </h2>
        <p className="text-center text-xs text-gray-500 mb-6">
          Everything you need to know
        </p>

        <div className="grid grid-cols-2 gap-4">
          {displayItems.map((item, i) => {
            const icons = ["📝", "💡", "🎯", "✨"];
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-gray-700/20 border border-gray-700/30"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3"
                  style={{ backgroundColor: `${accent}20` }}
                >
                  {icons[i % icons.length]}
                </div>
                <EditableText
                  value={item.title}
                  onChange={(value) => handleTitleChange(item.id, value)}
                  placeholder="Card Title"
                  className="text-sm font-semibold text-white mb-2 block"
                  as="h3"
                />
                <EditableText
                  value={item.content || item.subtitle || ""}
                  onChange={(value) => handleContentChange(item.id, value)}
                  placeholder="Card content..."
                  className="text-xs text-gray-400 block line-clamp-3"
                  as="p"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Grid variant - compact grid
  if (variant === "grid") {
    return (
      <div className="p-6">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Resources
        </h2>
        <p className="text-center text-xs text-gray-500 mb-6">
          Explore our content
        </p>

        <div className="grid grid-cols-3 gap-3">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-gray-700/20 border border-gray-700/30 text-center"
            >
              <EditableText
                value={item.title}
                onChange={(value) => handleTitleChange(item.id, value)}
                placeholder="Title"
                className="text-xs font-medium text-white mb-1 block"
                as="h3"
              />
              <EditableText
                value={item.subtitle || ""}
                onChange={(value) => handleSubtitleChange(item.id, value)}
                placeholder="Subtitle"
                className="text-[10px] text-gray-500 block"
                as="p"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default (prose) variant - long-form content
  return (
    <div className="p-6">
      <div className="space-y-6">
        {displayItems.map((item) => (
          <div key={item.id} className="border-l-2 pl-4" style={{ borderColor: accent }}>
            <EditableText
              value={item.title}
              onChange={(value) => handleTitleChange(item.id, value)}
              placeholder="Section Title"
              className="text-lg font-semibold text-white mb-2 block"
              as="h2"
            />
            {item.subtitle && (
              <EditableText
                value={item.subtitle}
                onChange={(value) => handleSubtitleChange(item.id, value)}
                placeholder="Subtitle or tagline"
                className="text-sm text-gray-400 mb-3 block italic"
                as="p"
              />
            )}
            <EditableText
              value={item.content || ""}
              onChange={(value) => handleContentChange(item.id, value)}
              placeholder="Write your content here. This section supports long-form text and can be used for detailed explanations, guides, or documentation."
              className="text-sm text-gray-300 leading-relaxed block"
              as="p"
            />
          </div>
        ))}
      </div>

      {displayItems.length === 0 && (
        <div className="text-center py-8">
          <div 
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4"
            style={{ backgroundColor: `${accent}20` }}
          >
            📝
          </div>
          <p className="text-sm text-gray-400">
            Link content blocks to populate this section
          </p>
        </div>
      )}
    </div>
  );
}

