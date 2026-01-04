"use client";

/**
 * Block Templates Library
 * 
 * Pre-filled content templates for quick block creation
 */

import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useCanvasStore } from "@/lib/store";
import type { BlockType, Company, BlockData } from "@/lib/types";
import { useToast } from "@/components/ui";

interface BlockTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: BlockType;
  company: Company;
  blocks: Partial<BlockData>[];
  icon: string;
}

const TEMPLATES: BlockTemplate[] = [
  {
    id: "enterprise-security",
    name: "Enterprise Security Stack",
    description: "Pain point + 3 security-focused solutions",
    category: "Security",
    type: "PAIN_POINT",
    company: "CERE",
    icon: "🔒",
    blocks: [
      {
        type: "PAIN_POINT",
        title: "Data Security Concerns",
        content:
          "Enterprises face increasing threats to sensitive data, with traditional centralized storage creating single points of failure and vulnerability to breaches.",
      },
      {
        type: "SOLUTION",
        title: "Decentralized Data Storage",
        content:
          "Distribute data across multiple nodes, eliminating single points of failure and reducing attack surfaces.",
      },
      {
        type: "SOLUTION",
        title: "End-to-End Encryption",
        content:
          "Military-grade encryption ensures data remains secure at rest and in transit, with customer-controlled keys.",
      },
      {
        type: "SOLUTION",
        title: "Immutable Audit Trail",
        content:
          "Blockchain-based audit logs provide tamper-proof records of all data access and modifications.",
      },
    ],
  },
  {
    id: "value-prop-framework",
    name: "Value Proposition Framework",
    description: "Core value prop with supporting pain points",
    category: "Messaging",
    type: "CORE_VALUE_PROP",
    company: "SHARED",
    icon: "💎",
    blocks: [
      {
        type: "CORE_VALUE_PROP",
        title: "[Your Core Value]",
        content:
          "We help [target customer] achieve [desired outcome] by providing [unique approach], unlike [alternatives] that [limitation].",
      },
      {
        type: "PAIN_POINT",
        title: "Pain Point 1",
        content: "Describe the primary challenge your target customer faces...",
      },
      {
        type: "PAIN_POINT",
        title: "Pain Point 2",
        content: "Describe a secondary challenge that compounds the problem...",
      },
      {
        type: "PAIN_POINT",
        title: "Pain Point 3",
        content: "Describe the consequence of not solving these challenges...",
      },
    ],
  },
  {
    id: "feature-launch",
    name: "Feature Launch Pack",
    description: "Feature with use cases and tech components",
    category: "Product",
    type: "FEATURE",
    company: "SHARED",
    icon: "🚀",
    blocks: [
      {
        type: "FEATURE",
        title: "[New Feature Name]",
        content:
          "Brief description of the feature and its primary benefit to users.",
      },
      {
        type: "SOLUTION",
        title: "Use Case: [Persona 1]",
        content: "How this feature helps the first key persona...",
      },
      {
        type: "SOLUTION",
        title: "Use Case: [Persona 2]",
        content: "How this feature helps the second key persona...",
      },
      {
        type: "TECH_COMPONENT",
        title: "Technical Implementation",
        content: "Key technical details and architecture notes...",
      },
    ],
  },
  {
    id: "vertical-expansion",
    name: "Vertical Market Entry",
    description: "Vertical with tailored pain points and solutions",
    category: "Markets",
    type: "VERTICAL",
    company: "SHARED",
    icon: "🎯",
    blocks: [
      {
        type: "VERTICAL",
        title: "[Industry] Vertical",
        content:
          "Overview of the vertical market, size, and strategic importance.",
      },
      {
        type: "PAIN_POINT",
        title: "Industry-Specific Challenge",
        content: "Key challenge unique to this vertical...",
      },
      {
        type: "SOLUTION",
        title: "Tailored Solution",
        content: "How our product specifically addresses this vertical's needs...",
      },
      {
        type: "FEATURE",
        title: "Vertical-Specific Feature",
        content: "Special capability designed for this market...",
      },
    ],
  },
  {
    id: "competitor-positioning",
    name: "Competitive Positioning",
    description: "Pain points that highlight competitive advantages",
    category: "Strategy",
    type: "PAIN_POINT",
    company: "SHARED",
    icon: "⚔️",
    blocks: [
      {
        type: "PAIN_POINT",
        title: "Competitor Limitation 1",
        content: "What competitors fail to deliver that customers need...",
      },
      {
        type: "PAIN_POINT",
        title: "Competitor Limitation 2",
        content: "Another gap in competitor offerings...",
      },
      {
        type: "SOLUTION",
        title: "Our Differentiator",
        content: "How we uniquely solve what competitors cannot...",
      },
      {
        type: "CORE_VALUE_PROP",
        title: "Competitive Advantage Summary",
        content: "Clear statement of why customers choose us over alternatives.",
      },
    ],
  },
];

interface BlockTemplatesLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BlockTemplatesLibrary({
  isOpen,
  onClose,
}: BlockTemplatesLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const { addNode, addEdge, viewport } = useCanvasStore();
  const { success } = useToast();

  const categories = ["all", ...new Set(TEMPLATES.map((t) => t.category))];

  const filteredTemplates =
    selectedCategory === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleApplyTemplate = useCallback(
    (template: BlockTemplate) => {
      const createdNodes: string[] = [];
      const baseX = viewport.x + 100;
      const baseY = viewport.y + 100;

      // Create all blocks in the template
      template.blocks.forEach((blockData, index) => {
        const node = addNode({
          ...blockData,
          company: blockData.company || template.company,
          positionX: baseX + (index % 2) * 350,
          positionY: baseY + Math.floor(index / 2) * 180,
          status: "DRAFT",
        });
        createdNodes.push(node.id);
      });

      // Connect first block to subsequent blocks
      if (createdNodes.length > 1) {
        createdNodes.slice(1).forEach((targetId) => {
          addEdge({
            fromBlockId: createdNodes[0],
            toBlockId: targetId,
            relationshipType: "REFERENCES",
          });
        });
      }

      success("✅ Template Applied", `Created ${template.blocks.length} blocks from "${template.name}"`);

      onClose();
    },
    [addNode, addEdge, viewport, success, onClose]
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>📚</span>
              Block Templates Library
            </h2>
            <p className="text-sm text-slate-400">
              Pre-built content structures for quick creation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-3 border-b border-slate-700 flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {category === "all" ? "All Templates" : category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group relative p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredTemplate(template.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
                onClick={() => handleApplyTemplate(template)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                        {template.blocks.length} blocks
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                        {template.company}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview on hover */}
                {hoveredTemplate === template.id && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="text-xs text-slate-500 mb-2">Contains:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.blocks.map((block, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded"
                        >
                          {block.type?.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apply button */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded">
                    Use Template
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

