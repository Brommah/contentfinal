"use client";

import React, { useState } from "react";
import { useCanvasStore } from "@/lib/store";
import type { SectionType } from "@/lib/wireframe-types";
import type { Company } from "@/lib/types";

interface PageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  sections: SectionType[];
  category: "landing" | "product" | "content" | "conversion";
}

const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "classic-landing",
    name: "Classic Landing",
    description: "Hero → Value Props → Features → CTA",
    icon: "🏠",
    sections: ["HERO", "VALUE_PROPS", "FEATURES", "CTA", "FOOTER"],
    category: "landing",
  },
  {
    id: "problem-solution",
    name: "Problem-Solution",
    description: "Hero → Pain Points → Solutions → CTA",
    icon: "💡",
    sections: ["HERO", "PAIN_POINTS", "SOLUTIONS", "CTA", "FOOTER"],
    category: "landing",
  },
  {
    id: "product-showcase",
    name: "Product Showcase",
    description: "Hero → Features → Value Props → Verticals → CTA",
    icon: "🎯",
    sections: ["HERO", "FEATURES", "VALUE_PROPS", "VERTICALS", "CTA", "FOOTER"],
    category: "product",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Hero → CTA only",
    icon: "✨",
    sections: ["HERO", "CTA"],
    category: "conversion",
  },
  {
    id: "content-heavy",
    name: "Content Page",
    description: "Hero → Content × 3 → CTA",
    icon: "📝",
    sections: ["HERO", "CONTENT", "CONTENT", "CONTENT", "CTA", "FOOTER"],
    category: "content",
  },
  {
    id: "use-case",
    name: "Use Case / Vertical",
    description: "Hero → Pain Points → Solutions → Features → CTA",
    icon: "🏢",
    sections: ["HERO", "PAIN_POINTS", "SOLUTIONS", "FEATURES", "CTA", "FOOTER"],
    category: "product",
  },
  {
    id: "comparison",
    name: "Comparison Page",
    description: "Hero → Value Props → Features → Pain Points → CTA",
    icon: "⚖️",
    sections: ["HERO", "VALUE_PROPS", "FEATURES", "PAIN_POINTS", "CTA", "FOOTER"],
    category: "conversion",
  },
];

interface SectionTemplatesProps {
  company: Company;
  pageId: string;
}

/**
 * SectionTemplates - Pre-built page section combinations
 */
export default function SectionTemplates({ company, pageId }: SectionTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addWireframeSection, wireframeSections } = useCanvasStore();

  const currentSections = wireframeSections.filter(
    (s) => s.company === company && s.pageId === pageId
  );

  const applyTemplate = (template: PageTemplate) => {
    // Clear existing sections for this page? Or add to existing?
    // For now, we'll add sections if the page is empty, otherwise warn
    
    template.sections.forEach((sectionType) => {
      addWireframeSection(company, sectionType, pageId);
    });
  };

  const categories = [
    { id: "landing", label: "Landing", icon: "🏠" },
    { id: "product", label: "Product", icon: "🎯" },
    { id: "content", label: "Content", icon: "📝" },
    { id: "conversion", label: "Conversion", icon: "💰" },
  ];

  const filteredTemplates = selectedCategory
    ? PAGE_TEMPLATES.filter((t) => t.category === selectedCategory)
    : PAGE_TEMPLATES;

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="text-base">📦</span>
        Page Templates
      </h3>

      {/* Category filters */}
      <div className="flex gap-1 mb-3 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
            !selectedCategory
              ? "bg-blue-500/20 text-blue-400 font-medium"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            className={`px-2 py-1 text-[10px] rounded-md transition-colors flex items-center gap-1 ${
              selectedCategory === cat.id
                ? "bg-blue-500/20 text-blue-400 font-medium"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="space-y-2 max-h-[250px] overflow-y-auto">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => applyTemplate(template)}
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{template.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {template.name}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {template.description}
                </p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {template.sections.slice(0, 4).map((section, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                    >
                      {section.replace(/_/g, " ")}
                    </span>
                  ))}
                  {template.sections.length > 4 && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                      +{template.sections.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {currentSections.length > 0 && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-3 text-center">
          Templates will add sections to your existing page
        </p>
      )}
    </div>
  );
}

