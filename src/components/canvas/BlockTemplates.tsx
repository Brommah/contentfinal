"use client";

import React, { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/lib/store";
import type { BlockType, Company, BlockStatus } from "@/lib/types";
import { nanoid } from "nanoid";

interface BlockTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  blocks: Array<{
    type: BlockType;
    title: string;
    subtitle?: string;
    offsetX: number;
    offsetY: number;
  }>;
  connections: Array<{
    from: number;
    to: number;
    type: "FLOWS_INTO" | "SOLVES" | "ENABLES" | "REFERENCES";
  }>;
}

const TEMPLATES: BlockTemplate[] = [
  {
    id: "feature-benefits",
    name: "Feature + Benefits",
    icon: "✨",
    description: "A feature with 3 connected benefits",
    blocks: [
      { type: "FEATURE", title: "New Feature", offsetX: 200, offsetY: 0 },
      { type: "CORE_VALUE_PROP", title: "Benefit 1", offsetX: 0, offsetY: 200 },
      { type: "CORE_VALUE_PROP", title: "Benefit 2", offsetX: 200, offsetY: 200 },
      { type: "CORE_VALUE_PROP", title: "Benefit 3", offsetX: 400, offsetY: 200 },
    ],
    connections: [
      { from: 0, to: 1, type: "ENABLES" },
      { from: 0, to: 2, type: "ENABLES" },
      { from: 0, to: 3, type: "ENABLES" },
    ],
  },
  {
    id: "problem-solution",
    name: "Problem → Solution",
    icon: "💡",
    description: "Pain point with solution and outcome",
    blocks: [
      { type: "PAIN_POINT", title: "Problem", offsetX: 0, offsetY: 100 },
      { type: "SOLUTION", title: "Solution", offsetX: 350, offsetY: 100 },
      { type: "CORE_VALUE_PROP", title: "Outcome", offsetX: 700, offsetY: 100 },
    ],
    connections: [
      { from: 1, to: 0, type: "SOLVES" },
      { from: 1, to: 2, type: "ENABLES" },
    ],
  },
  {
    id: "vertical-stack",
    name: "Vertical Use Case",
    icon: "🎯",
    description: "Industry vertical with features and benefits",
    blocks: [
      { type: "VERTICAL", title: "Industry Vertical", offsetX: 150, offsetY: 0 },
      { type: "PAIN_POINT", title: "Industry Challenge", offsetX: 0, offsetY: 180 },
      { type: "FEATURE", title: "Feature 1", offsetX: 300, offsetY: 180 },
      { type: "SOLUTION", title: "Industry Solution", offsetX: 150, offsetY: 360 },
    ],
    connections: [
      { from: 0, to: 1, type: "REFERENCES" },
      { from: 0, to: 2, type: "REFERENCES" },
      { from: 3, to: 1, type: "SOLVES" },
      { from: 2, to: 3, type: "ENABLES" },
    ],
  },
  {
    id: "tech-stack",
    name: "Tech Component Stack",
    icon: "🔧",
    description: "Technical components with dependencies",
    blocks: [
      { type: "TECH_COMPONENT", title: "Core Infrastructure", offsetX: 150, offsetY: 0 },
      { type: "TECH_COMPONENT", title: "Service Layer", offsetX: 0, offsetY: 180 },
      { type: "TECH_COMPONENT", title: "API Layer", offsetX: 300, offsetY: 180 },
      { type: "FEATURE", title: "User Feature", offsetX: 150, offsetY: 360 },
    ],
    connections: [
      { from: 1, to: 0, type: "FLOWS_INTO" },
      { from: 2, to: 0, type: "FLOWS_INTO" },
      { from: 3, to: 1, type: "FLOWS_INTO" },
      { from: 3, to: 2, type: "FLOWS_INTO" },
    ],
  },
  {
    id: "content-pillar",
    name: "Content Pillar",
    icon: "📚",
    description: "Main article with supporting content",
    blocks: [
      { type: "ARTICLE", title: "Pillar Content", offsetX: 150, offsetY: 0 },
      { type: "ARTICLE", title: "Supporting Post 1", offsetX: 0, offsetY: 180 },
      { type: "ARTICLE", title: "Supporting Post 2", offsetX: 300, offsetY: 180 },
      { type: "ARTICLE", title: "Supporting Post 3", offsetX: 150, offsetY: 360 },
    ],
    connections: [
      { from: 1, to: 0, type: "REFERENCES" },
      { from: 2, to: 0, type: "REFERENCES" },
      { from: 3, to: 1, type: "REFERENCES" },
      { from: 3, to: 2, type: "REFERENCES" },
    ],
  },
];

interface BlockTemplatesProps {
  onClose: () => void;
}

/**
 * BlockTemplates - Modal for inserting pre-built block patterns
 */
export default function BlockTemplates({ onClose }: BlockTemplatesProps) {
  const { screenToFlowPosition, getViewport } = useReactFlow();
  const { addNode, addEdge } = useCanvasStore();
  const [selectedCompany, setSelectedCompany] = useState<Company>("CERE");

  const handleInsertTemplate = (template: BlockTemplate) => {
    const viewport = getViewport();
    
    // Calculate center of viewport
    const centerX = (-viewport.x + window.innerWidth / 2) / viewport.zoom;
    const centerY = (-viewport.y + window.innerHeight / 2) / viewport.zoom;

    // Create blocks with generated IDs
    const blockIds: string[] = [];
    
    template.blocks.forEach((block, index) => {
      const id = nanoid();
      blockIds.push(id);

      addNode({
        id,
        type: block.type,
        company: selectedCompany,
        status: "DRAFT" as BlockStatus,
        title: block.title,
        subtitle: block.subtitle || "",
        content: "",
        tags: [],
        positionX: centerX + block.offsetX - 200,
        positionY: centerY + block.offsetY - 100,
        width: 280,
        height: 120,
        externalUrl: null,
        parentId: null,
        workspaceId: "demo",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Create connections
    template.connections.forEach((conn) => {
      addEdge({
        id: nanoid(),
        fromBlockId: blockIds[conn.from],
        toBlockId: blockIds[conn.to],
        relationshipType: conn.type,
        label: null,
        animated: false,
        style: null,
        workspaceId: "demo",
      });
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Block Templates
            </h2>
            <p className="text-sm text-gray-500">
              Insert pre-built content patterns
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Company Selector */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Insert as
          </label>
          <div className="flex gap-2 mt-2">
            {(["CERE", "CEF", "SHARED"] as Company[]).map((company) => (
              <button
                key={company}
                onClick={() => setSelectedCompany(company)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedCompany === company
                    ? company === "CERE"
                      ? "bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500"
                      : company === "CEF"
                      ? "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500"
                      : "bg-purple-500/20 text-purple-400 ring-2 ring-purple-500"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }
                `}
              >
                {company}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleInsertTemplate(template)}
                className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{template.icon}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-500">
                    {template.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                    {template.blocks.length} blocks
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                    {template.connections.length} connections
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

