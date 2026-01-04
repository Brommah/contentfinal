"use client";

import React from "react";
import type { SectionType } from "@/lib/wireframe-types";

export type VariantType = "default" | "centered" | "split" | "compact" | "full-width";

interface SectionVariantsProps {
  sectionType: SectionType;
  currentVariant: VariantType;
  onVariantChange: (variant: VariantType) => void;
}

// Available variants per section type
export const VARIANTS_BY_TYPE: Record<SectionType, { id: VariantType; label: string; icon: string }[]> = {
  HERO: [
    { id: "default", label: "Default", icon: "□" },
    { id: "centered", label: "Centered", icon: "◇" },
    { id: "split", label: "Split Image", icon: "◫" },
    { id: "full-width", label: "Full Width", icon: "▭" },
  ],
  VALUE_PROPS: [
    { id: "default", label: "3 Column", icon: "≡" },
    { id: "compact", label: "2 Column", icon: "∥" },
    { id: "full-width", label: "4 Column", icon: "⋮⋮" },
  ],
  PAIN_POINTS: [
    { id: "default", label: "List", icon: "☰" },
    { id: "centered", label: "Cards", icon: "▦" },
  ],
  SOLUTIONS: [
    { id: "default", label: "Grid", icon: "▦" },
    { id: "split", label: "Alternating", icon: "◫" },
  ],
  FEATURES: [
    { id: "default", label: "Grid", icon: "▦" },
    { id: "compact", label: "List", icon: "☰" },
    { id: "centered", label: "Carousel", icon: "◁▷" },
  ],
  VERTICALS: [
    { id: "default", label: "Tabs", icon: "⊞" },
    { id: "compact", label: "Cards", icon: "▦" },
  ],
  CONTENT: [
    { id: "default", label: "Standard", icon: "≡" },
    { id: "centered", label: "Centered", icon: "◇" },
    { id: "split", label: "Split", icon: "◫" },
  ],
  CTA: [
    { id: "default", label: "Banner", icon: "▭" },
    { id: "centered", label: "Centered", icon: "◇" },
    { id: "split", label: "Split", icon: "◫" },
  ],
  FOOTER: [
    { id: "default", label: "Standard", icon: "▬" },
    { id: "compact", label: "Minimal", icon: "—" },
  ],
};

/**
 * SectionVariants - Dropdown to select section layout variant
 */
export default function SectionVariants({
  sectionType,
  currentVariant,
  onVariantChange,
}: SectionVariantsProps) {
  const variants = VARIANTS_BY_TYPE[sectionType] || VARIANTS_BY_TYPE.HERO;

  return (
    <div className="flex items-center gap-1">
      {variants.map((variant) => (
        <button
          key={variant.id}
          onClick={() => onVariantChange(variant.id)}
          className={`
            px-2 py-1 text-[10px] rounded transition-colors
            ${currentVariant === variant.id
              ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            }
          `}
          title={variant.label}
        >
          <span className="font-mono">{variant.icon}</span>
        </button>
      ))}
    </div>
  );
}

