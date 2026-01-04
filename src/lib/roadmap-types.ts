/**
 * Content Roadmap Type Definitions
 * Types for timeline-based content planning and compounding strategy
 */

import type { Company, BlockType } from "./types";

// Roadmap phases for organizing content releases
export type PhaseType = "FOUNDATION" | "GROWTH" | "SCALE" | "OPTIMIZE";

// Content item status in the roadmap
export type RoadmapStatus = "PLANNED" | "IN_PROGRESS" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

// Team member definition
export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  color: string;
}

// Milestone definition
export interface Milestone {
  id: string;
  title: string;
  date: Date;
  icon: string;
  color: string;
}

// Default team members for demo
export const DEFAULT_TEAM: TeamMember[] = [
  { id: "tm-1", name: "Alex Chen", avatar: "AC", role: "Content Lead", color: "#3b82f6" },
  { id: "tm-2", name: "Jordan Lee", avatar: "JL", role: "Technical Writer", color: "#22c55e" },
  { id: "tm-3", name: "Sam Rivera", avatar: "SR", role: "Designer", color: "#f59e0b" },
  { id: "tm-4", name: "Chris Kim", avatar: "CK", role: "Marketing", color: "#a855f7" },
];

// Phase configuration
export interface RoadmapPhase {
  id: string;
  type: PhaseType;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  color: string;
  order: number;
}

// Content item in the roadmap
export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  company: Company;
  contentType: BlockType;
  phaseId: string;
  status: RoadmapStatus;
  linkedBlockIds: string[]; // Links to content schema blocks
  dependsOn: string[]; // IDs of items this depends on
  targetDate: Date;
  endDate?: Date; // For Gantt view duration
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  assigneeId?: string; // Team member ID
  tags: string[];
  milestoneId?: string; // Associated milestone
  googleDocsUrl?: string; // Link to Google Docs for collaboration
  notionPageUrl?: string; // Link to Notion page
  figmaUrl?: string; // Link to Figma design
}

// Phase metadata
export const PHASE_CONFIGS: Record<PhaseType, { label: string; icon: string; color: string; description: string }> = {
  FOUNDATION: {
    label: "Foundation",
    icon: "🏗️",
    color: "#3b82f6",
    description: "Core messaging, brand identity, key value props",
  },
  GROWTH: {
    label: "Growth",
    icon: "🌱",
    color: "#22c55e",
    description: "Expand content, build authority, SEO optimization",
  },
  SCALE: {
    label: "Scale",
    icon: "🚀",
    color: "#f59e0b",
    description: "Multi-channel distribution, vertical expansion",
  },
  OPTIMIZE: {
    label: "Optimize",
    icon: "⚡",
    color: "#a855f7",
    description: "A/B testing, conversion optimization, refinement",
  },
};

// Status metadata
export const STATUS_CONFIGS: Record<RoadmapStatus, { label: string; color: string; icon: string }> = {
  PLANNED: { label: "Planned", color: "#64748b", icon: "📋" },
  IN_PROGRESS: { label: "In Progress", color: "#3b82f6", icon: "🔄" },
  REVIEW: { label: "In Review", color: "#f59e0b", icon: "👀" },
  PUBLISHED: { label: "Published", color: "#22c55e", icon: "✅" },
  ARCHIVED: { label: "Archived", color: "#6b7280", icon: "📦" },
};

// Priority metadata
export const PRIORITY_CONFIGS = {
  LOW: { label: "Low", color: "#64748b" },
  MEDIUM: { label: "Medium", color: "#3b82f6" },
  HIGH: { label: "High", color: "#f59e0b" },
  CRITICAL: { label: "Critical", color: "#ef4444" },
};

// Default phases for new roadmaps
export function getDefaultPhases(): RoadmapPhase[] {
  const now = new Date();
  const monthFromNow = (months: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  return [
    {
      id: "phase-foundation",
      type: "FOUNDATION",
      name: "Foundation",
      description: "Establish core messaging and brand identity",
      startDate: now,
      endDate: monthFromNow(2),
      color: PHASE_CONFIGS.FOUNDATION.color,
      order: 0,
    },
    {
      id: "phase-growth",
      type: "GROWTH",
      name: "Growth",
      description: "Expand content library and build authority",
      startDate: monthFromNow(2),
      endDate: monthFromNow(5),
      color: PHASE_CONFIGS.GROWTH.color,
      order: 1,
    },
    {
      id: "phase-scale",
      type: "SCALE",
      name: "Scale",
      description: "Multi-channel distribution and vertical expansion",
      startDate: monthFromNow(5),
      endDate: monthFromNow(9),
      color: PHASE_CONFIGS.SCALE.color,
      order: 2,
    },
    {
      id: "phase-optimize",
      type: "OPTIMIZE",
      name: "Optimize",
      description: "Continuous improvement and conversion optimization",
      startDate: monthFromNow(9),
      endDate: monthFromNow(12),
      color: PHASE_CONFIGS.OPTIMIZE.color,
      order: 3,
    },
  ];
}

// Sample roadmap items for demo
export function getSampleRoadmapItems(): RoadmapItem[] {
  const now = new Date();
  const daysFromNow = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  return [
    // CERE Foundation items
    {
      id: "ri-cere-messaging",
      title: "Core Messaging Framework",
      description: "Define primary taglines, value props, and positioning",
      company: "CERE",
      contentType: "CORE_VALUE_PROP",
      phaseId: "phase-foundation",
      status: "PUBLISHED",
      linkedBlockIds: [],
      dependsOn: [],
      targetDate: daysFromNow(-10),
      priority: "CRITICAL",
      tags: ["messaging", "brand"],
    },
    {
      id: "ri-cere-website",
      title: "Website Content Overhaul",
      description: "Rewrite all website copy with new messaging",
      company: "CERE",
      contentType: "ARTICLE",
      phaseId: "phase-foundation",
      status: "IN_PROGRESS",
      linkedBlockIds: [],
      dependsOn: ["ri-cere-messaging"],
      targetDate: daysFromNow(14),
      priority: "HIGH",
      tags: ["website", "copy"],
    },
    {
      id: "ri-cere-technical",
      title: "Technical Documentation",
      description: "Developer docs, API guides, integration tutorials",
      company: "CERE",
      contentType: "TECH_COMPONENT",
      phaseId: "phase-foundation",
      status: "PLANNED",
      linkedBlockIds: [],
      dependsOn: ["ri-cere-messaging"],
      targetDate: daysFromNow(30),
      priority: "HIGH",
      tags: ["docs", "technical"],
    },
    // CEF Foundation items
    {
      id: "ri-cef-messaging",
      title: "Enterprise Positioning",
      description: "B2B messaging, enterprise value props, ROI stories",
      company: "CEF",
      contentType: "CORE_VALUE_PROP",
      phaseId: "phase-foundation",
      status: "PUBLISHED",
      linkedBlockIds: [],
      dependsOn: [],
      targetDate: daysFromNow(-5),
      priority: "CRITICAL",
      tags: ["enterprise", "b2b"],
    },
    {
      id: "ri-cef-casestudies",
      title: "Case Studies",
      description: "Gaming, robotics, and enterprise AI case studies",
      company: "CEF",
      contentType: "VERTICAL",
      phaseId: "phase-foundation",
      status: "IN_PROGRESS",
      linkedBlockIds: [],
      dependsOn: ["ri-cef-messaging"],
      targetDate: daysFromNow(21),
      priority: "HIGH",
      tags: ["case-study", "social-proof"],
    },
    // Growth phase items
    {
      id: "ri-cere-blog",
      title: "Thought Leadership Blog",
      description: "Weekly blog posts on decentralized AI infrastructure",
      company: "CERE",
      contentType: "ARTICLE",
      phaseId: "phase-growth",
      status: "PLANNED",
      linkedBlockIds: [],
      dependsOn: ["ri-cere-website"],
      targetDate: daysFromNow(60),
      priority: "MEDIUM",
      tags: ["blog", "seo"],
    },
    {
      id: "ri-cef-whitepaper",
      title: "Enterprise AI Whitepaper",
      description: "In-depth whitepaper on multi-agent orchestration",
      company: "CEF",
      contentType: "ARTICLE",
      phaseId: "phase-growth",
      status: "PLANNED",
      linkedBlockIds: [],
      dependsOn: ["ri-cef-casestudies"],
      targetDate: daysFromNow(75),
      priority: "HIGH",
      tags: ["whitepaper", "lead-gen"],
    },
    // Scale phase items
    {
      id: "ri-cere-verticals",
      title: "Vertical Landing Pages",
      description: "Industry-specific pages for gaming, robotics, IoT",
      company: "CERE",
      contentType: "VERTICAL",
      phaseId: "phase-scale",
      status: "PLANNED",
      linkedBlockIds: [],
      dependsOn: ["ri-cere-blog"],
      targetDate: daysFromNow(150),
      priority: "MEDIUM",
      tags: ["verticals", "landing-pages"],
    },
    {
      id: "ri-cef-webinars",
      title: "Enterprise Webinar Series",
      description: "Monthly webinars on AI implementation",
      company: "CEF",
      contentType: "ARTICLE",
      phaseId: "phase-scale",
      status: "PLANNED",
      linkedBlockIds: [],
      dependsOn: ["ri-cef-whitepaper"],
      targetDate: daysFromNow(180),
      priority: "MEDIUM",
      tags: ["webinar", "lead-gen"],
    },
  ];
}

