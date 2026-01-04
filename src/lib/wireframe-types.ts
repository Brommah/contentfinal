/**
 * Wireframe Designer Type Definitions
 * Types for landing page wireframe sections linked to content blocks
 */

import type { Company, BlockStatus } from "./types";

// Page structure for nested wireframe pages
export interface WireframePage {
  id: string;
  name: string;
  slug: string;
  company: Company;
  parentId: string | null; // null for root pages
  description: string;
  icon: string;
  order: number;
}

// Default pages for CERE and CEF
export const DEFAULT_PAGES: WireframePage[] = [
  // CERE Pages
  {
    id: "cere-home",
    name: "CERE Home",
    slug: "/",
    company: "CERE",
    parentId: null,
    description: "Protocol Landing Page",
    icon: "🏠",
    order: 0,
  },
  {
    id: "cere-quickstart",
    name: "Quick Start",
    slug: "/quickstart",
    company: "CERE",
    parentId: "cere-home",
    description: "Get started with CERE in minutes",
    icon: "🚀",
    order: 0,
  },
  {
    id: "cere-developers",
    name: "Developers",
    slug: "/developers",
    company: "CERE",
    parentId: "cere-home",
    description: "Developer documentation and resources",
    icon: "👨‍💻",
    order: 1,
  },
  {
    id: "cere-protocol",
    name: "Protocol",
    slug: "/protocol",
    company: "CERE",
    parentId: "cere-home",
    description: "How the CERE Protocol works",
    icon: "⚙️",
    order: 2,
  },
  // CEF Pages
  {
    id: "cef-home",
    name: "CEF.AI Home",
    slug: "/",
    company: "CEF",
    parentId: null,
    description: "Enterprise Landing Page",
    icon: "🏠",
    order: 0,
  },
  {
    id: "cef-robotics",
    name: "Robotics",
    slug: "/verticals/robotics",
    company: "CEF",
    parentId: "cef-home",
    description: "AI for Robotics & Computer Vision",
    icon: "🤖",
    order: 0,
  },
  {
    id: "cef-gaming",
    name: "Gaming",
    slug: "/verticals/gaming",
    company: "CEF",
    parentId: "cef-home",
    description: "AI for Gaming & NPCs",
    icon: "🎮",
    order: 1,
  },
  {
    id: "cef-enterprise",
    name: "Enterprise",
    slug: "/enterprise",
    company: "CEF",
    parentId: "cef-home",
    description: "Enterprise solutions & pricing",
    icon: "🏢",
    order: 2,
  },
];

// Section types for landing page wireframes
export type SectionType =
  | "HERO"
  | "VALUE_PROPS"
  | "PAIN_POINTS"
  | "SOLUTIONS"
  | "FEATURES"
  | "VERTICALS"
  | "CONTENT"
  | "CTA"
  | "FOOTER";

// Configuration options per section type
export interface HeroConfig {
  variant: "centered" | "split" | "full-width";
  showSubtitle: boolean;
  showCTA: boolean;
}

export interface ValuePropsConfig {
  columns: 2 | 3 | 4;
  showIcons: boolean;
  style: "cards" | "minimal" | "bordered";
}

export interface PainPointsConfig {
  layout: "list" | "grid" | "alternating";
  showNumbers: boolean;
}

export interface SolutionsConfig {
  layout: "cards" | "timeline" | "comparison";
  columns: 2 | 3;
}

export interface FeaturesConfig {
  layout: "grid" | "list" | "tabs";
  columns: 2 | 3 | 4;
  showDescriptions: boolean;
}

export interface VerticalsConfig {
  style: "tabs" | "cards" | "carousel";
}

export interface CTAConfig {
  variant: "banner" | "centered" | "split";
  buttonText: string;
  secondaryButton: boolean;
}

export interface FooterConfig {
  columns: 3 | 4;
  showSocial: boolean;
  showNewsletter: boolean;
}

export interface ContentConfig {
  layout: "prose" | "cards" | "steps" | "grid";
  showIcons: boolean;
  columns: 1 | 2 | 3;
}

export type SectionConfig =
  | { type: "HERO"; config: HeroConfig }
  | { type: "VALUE_PROPS"; config: ValuePropsConfig }
  | { type: "PAIN_POINTS"; config: PainPointsConfig }
  | { type: "SOLUTIONS"; config: SolutionsConfig }
  | { type: "FEATURES"; config: FeaturesConfig }
  | { type: "VERTICALS"; config: VerticalsConfig }
  | { type: "CONTENT"; config: ContentConfig }
  | { type: "CTA"; config: CTAConfig }
  | { type: "FOOTER"; config: FooterConfig };

// Default configurations for each section type
export const DEFAULT_SECTION_CONFIGS: Record<SectionType, SectionConfig> = {
  HERO: {
    type: "HERO",
    config: { variant: "centered", showSubtitle: true, showCTA: true },
  },
  VALUE_PROPS: {
    type: "VALUE_PROPS",
    config: { columns: 3, showIcons: true, style: "cards" },
  },
  PAIN_POINTS: {
    type: "PAIN_POINTS",
    config: { layout: "grid", showNumbers: true },
  },
  SOLUTIONS: {
    type: "SOLUTIONS",
    config: { layout: "cards", columns: 3 },
  },
  FEATURES: {
    type: "FEATURES",
    config: { layout: "grid", columns: 3, showDescriptions: true },
  },
  VERTICALS: {
    type: "VERTICALS",
    config: { style: "tabs" },
  },
  CONTENT: {
    type: "CONTENT",
    config: { layout: "prose", showIcons: true, columns: 1 },
  },
  CTA: {
    type: "CTA",
    config: { variant: "banner", buttonText: "Get Started", secondaryButton: true },
  },
  FOOTER: {
    type: "FOOTER",
    config: { columns: 4, showSocial: true, showNewsletter: true },
  },
};

// Column layout configuration
export type ColumnLayout = 1 | 2;

// Wireframe section with linked content blocks
export interface WireframeSection {
  id: string;
  type: SectionType;
  company: Company;
  pageId: string; // Which page this section belongs to
  linkedBlockIds: string[]; // References to content blocks
  order: number;
  config: SectionConfig;
  variant?: string; // Layout variant (default, centered, split, etc.)
  isCollapsed?: boolean;
  status: BlockStatus; // Status for review workflow (synced with CEO dashboard)
  columns?: ColumnLayout; // Number of columns (1 or 2, default 1)
  columnSplit?: "50-50" | "60-40" | "40-60" | "70-30" | "30-70"; // Column width ratio
}

// Section metadata for the palette
export interface SectionMeta {
  type: SectionType;
  label: string;
  icon: string;
  description: string;
  linkedBlockType: string | null; // Which block type this section pulls from
  color: string;
}

// Section definitions for the palette
export const SECTION_METAS: SectionMeta[] = [
  {
    type: "HERO",
    label: "Hero Section",
    icon: "🏠",
    description: "Main headline with tagline and CTA",
    linkedBlockType: "COMPANY,CORE_VALUE_PROP",
    color: "#3b82f6",
  },
  {
    type: "VALUE_PROPS",
    label: "Value Props",
    icon: "💎",
    description: "Key value propositions in columns",
    linkedBlockType: "CORE_VALUE_PROP",
    color: "#f59e0b",
  },
  {
    type: "PAIN_POINTS",
    label: "Pain Points",
    icon: "🔥",
    description: "Problems your audience faces",
    linkedBlockType: "PAIN_POINT",
    color: "#ef4444",
  },
  {
    type: "SOLUTIONS",
    label: "Solutions",
    icon: "✨",
    description: "How you solve the problems",
    linkedBlockType: "SOLUTION",
    color: "#22c55e",
  },
  {
    type: "FEATURES",
    label: "Features",
    icon: "⚡",
    description: "Product features and capabilities",
    linkedBlockType: "FEATURE",
    color: "#a855f7",
  },
  {
    type: "VERTICALS",
    label: "Verticals",
    icon: "🎯",
    description: "Industry or use-case sections",
    linkedBlockType: "VERTICAL",
    color: "#ec4899",
  },
  {
    type: "CONTENT",
    label: "Content",
    icon: "📝",
    description: "General page content blocks",
    linkedBlockType: "ARTICLE,FEATURE",
    color: "#6366f1",
  },
  {
    type: "CTA",
    label: "Call to Action",
    icon: "🚀",
    description: "Conversion-focused banner",
    linkedBlockType: null,
    color: "#06b6d4",
  },
  {
    type: "FOOTER",
    label: "Footer",
    icon: "📋",
    description: "Standard page footer",
    linkedBlockType: null,
    color: "#64748b",
  },
];

// Helper to get section meta by type
export function getSectionMeta(type: SectionType): SectionMeta {
  return SECTION_METAS.find((m) => m.type === type) || SECTION_METAS[0];
}

// Default wireframe templates for a page
export function getDefaultWireframe(pageId: string, company: Company): WireframeSection[] {
  return [
    {
      id: `${pageId}-hero`,
      type: "HERO",
      company,
      pageId,
      linkedBlockIds: [],
      order: 0,
      config: DEFAULT_SECTION_CONFIGS.HERO,
      status: "DRAFT",
    },
    {
      id: `${pageId}-value-props`,
      type: "VALUE_PROPS",
      company,
      pageId,
      linkedBlockIds: [],
      order: 1,
      config: DEFAULT_SECTION_CONFIGS.VALUE_PROPS,
      status: "DRAFT",
    },
    {
      id: `${pageId}-pain-points`,
      type: "PAIN_POINTS",
      company,
      pageId,
      linkedBlockIds: [],
      order: 2,
      config: DEFAULT_SECTION_CONFIGS.PAIN_POINTS,
      status: "DRAFT",
    },
    {
      id: `${pageId}-solutions`,
      type: "SOLUTIONS",
      company,
      pageId,
      linkedBlockIds: [],
      order: 3,
      config: DEFAULT_SECTION_CONFIGS.SOLUTIONS,
      status: "DRAFT",
    },
    {
      id: `${pageId}-features`,
      type: "FEATURES",
      company,
      pageId,
      linkedBlockIds: [],
      order: 4,
      config: DEFAULT_SECTION_CONFIGS.FEATURES,
      status: "DRAFT",
    },
    {
      id: `${pageId}-cta`,
      type: "CTA",
      company,
      pageId,
      linkedBlockIds: [],
      order: 5,
      config: DEFAULT_SECTION_CONFIGS.CTA,
      status: "DRAFT",
    },
    {
      id: `${pageId}-footer`,
      type: "FOOTER",
      company,
      pageId,
      linkedBlockIds: [],
      order: 6,
      config: DEFAULT_SECTION_CONFIGS.FOOTER,
      status: "DRAFT",
    },
  ];
}

// Get all pages for a company
export function getCompanyPages(company: Company): WireframePage[] {
  return DEFAULT_PAGES.filter((p) => p.company === company);
}

// Get child pages for a parent
export function getChildPages(parentId: string): WireframePage[] {
  return DEFAULT_PAGES.filter((p) => p.parentId === parentId).sort((a, b) => a.order - b.order);
}

// Get page by ID
export function getPageById(pageId: string): WireframePage | undefined {
  return DEFAULT_PAGES.find((p) => p.id === pageId);
}

// Get root pages for a company
export function getRootPages(company: Company): WireframePage[] {
  return DEFAULT_PAGES.filter((p) => p.company === company && p.parentId === null);
}

// Check if a page is a deeper page (has a parent)
export function isDeeperPage(pageId: string): boolean {
  const page = getPageById(pageId);
  return page !== undefined && page.parentId !== null;
}

// Get the page root block ID for a deeper page
export function getPageRootBlockId(pageId: string): string {
  return `page-root-${pageId}`;
}

// Simplified wireframe for deeper pages (Hero, Content, CTA only)
export function getSimplifiedWireframe(pageId: string, company: Company): WireframeSection[] {
  return [
    {
      id: `${pageId}-hero`,
      type: "HERO",
      company,
      pageId,
      linkedBlockIds: [],
      order: 0,
      config: DEFAULT_SECTION_CONFIGS.HERO,
      status: "DRAFT",
    },
    {
      id: `${pageId}-content-1`,
      type: "CONTENT",
      company,
      pageId,
      linkedBlockIds: [],
      order: 1,
      config: DEFAULT_SECTION_CONFIGS.CONTENT,
      status: "DRAFT",
    },
    {
      id: `${pageId}-content-2`,
      type: "CONTENT",
      company,
      pageId,
      linkedBlockIds: [],
      order: 2,
      config: { type: "CONTENT", config: { layout: "cards", showIcons: true, columns: 3 } },
      status: "DRAFT",
    },
    {
      id: `${pageId}-cta`,
      type: "CTA",
      company,
      pageId,
      linkedBlockIds: [],
      order: 3,
      config: DEFAULT_SECTION_CONFIGS.CTA,
      status: "DRAFT",
    },
  ];
}

// Get appropriate wireframe based on page depth
export function getWireframeForPage(pageId: string, company: Company): WireframeSection[] {
  if (isDeeperPage(pageId)) {
    return getSimplifiedWireframe(pageId, company);
  }
  return getDefaultWireframe(pageId, company);
}
