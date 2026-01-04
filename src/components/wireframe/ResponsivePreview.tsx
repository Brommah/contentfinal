"use client";

import React from "react";

export type ViewportSize = "desktop" | "tablet" | "mobile";

interface ResponsivePreviewProps {
  viewportSize: ViewportSize;
  onViewportChange: (size: ViewportSize) => void;
}

const VIEWPORTS: { id: ViewportSize; label: string; icon: string; width: string }[] = [
  { id: "desktop", label: "Desktop", icon: "🖥️", width: "100%" },
  { id: "tablet", label: "Tablet", icon: "📱", width: "768px" },
  { id: "mobile", label: "Mobile", icon: "📲", width: "375px" },
];

/**
 * ResponsivePreview - Toggle between viewport sizes
 */
export default function ResponsivePreview({
  viewportSize,
  onViewportChange,
}: ResponsivePreviewProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {VIEWPORTS.map((vp) => (
        <button
          key={vp.id}
          onClick={() => onViewportChange(vp.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
            ${viewportSize === vp.id
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }
          `}
          title={`${vp.label} (${vp.width})`}
        >
          <span>{vp.icon}</span>
          <span className="hidden sm:inline">{vp.label}</span>
        </button>
      ))}
    </div>
  );
}

export function getViewportWidth(size: ViewportSize): string {
  switch (size) {
    case "mobile":
      return "375px";
    case "tablet":
      return "768px";
    default:
      return "100%";
  }
}

