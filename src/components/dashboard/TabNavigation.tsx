"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useCanvasStore } from "@/lib/store";

export type TabType = "home" | "schema" | "wireframe" | "roadmap" | "editor" | "content-creation" | "ceo-dashboard" | "analytics";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

// SVG Icons
const Icons = {
  ceo: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M12 4V2" strokeLinecap="round" />
      <path d="M17 6l1-1" strokeLinecap="round" />
      <path d="M7 6L6 5" strokeLinecap="round" />
    </svg>
  ),
  contentEditors: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  architecture: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v4m0 0l-5 6m5-6l5 6" />
    </svg>
  ),
  blocks: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 17h6m-3-3v6" strokeLinecap="round" />
    </svg>
  ),
  website: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="9" cy="6" r="1" fill="currentColor" />
    </svg>
  ),
  studio: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3L2 9l10 6 10-6-10-6z" />
      <path d="M2 15l10 6 10-6" />
      <path d="M12 12v9" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  roadmap: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" strokeLinecap="round" />
      <path d="M3 12h12" strokeLinecap="round" />
      <path d="M3 18h8" strokeLinecap="round" />
      <circle cx="21" cy="6" r="2" />
      <circle cx="17" cy="12" r="2" />
      <circle cx="13" cy="18" r="2" />
    </svg>
  ),
  analytics: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 16l4-4 4 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="8" r="2" />
    </svg>
  ),
};

// Content Editors dropdown items with icons
const CONTENT_EDITORS: { id: TabType; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "schema", label: "Architecture", description: "Content schema & relationships", icon: Icons.architecture },
  { id: "editor", label: "Building Blocks", description: "Edit content blocks", icon: Icons.blocks },
  { id: "wireframe", label: "Website Builder", description: "Design page layouts", icon: Icons.website },
  { id: "content-creation", label: "Content Studio", description: "AI-powered content workbench", icon: Icons.studio },
];

/**
 * TabNavigation - Clean horizontal nav bar with dropdown and notification badges
 */
export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Get live counts from store
  const { nodes, wireframeSections, roadmapItems, suggestions, reviewRequests } = useCanvasStore();

  // Calculate badge counts for each section
  const badgeCounts = useMemo(() => {
    const pendingReviews = nodes.filter(n => n.data.status === "PENDING_REVIEW").length;
    const pendingReviewRequests = reviewRequests?.filter(r => r.status === "PENDING" || r.status === "IN_REVIEW").length || 0;
    const pendingSections = wireframeSections.filter(s => s.status === "PENDING_REVIEW").length;
    const pendingRoadmap = roadmapItems.filter(i => i.status === "REVIEW").length;
    const pendingSuggestions = suggestions?.filter(s => s.status === "PENDING").length || 0;

    return {
      ceo: pendingReviews + pendingReviewRequests + pendingSuggestions,
      schema: nodes.filter(n => n.data.status === "NEEDS_CHANGES").length,
      wireframe: pendingSections,
      roadmap: pendingRoadmap,
      analytics: 0, // No badge for analytics
    };
  }, [nodes, wireframeSections, roadmapItems, suggestions, reviewRequests]);

  // Check if current tab is in the content editors group
  const isContentEditorActive = CONTENT_EDITORS.some((item) => item.id === activeTab);
  const activeEditor = CONTENT_EDITORS.find((item) => item.id === activeTab);

  // Total badge count for Content Editors dropdown
  const contentEditorsBadge = badgeCounts.schema + badgeCounts.wireframe;

  // Update dropdown position when opened
  useEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2 - 128, // Center the 256px dropdown
      });
    }
  }, [dropdownOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <nav className="flex items-center gap-1" data-tour="tabs">
      {/* Home */}
      <NavButton
        active={activeTab === "home"}
        onClick={() => onTabChange("home")}
        icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        }
      >
        Home
      </NavButton>

      {/* CEO View with Badge */}
      <NavButton
        active={activeTab === "ceo-dashboard"}
        onClick={() => onTabChange("ceo-dashboard")}
        icon={Icons.ceo}
        badge={badgeCounts.ceo}
        badgeColor="amber"
      >
        CEO View
      </NavButton>

      {/* Content Editors Dropdown */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`
            relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${isContentEditorActive
              ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }
          `}
        >
          {isContentEditorActive && activeEditor ? activeEditor.icon : Icons.contentEditors}
          <span>Content Editors</span>
          {isContentEditorActive && activeEditor && (
            <span className="text-xs text-cyan-300/70">• {activeEditor.label}</span>
          )}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          
          {/* Badge for dropdown */}
          {contentEditorsBadge > 0 && !isContentEditorActive && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-cyan-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {contentEditorsBadge > 9 ? "9+" : contentEditorsBadge}
            </span>
          )}
        </button>

        {/* Dropdown Menu - rendered via Portal */}
        {dropdownOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: dropdownPos.top,
                left: dropdownPos.left,
                zIndex: 9999,
              }}
              className="w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="p-2 space-y-1">
                {CONTENT_EDITORS.map((item) => {
                  const itemBadge = item.id === "schema" ? badgeCounts.schema : 
                                   item.id === "wireframe" ? badgeCounts.wireframe : 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setDropdownOpen(false);
                      }}
                      className={`
                        w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left
                        transition-all duration-150 relative
                        ${activeTab === item.id
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }
                      `}
                    >
                      <span className={`mt-0.5 ${activeTab === item.id ? "text-cyan-400" : "text-slate-500"}`}>
                        {item.icon}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium block">{item.label}</span>
                        <span className="text-xs text-slate-500">{item.description}</span>
                      </div>
                      {itemBadge > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {itemBadge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )}
      </div>

      {/* Roadmap with Badge */}
      <NavButton
        active={activeTab === "roadmap"}
        onClick={() => onTabChange("roadmap")}
        icon={Icons.roadmap}
        badge={badgeCounts.roadmap}
        badgeColor="blue"
      >
        Roadmap
      </NavButton>

      {/* Analytics */}
      <NavButton
        active={activeTab === "analytics"}
        onClick={() => onTabChange("analytics")}
        icon={Icons.analytics}
      >
        Analytics
      </NavButton>
    </nav>
  );
}

/**
 * NavButton - Styled navigation button with icon and optional badge
 */
function NavButton({
  children,
  active,
  onClick,
  icon,
  badge,
  badgeColor = "red",
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  badge?: number;
  badgeColor?: "red" | "amber" | "blue" | "green";
}) {
  const badgeColors = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    green: "bg-emerald-500",
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
        transition-all duration-200
        ${active
          ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/30"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
        }
      `}
    >
      <span className={active ? "text-cyan-400" : "text-slate-500"}>{icon}</span>
      {children}
      
      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <span className={`
          absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
          ${badgeColors[badgeColor]} text-white text-[10px] font-bold 
          rounded-full flex items-center justify-center
          animate-in fade-in zoom-in duration-200
        `}>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}
