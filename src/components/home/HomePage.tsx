"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import type { TabType } from "@/components/dashboard/TabNavigation";

interface BentoCard {
  id: TabType | "home";
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  fallbackGradient: string;
  size: "hero" | "featured" | "standard" | "compact";
  accentColor: string;
  order: number;
}

const BENTO_CARDS: BentoCard[] = [
  {
    id: "ceo-dashboard",
    title: "CEO View",
    subtitle: "Executive Overview",
    description: "Monitor content health, review pending items, track progress across all initiatives",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M12 4V2" strokeLinecap="round" />
        <path d="M17 6l1-1" strokeLinecap="round" />
        <path d="M7 6L6 5" strokeLinecap="round" />
      </svg>
    ),
    fallbackGradient: "from-violet-600/30 via-purple-600/20 to-fuchsia-600/30",
    size: "hero",
    accentColor: "violet",
    order: 1,
  },
  {
    id: "schema",
    title: "Architecture",
    subtitle: "Content Schema",
    description: "Visualize and manage content relationships, blocks, and connections",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="5" r="2.5" />
        <circle cx="5" cy="19" r="2.5" />
        <circle cx="19" cy="19" r="2.5" />
        <path d="M12 7.5v4m0 0l-5 5.5m5-5.5l5 5.5" />
      </svg>
    ),
    fallbackGradient: "from-cyan-600/30 via-blue-600/20 to-indigo-600/30",
    size: "featured",
    accentColor: "cyan",
    order: 2,
  },
  {
    id: "wireframe",
    title: "Website Builder",
    subtitle: "Page Designer",
    description: "Design page layouts and link content blocks to wireframe sections",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
        <circle cx="6" cy="6" r="1" fill="currentColor" />
        <circle cx="9" cy="6" r="1" fill="currentColor" />
      </svg>
    ),
    fallbackGradient: "from-orange-600/30 via-amber-600/20 to-yellow-600/30",
    size: "featured",
    accentColor: "amber",
    order: 3,
  },
  {
    id: "editor",
    title: "Building Blocks",
    subtitle: "Content Editor",
    description: "Create and edit content blocks with rich formatting and AI assistance",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <path d="M14 17h6m-3-3v6" strokeLinecap="round" />
      </svg>
    ),
    fallbackGradient: "from-emerald-600/30 via-green-600/20 to-teal-600/30",
    size: "standard",
    accentColor: "emerald",
    order: 4,
  },
  {
    id: "content-creation",
    title: "Content Studio",
    subtitle: "AI Workbench",
    description: "Generate announcements, blogs, social posts with AI-powered templates",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3L2 9l10 6 10-6-10-6z" />
        <path d="M2 15l10 6 10-6" />
        <path d="M12 12v9" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
    fallbackGradient: "from-pink-600/30 via-rose-600/20 to-red-600/30",
    size: "standard",
    accentColor: "pink",
    order: 5,
  },
  {
    id: "roadmap",
    title: "Roadmap",
    subtitle: "Project Timeline",
    description: "Plan and track content initiatives, milestones, and deliverables",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 6h18" strokeLinecap="round" />
        <path d="M3 12h12" strokeLinecap="round" />
        <path d="M3 18h8" strokeLinecap="round" />
        <circle cx="21" cy="6" r="2" />
        <circle cx="17" cy="12" r="2" />
        <circle cx="13" cy="18" r="2" />
      </svg>
    ),
    fallbackGradient: "from-sky-600/30 via-blue-600/20 to-indigo-600/30",
    size: "compact",
    accentColor: "sky",
    order: 6,
  },
  {
    id: "analytics",
    title: "Analytics",
    subtitle: "Content Health",
    description: "Monitor block usage, stale content alerts, and performance metrics",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 16l4-4 4 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="8" r="2" />
      </svg>
    ),
    fallbackGradient: "from-lime-600/30 via-green-600/20 to-emerald-600/30",
    size: "compact",
    accentColor: "lime",
    order: 7,
  },
];

interface HomePageProps {
  onNavigate: (tab: TabType) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  // Get LIVE data from store
  const { nodes, edges, wireframeSections, roadmapItems, suggestions, reviewRequests, favoriteBlockIds, toggleFavorite } = useCanvasStore();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate LIVE stats from actual data
  const liveStats = useMemo(() => {
    const pendingReviews = nodes.filter(n => n.data.status === "PENDING_REVIEW").length;
    const pendingReviewRequests = reviewRequests?.filter(r => r.status === "PENDING" || r.status === "IN_REVIEW").length || 0;
    const totalBlocks = nodes.length;
    const totalConnections = edges.length;
    const uniquePages = new Set(wireframeSections.map(s => s.pageId));
    const totalPages = uniquePages.size;
    const totalSections = wireframeSections.length;
    const pendingRoadmap = roadmapItems.filter(i => i.status === "REVIEW").length;
    const inProgressItems = roadmapItems.filter(i => i.status === "IN_PROGRESS").length;
    const pendingSuggestions = suggestions?.filter(s => s.status === "PENDING").length || 0;
    
    // Calculate content health as percentage of approved/live blocks
    const healthyBlocks = nodes.filter(n => 
      n.data.status === "APPROVED" || n.data.status === "LIVE"
    ).length;
    const contentHealth = totalBlocks > 0 
      ? Math.round((healthyBlocks / totalBlocks) * 100) 
      : 100;
    
    return {
      pendingReviews: pendingReviews + pendingReviewRequests,
      totalBlocks,
      totalConnections,
      totalPages,
      totalSections,
      pendingRoadmap,
      inProgressItems,
      pendingSuggestions,
      contentHealth,
      totalPending: pendingReviews + pendingReviewRequests + pendingRoadmap + pendingSuggestions,
    };
  }, [nodes, edges, wireframeSections, roadmapItems, suggestions, reviewRequests]);

  // Get card stats based on live data
  const getCardStats = (cardId: string) => {
    switch (cardId) {
      case "ceo-dashboard":
        return [
          { label: "Pending Reviews", value: liveStats.pendingReviews },
          { label: "Content Health", value: `${liveStats.contentHealth}%` },
          { label: "In Progress", value: liveStats.inProgressItems },
        ];
      case "schema":
        return [
          { label: "Blocks", value: liveStats.totalBlocks },
          { label: "Connections", value: liveStats.totalConnections },
        ];
      case "wireframe":
        return [
          { label: "Pages", value: liveStats.totalPages },
          { label: "Sections", value: liveStats.totalSections },
        ];
      case "roadmap":
        return [
          { label: "In Progress", value: liveStats.inProgressItems },
          { label: "In Review", value: liveStats.pendingRoadmap },
        ];
      case "analytics":
        return [
          { label: "Health Score", value: `${liveStats.contentHealth}%` },
        ];
      default:
        return [];
    }
  };

  // Favorite blocks
  const favoriteBlocks = useMemo(() => {
    return nodes
      .filter(n => favoriteBlockIds.includes(n.id))
      .map(n => ({
        id: n.id,
        title: n.data.title,
        type: n.data.type,
        status: n.data.status,
        company: n.data.company,
      }));
  }, [nodes, favoriteBlockIds]);

  // Recent activity (last 5 updated blocks)
  const recentActivity = useMemo(() => {
    return [...nodes]
      .sort((a, b) => new Date(b.data.updatedAt).getTime() - new Date(a.data.updatedAt).getTime())
      .slice(0, 6)
      .map(n => ({
        id: n.id,
        title: n.data.title,
        type: n.data.type,
        status: n.data.status,
        updatedAt: n.data.updatedAt,
        company: n.data.company,
      }));
  }, [nodes]);

  if (!mounted) {
    // Skeleton loader while mounting
    return (
      <div className="min-h-screen bg-slate-950 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-slate-800 rounded mb-2" />
            <div className="h-12 w-80 bg-slate-800 rounded mb-8" />
            <div className="grid grid-cols-4 gap-5 auto-rows-[180px]">
              <div className="col-span-2 row-span-2 bg-slate-800 rounded-3xl" />
              <div className="col-span-2 bg-slate-800 rounded-3xl" />
              <div className="col-span-1 bg-slate-800 rounded-3xl" />
              <div className="col-span-1 bg-slate-800 rounded-3xl" />
              <div className="col-span-2 bg-slate-800 rounded-3xl" />
              <div className="col-span-1 bg-slate-800 rounded-3xl" />
              <div className="col-span-1 bg-slate-800 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const greeting = time.getHours() < 12 ? "Good morning" : time.getHours() < 18 ? "Good afternoon" : "Good evening";

  // Grid size classes for better layout
  const gridClasses: Record<BentoCard["size"], string> = {
    hero: "col-span-2 row-span-2",
    featured: "col-span-2 row-span-1",
    standard: "col-span-1 row-span-1",
    compact: "col-span-1 row-span-1",
  };

  return (
    <div className="min-h-screen bg-slate-950 overflow-auto">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: "10s" }} />
        <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "12s" }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">{greeting}</p>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Content <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Visualizer</span>
              </h1>
              <p className="text-slate-500 mt-2">CERE & CEF Content Management System</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-light text-white tabular-nums tracking-tight">
                {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="text-slate-500 text-sm mt-1">
                {time.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
              </div>
            </div>
          </div>
        </header>

        {/* Pending Alert Banner */}
        {liveStats.totalPending > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-amber-200 font-semibold">
                  {liveStats.totalPending} item{liveStats.totalPending !== 1 ? "s" : ""} need{liveStats.totalPending === 1 ? "s" : ""} your attention
                </p>
                <p className="text-amber-200/60 text-sm">
                  {liveStats.pendingReviews > 0 && `${liveStats.pendingReviews} reviews`}
                  {liveStats.pendingReviews > 0 && liveStats.pendingRoadmap > 0 && " · "}
                  {liveStats.pendingRoadmap > 0 && `${liveStats.pendingRoadmap} roadmap`}
                  {(liveStats.pendingReviews > 0 || liveStats.pendingRoadmap > 0) && liveStats.pendingSuggestions > 0 && " · "}
                  {liveStats.pendingSuggestions > 0 && `${liveStats.pendingSuggestions} suggestions`}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("ceo-dashboard")}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/25"
            >
              Review Now →
            </button>
          </div>
        )}

        {/* Bento Grid - Improved Layout */}
        <div className="grid grid-cols-4 gap-4 auto-rows-[170px]">
          {BENTO_CARDS.sort((a, b) => a.order - b.order).map((card) => {
            const isHovered = hoveredCard === card.id;
            const imagePath = `/images/home/${card.id}.jpeg`;
            const stats = getCardStats(card.id);
            const showDescription = card.size === "hero" || card.size === "featured";
            const showStats = stats.length > 0 && (card.size === "hero" || card.size === "featured");

            return (
              <button
                key={card.id}
                onClick={() => card.id !== "home" && onNavigate(card.id as TabType)}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`
                  ${gridClasses[card.size]}
                  relative overflow-hidden rounded-2xl
                  border border-white/10
                  text-left
                  transition-all duration-500 ease-out
                  hover:border-white/25 hover:shadow-2xl hover:shadow-cyan-500/10
                  group cursor-pointer
                  ${isHovered ? "scale-[1.02] z-10" : "scale-100"}
                `}
              >
                {/* Background Image */}
                <div className="absolute inset-0 bg-slate-900">
                  <img 
                    src={imagePath} 
                    alt="" 
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement?.classList.add(...card.fallbackGradient.split(" "));
                      target.parentElement?.classList.add('bg-gradient-to-br');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/30" />
                </div>

                {/* Glow Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col p-5">
                  {/* Icon */}
                  <div className={`
                    w-12 h-12 rounded-xl
                    bg-white/10 backdrop-blur-md
                    flex items-center justify-center
                    text-white/80 group-hover:text-white
                    transition-all duration-300
                    group-hover:scale-110 group-hover:bg-white/20
                    mb-3 border border-white/10
                  `}>
                    {card.icon}
                  </div>

                  {/* Title & Subtitle */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-50 transition-colors truncate">
                      {card.title}
                    </h3>
                    <p className="text-xs text-white/50 font-medium">
                      {card.subtitle}
                    </p>
                    {showDescription && (
                      <p className="text-xs text-white/40 mt-2 line-clamp-2 leading-relaxed">
                        {card.description}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  {showStats && (
                    <div className="flex gap-6 mt-3 pt-3 border-t border-white/10">
                      {stats.map((stat) => (
                        <div key={stat.label}>
                          <div className="text-xl font-bold text-white">{stat.value}</div>
                          <div className="text-[10px] text-white/40 uppercase tracking-wide">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mini stats for compact cards */}
                  {!showStats && stats.length > 0 && (
                    <div className="flex gap-3 mt-2">
                      {stats.slice(0, 2).map((stat) => (
                        <span key={stat.label} className="text-xs text-white/50">
                          {stat.value} {stat.label.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Arrow */}
                  <div className={`
                    absolute bottom-4 right-4
                    w-9 h-9 rounded-full
                    bg-white/10 backdrop-blur-md border border-white/10
                    flex items-center justify-center
                    opacity-0 group-hover:opacity-100
                    translate-x-2 group-hover:translate-x-0
                    transition-all duration-300
                  `}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>

                {/* Animated Border Glow */}
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-pink-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-md" />
              </button>
            );
          })}
        </div>

        {/* Favorites Section */}
        {favoriteBlocks.length > 0 && (
          <div className="mt-6 p-5 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="text-lg">⭐</span> Favorites
              </h3>
              <span className="text-xs text-slate-500">{favoriteBlocks.length} starred</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {favoriteBlocks.map((item) => {
                const config = BLOCK_CONFIGS[item.type];
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      useCanvasStore.getState().focusOnNode(item.id);
                      onNavigate("schema");
                    }}
                    className="relative flex-shrink-0 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-amber-500/30 rounded-xl transition-all group min-w-[160px]"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      className="absolute top-2 right-2 text-amber-400 hover:text-amber-300 transition-colors"
                      title="Remove from favorites"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{config?.icon || "📦"}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        item.company === "CERE" 
                          ? "bg-cyan-500/20 text-cyan-400" 
                          : item.company === "CEF" 
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-slate-600 text-slate-300"
                      }`}>
                        {item.company}
                      </span>
                    </div>
                    <p className="text-sm text-white truncate group-hover:text-amber-100 transition-colors pr-5">
                      {item.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity Feed */}
        {recentActivity.length > 0 && (
          <div className="mt-6 p-5 bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="text-lg">🕐</span> Recent Activity
              </h3>
              <button 
                onClick={() => onNavigate("schema")}
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                View all
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {recentActivity.map((item) => {
                const config = BLOCK_CONFIGS[item.type];
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      useCanvasStore.getState().focusOnNode(item.id);
                      onNavigate("schema");
                    }}
                    className="flex-shrink-0 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all group min-w-[180px]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{config?.icon || "📦"}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        item.company === "CERE" 
                          ? "bg-cyan-500/20 text-cyan-400" 
                          : item.company === "CEF" 
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-slate-600 text-slate-300"
                      }`}>
                        {item.company}
                      </span>
                    </div>
                    <p className="text-sm text-white truncate group-hover:text-cyan-100 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions with Keyboard Hints */}
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <QuickAction
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            label="New Block"
            shortcut="N"
            onClick={() => onNavigate("schema")}
          />
          <QuickAction
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            label="AI Generate"
            shortcut="G"
            onClick={() => onNavigate("content-creation")}
          />
          <QuickAction
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            label="Search"
            shortcut="⌘K"
            onClick={() => {
              // Dispatch keyboard event to open search
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
            }}
          />
          <QuickAction
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            label="Roadmap"
            shortcut="4"
            onClick={() => onNavigate("roadmap")}
          />
          <QuickAction
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Help"
            shortcut="?"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
            }}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
            <span>CERE Network</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>CEF.AI</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>Content Visualizer v2.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  shortcut,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        group flex items-center gap-2.5 px-4 py-2.5
        bg-white/5 border border-white/10 rounded-xl
        text-sm text-slate-400 hover:text-white
        hover:bg-white/10 hover:border-white/20
        transition-all duration-200
        hover:shadow-lg hover:shadow-cyan-500/10
      "
    >
      <span className="text-slate-500 group-hover:text-cyan-400 transition-colors">{icon}</span>
      <span>{label}</span>
      {shortcut && (
        <kbd className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-800/80 text-slate-500 group-hover:text-slate-400 rounded border border-slate-700/50 font-mono opacity-60 group-hover:opacity-100 transition-opacity">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
