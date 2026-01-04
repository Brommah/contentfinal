"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useCanvasStore } from "@/lib/store";
import { BLOCK_CONFIGS, type BlockData, type BlockType, type Company } from "@/lib/types";
import RoadmapLinkModal from "./RoadmapLinkModal";

// ============ TYPES ============

interface ContentTemplate {
  id: string;
  name: string;
  icon: string;
  category: "social" | "blog" | "announcement" | "newsletter" | "internal";
  description: string;
  platform?: string;
  characterLimit?: number;
  promptHint: string;
}

interface GenerationParams {
  tone: "professional" | "casual" | "excited" | "informative" | "urgent";
  length: "short" | "medium" | "long";
  includeEmojis: boolean;
  includeHashtags: boolean;
  includeCTA: boolean;
  customInstructions: string;
}

// ============ TEMPLATES ============

const CONTENT_TEMPLATES: ContentTemplate[] = [
  // Social Media
  {
    id: "twitter-thread",
    name: "X/Twitter Thread",
    icon: "𝕏",
    category: "social",
    platform: "Twitter/X",
    characterLimit: 280,
    description: "Multi-tweet thread for announcements",
    promptHint: "Create an engaging Twitter thread with numbered tweets",
  },
  {
    id: "twitter-single",
    name: "X/Twitter Post",
    icon: "𝕏",
    category: "social",
    platform: "Twitter/X",
    characterLimit: 280,
    description: "Single impactful tweet",
    promptHint: "Create a single compelling tweet",
  },
  {
    id: "linkedin-post",
    name: "LinkedIn Post",
    icon: "in",
    category: "social",
    platform: "LinkedIn",
    characterLimit: 3000,
    description: "Professional update for LinkedIn",
    promptHint: "Create a professional LinkedIn post with line breaks for readability",
  },
  {
    id: "linkedin-article",
    name: "LinkedIn Article",
    icon: "in",
    category: "social",
    platform: "LinkedIn",
    description: "Long-form thought leadership",
    promptHint: "Create a thought leadership article with sections and subheadings",
  },
  {
    id: "discord-announcement",
    name: "Discord Announcement",
    icon: "🎮",
    category: "social",
    platform: "Discord",
    description: "Community announcement for Discord",
    promptHint: "Create a Discord announcement with emojis and clear formatting",
  },
  {
    id: "telegram-post",
    name: "Telegram Post",
    icon: "✈️",
    category: "social",
    platform: "Telegram",
    description: "Channel update for Telegram",
    promptHint: "Create a Telegram post with emojis and links",
  },
  // Blog & Articles
  {
    id: "blog-post",
    name: "Blog Post",
    icon: "📝",
    category: "blog",
    description: "Full blog article with sections",
    promptHint: "Create a comprehensive blog post with introduction, body sections, and conclusion",
  },
  {
    id: "blog-summary",
    name: "Blog Summary",
    icon: "📋",
    category: "blog",
    description: "TL;DR or executive summary",
    promptHint: "Create a concise summary highlighting key points",
  },
  {
    id: "technical-blog",
    name: "Technical Blog",
    icon: "⚙️",
    category: "blog",
    description: "Developer-focused technical content",
    promptHint: "Create a technical blog post with code examples and technical details",
  },
  // Announcements
  {
    id: "product-launch",
    name: "Product Launch",
    icon: "🚀",
    category: "announcement",
    description: "New product or feature announcement",
    promptHint: "Create an exciting product launch announcement",
  },
  {
    id: "partnership",
    name: "Partnership Announcement",
    icon: "🤝",
    category: "announcement",
    description: "Strategic partnership news",
    promptHint: "Create a professional partnership announcement",
  },
  {
    id: "milestone",
    name: "Milestone Celebration",
    icon: "🎉",
    category: "announcement",
    description: "Achievement or milestone update",
    promptHint: "Create a celebratory milestone announcement",
  },
  {
    id: "update-changelog",
    name: "Update / Changelog",
    icon: "📦",
    category: "announcement",
    description: "Product update or changelog",
    promptHint: "Create a structured changelog with version notes",
  },
  // Newsletter
  {
    id: "newsletter-weekly",
    name: "Weekly Newsletter",
    icon: "📰",
    category: "newsletter",
    description: "Weekly digest newsletter",
    promptHint: "Create a weekly newsletter with sections for news, updates, and highlights",
  },
  {
    id: "newsletter-product",
    name: "Product Newsletter",
    icon: "📧",
    category: "newsletter",
    description: "Product-focused email update",
    promptHint: "Create a product newsletter highlighting features and benefits",
  },
  // Internal
  {
    id: "internal-memo",
    name: "Internal Memo",
    icon: "📄",
    category: "internal",
    description: "Internal team communication",
    promptHint: "Create a clear internal memo for team communication",
  },
  {
    id: "press-release",
    name: "Press Release",
    icon: "📰",
    category: "internal",
    description: "Official press release format",
    promptHint: "Create a formal press release with headline, dateline, and body",
  },
];

const TEMPLATE_CATEGORIES = [
  { id: "social", label: "Social Media", icon: "📱" },
  { id: "blog", label: "Blog & Articles", icon: "📝" },
  { id: "announcement", label: "Announcements", icon: "📣" },
  { id: "newsletter", label: "Newsletter", icon: "📧" },
  { id: "internal", label: "Internal", icon: "🏢" },
];

const DEFAULT_PARAMS: GenerationParams = {
  tone: "professional",
  length: "medium",
  includeEmojis: true,
  includeHashtags: false,
  includeCTA: true,
  customInstructions: "",
};

// ============ STEP COMPONENTS ============

function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                index < currentStep
                  ? "bg-emerald-500 text-white"
                  : index === currentStep
                  ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {index < currentStep ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${
              index <= currentStep ? "text-white" : "text-slate-500"
            }`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-12 h-0.5 ${index < currentStep ? "bg-emerald-500" : "bg-slate-800"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Step 1: Template Selection
function TemplateStep({
  selectedTemplate,
  onSelect,
}: {
  selectedTemplate: ContentTemplate | null;
  onSelect: (template: ContentTemplate) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string>("social");

  const filteredTemplates = CONTENT_TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Content Type</h2>
        <p className="text-slate-400">What kind of content do you want to create?</p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <span className="mr-1.5">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {filteredTemplates.map(template => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className={`p-4 rounded-xl text-left transition-all ${
              selectedTemplate?.id === template.id
                ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500 ring-2 ring-cyan-500/30"
                : "bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0">
                {template.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{template.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
                {template.platform && (
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-slate-800 rounded-full text-slate-400">
                    {template.platform}
                  </span>
                )}
              </div>
              {selectedTemplate?.id === template.id && (
                <svg className="w-6 h-6 text-cyan-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 2: Block Selection
function BlockSelectionStep({
  selectedBlockIds,
  onToggleBlock,
  onSelectAll,
  onClear,
  allBlocks,
}: {
  selectedBlockIds: Set<string>;
  onToggleBlock: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  allBlocks: BlockData[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState<Company | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<BlockType | "ALL">("ALL");

  const filteredBlocks = useMemo(() => {
    return allBlocks.filter(block => {
      const matchesSearch = searchQuery === "" || 
        block.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.content?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCompany = companyFilter === "ALL" || block.company === companyFilter;
      const matchesType = typeFilter === "ALL" || block.type === typeFilter;
      
      return matchesSearch && matchesCompany && matchesType;
    });
  }, [allBlocks, searchQuery, companyFilter, typeFilter]);

  const blockTypes = useMemo(() => {
    const types = new Set(allBlocks.map(b => b.type));
    return Array.from(types);
  }, [allBlocks]);

  const selectedBlocks = allBlocks.filter(b => selectedBlockIds.has(b.id));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Select Source Content</h2>
        <p className="text-slate-400">Choose the content blocks to use as context for generation</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Block Browser */}
        <div className="lg:col-span-2 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          {/* Search & Filters */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blocks..."
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value as Company | "ALL")}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300"
              >
                <option value="ALL">All Companies</option>
                <option value="CERE">CERE</option>
                <option value="CEF">CEF</option>
                <option value="SHARED">Shared</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as BlockType | "ALL")}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300"
              >
                <option value="ALL">All Types</option>
                {blockTypes.map(type => (
                  <option key={type} value={type}>{BLOCK_CONFIGS[type].label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onSelectAll}
                className="flex-1 px-3 py-2 text-sm bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Select All ({filteredBlocks.length})
              </button>
              <button
                onClick={onClear}
                className="flex-1 px-3 py-2 text-sm bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Clear ({selectedBlockIds.size})
              </button>
            </div>
          </div>

          {/* Block List */}
          <div className="h-80 overflow-y-auto p-3 space-y-2">
            {filteredBlocks.map(block => {
              const config = BLOCK_CONFIGS[block.type];
              const isSelected = selectedBlockIds.has(block.id);
              
              return (
                <button
                  key={block.id}
                  onClick={() => onToggleBlock(block.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    isSelected
                      ? "bg-cyan-500/20 border border-cyan-500/50"
                      : "bg-slate-800/50 border border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">{block.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          block.company === "CERE" ? "bg-cyan-500/20 text-cyan-400" : 
                          block.company === "CEF" ? "bg-emerald-500/20 text-emerald-400" : 
                          "bg-slate-700 text-slate-400"
                        }`}>
                          {block.company}
                        </span>
                      </div>
                      {block.subtitle && (
                        <p className="text-xs text-slate-500 truncate">{block.subtitle}</p>
                      )}
                    </div>
                    {isSelected && (
                      <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Blocks Preview */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-xs text-cyan-400">
              {selectedBlockIds.size}
            </span>
            Selected Blocks
          </h3>
          
          {selectedBlocks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-sm">No blocks selected</p>
              <p className="text-xs mt-1">Click blocks on the left to add them</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {selectedBlocks.map(block => {
                const config = BLOCK_CONFIGS[block.type];
                return (
                  <div
                    key={block.id}
                    className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg"
                  >
                    <span>{config.icon}</span>
                    <span className="text-sm text-white truncate flex-1">{block.title}</span>
                    <button
                      onClick={() => onToggleBlock(block.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {selectedBlocks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                These blocks will be compiled into context for AI generation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 3: Generation Parameters
function ParametersStep({
  params,
  onUpdateParams,
  template,
}: {
  params: GenerationParams;
  onUpdateParams: (updates: Partial<GenerationParams>) => void;
  template: ContentTemplate | null;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Configure Generation</h2>
        <p className="text-slate-400">Customize how the AI generates your content</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Tone */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
          <label className="block text-sm font-medium text-white mb-3">Tone of Voice</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(["professional", "casual", "excited", "informative", "urgent"] as const).map(tone => (
              <button
                key={tone}
                onClick={() => onUpdateParams({ tone })}
                className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  params.tone === tone
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        {/* Length */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
          <label className="block text-sm font-medium text-white mb-3">Content Length</label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { id: "short", label: "Short", desc: "Brief & punchy" },
              { id: "medium", label: "Medium", desc: "Balanced detail" },
              { id: "long", label: "Long", desc: "Comprehensive" },
            ] as const).map(opt => (
              <button
                key={opt.id}
                onClick={() => onUpdateParams({ length: opt.id })}
                className={`p-3 rounded-lg text-left transition-all ${
                  params.length === opt.id
                    ? "bg-cyan-500/20 border-2 border-cyan-500"
                    : "bg-slate-800 border border-slate-700 hover:border-slate-600"
                }`}
              >
                <p className="font-medium text-white">{opt.label}</p>
                <p className="text-xs text-slate-500">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
          <label className="block text-sm font-medium text-white mb-3">Content Options</label>
          <div className="space-y-3">
            {[
              { key: "includeEmojis", label: "Include Emojis", desc: "Add relevant emojis" },
              { key: "includeHashtags", label: "Include Hashtags", desc: "Add trending hashtags" },
              { key: "includeCTA", label: "Include Call-to-Action", desc: "Add a clear CTA" },
            ].map(opt => (
              <label key={opt.key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                <div>
                  <p className="text-white font-medium">{opt.label}</p>
                  <p className="text-xs text-slate-500">{opt.desc}</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={params[opt.key as keyof GenerationParams] as boolean}
                    onChange={(e) => onUpdateParams({ [opt.key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-500 transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform" />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
          <label className="block text-sm font-medium text-white mb-3">Custom Instructions (Optional)</label>
          <textarea
            value={params.customInstructions}
            onChange={(e) => onUpdateParams({ customInstructions: e.target.value })}
            placeholder="Add any specific instructions for the AI..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Template Info */}
        {template && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{template.icon}</span>
              <div>
                <p className="font-medium text-purple-400">{template.name}</p>
                <p className="text-xs text-purple-300/70">{template.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 4: Output & Edit
function OutputStep({
  content,
  isGenerating,
  isSaving,
  onGenerate,
  onContentChange,
  onSave,
  onConnectToRoadmap,
  onCreateAsBlock,
  template,
  selectedBlocksCount,
}: {
  content: string;
  isGenerating: boolean;
  isSaving: boolean;
  onGenerate: () => void;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onConnectToRoadmap: () => void;
  onCreateAsBlock: () => void;
  template: ContentTemplate | null;
  selectedBlocksCount: number;
}) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Generated Content</h2>
        <p className="text-slate-400">Review, edit, and save your content</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Generate Button */}
        {!content && !isGenerating && (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Generate</h3>
            <p className="text-slate-400 mb-6">
              {template?.name} • {selectedBlocksCount} blocks selected
            </p>
            <button
              onClick={onGenerate}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-purple-400 transition-all shadow-lg shadow-cyan-500/25"
            >
              ⚡ Generate Content
            </button>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
              <svg className="w-8 h-8 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Generating...</h3>
            <p className="text-slate-400">AI is crafting your {template?.name}</p>
          </div>
        )}

        {/* Content Editor */}
        {content && !isGenerating && (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-slate-900/50 rounded-t-xl border border-slate-800 border-b-0 p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{template?.icon}</span>
                <span className="text-sm font-medium text-white">{template?.name}</span>
                {template?.characterLimit && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    content.length > template.characterLimit
                      ? "bg-red-500/20 text-red-400"
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {content.length}/{template.characterLimit}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  {isCopied ? (
                    <>
                      <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={onGenerate}
                  className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </button>
              </div>
            </div>

            {/* Editor */}
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="w-full h-80 px-5 py-4 bg-slate-900 border border-slate-800 border-t-0 rounded-b-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onConnectToRoadmap}
                  className="px-4 py-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Link to Roadmap
                </button>
                <button
                  onClick={onCreateAsBlock}
                  className="px-4 py-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create as Block
                </button>
              </div>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving to Notion...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Content
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============

const STEPS = ["Template", "Content", "Configure", "Output"];

export default function ContentCreationWorkbench() {
  const { nodes, linkBlockToRoadmapItem } = useCanvasStore();
  
  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);
  
  // Step 1: Template
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  
  // Step 2: Blocks
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  
  // Step 3: Parameters
  const [params, setParams] = useState<GenerationParams>(DEFAULT_PARAMS);
  
  // Step 4: Output
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Roadmap link modal
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [createdBlockId, setCreatedBlockId] = useState<string | null>(null);

  // Get all blocks
  const allBlocks = useMemo(() => 
    nodes.map(node => node.data as BlockData),
    [nodes]
  );

  const selectedBlocks = useMemo(() =>
    allBlocks.filter(b => selectedBlockIds.has(b.id)),
    [allBlocks, selectedBlockIds]
  );

  // Navigation
  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedTemplate !== null;
      case 1: return selectedBlockIds.size > 0;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Block selection
  const toggleBlockSelection = useCallback((blockId: string) => {
    setSelectedBlockIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  }, []);

  const selectAllBlocks = useCallback(() => {
    setSelectedBlockIds(new Set(allBlocks.map(b => b.id)));
  }, [allBlocks]);

  const clearSelection = useCallback(() => {
    setSelectedBlockIds(new Set());
  }, []);

  // Generation
  const generateContent = useCallback(async () => {
    if (!selectedTemplate || selectedBlocks.length === 0) return;

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const context = selectedBlocks.map(block => {
        const config = BLOCK_CONFIGS[block.type];
        return `[${config.label}] ${block.title}: ${block.subtitle || ""}\n${block.content || ""}`;
      }).join("\n\n");

      const prompt = `${selectedTemplate.promptHint}

Tone: ${params.tone}
Length: ${params.length}
${params.includeEmojis ? "Include relevant emojis" : "No emojis"}
${params.includeHashtags ? "Include relevant hashtags" : "No hashtags"}
${params.includeCTA ? "Include a clear call-to-action" : "No CTA needed"}
${params.customInstructions ? `Additional instructions: ${params.customInstructions}` : ""}

Source content:
${context}`;

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle structured response from Gemini API
      if (data.structured && data.result) {
        // Combine title, subtitle, and content into formatted output
        const parts: string[] = [];
        if (data.result.title) parts.push(data.result.title);
        if (data.result.subtitle) parts.push(data.result.subtitle);
        if (data.result.content) parts.push(data.result.content);
        setGeneratedContent(parts.join("\n\n") || "Generation failed");
      } else if (data.result) {
        // Legacy plain text response
        setGeneratedContent(typeof data.result === "string" ? data.result : "Generation failed");
      } else {
        setGeneratedContent(data.content || data.text || "Generation failed");
      }
    } catch (error) {
      console.error("Generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setGeneratedContent(`Error generating content: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplate, selectedBlocks, params]);

  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = useCallback(async () => {
    if (!generatedContent || !selectedTemplate) return;
    
    setIsSaving(true);
    try {
      // Extract title from content (first line or template name)
      const lines = generatedContent.split("\n").filter(Boolean);
      const title = lines[0]?.substring(0, 100) || `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`;
      
      const response = await fetch("/api/generated-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: generatedContent,
          template: selectedTemplate.name,
          tone: params.tone.charAt(0).toUpperCase() + params.tone.slice(1),
          length: params.length.charAt(0).toUpperCase() + params.length.slice(1),
          hasEmojis: params.includeEmojis,
          hasHashtags: params.includeHashtags,
          hasCTA: params.includeCTA,
          sourceBlockIds: selectedBlocks.map(b => b.id),
          customInstructions: params.customInstructions || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save content");
      }
      
      const data = await response.json();
      alert(`✅ Content saved to Notion!\n\nYou can view it at: ${data.url}`);
    } catch (error) {
      console.error("Save error:", error);
      alert(`❌ Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  }, [generatedContent, selectedTemplate, params, selectedBlocks]);

  const handleConnectToRoadmap = useCallback(() => {
    if (!selectedTemplate || !generatedContent) return;
    
    // First, create the block if not already created
    if (!createdBlockId) {
      const { addNode } = useCanvasStore.getState();
      
      const blockTypeMap: Record<string, "ARTICLE" | "CORE_VALUE_PROP" | "FEATURE"> = {
        social: "ARTICLE",
        blog: "ARTICLE",
        announcement: "CORE_VALUE_PROP",
        newsletter: "ARTICLE",
        internal: "FEATURE",
      };
      
      const blockType = blockTypeMap[selectedTemplate.category] || "ARTICLE";
      const selectedBlockData = selectedBlocks[0];
      const company = selectedBlockData?.company || "SHARED";
      
      const newNode = addNode({
        type: blockType,
        company,
        title: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
        subtitle: selectedTemplate.description,
        content: generatedContent,
        tags: [selectedTemplate.category, selectedTemplate.id],
        positionX: 400 + Math.random() * 200,
        positionY: 400 + Math.random() * 200,
      });
      
      if (newNode) {
        setCreatedBlockId(newNode.id);
      }
    }
    
    // Open the roadmap link modal
    setShowRoadmapModal(true);
  }, [selectedTemplate, generatedContent, createdBlockId, selectedBlocks]);

  const handleRoadmapLink = useCallback((itemIds: string[]) => {
    if (!createdBlockId || itemIds.length === 0) return;
    
    // Link the block to each selected roadmap item
    itemIds.forEach((itemId) => {
      linkBlockToRoadmapItem(itemId, createdBlockId);
    });
    
    alert(`✅ Linked to ${itemIds.length} roadmap item${itemIds.length !== 1 ? "s" : ""}!\n\nYour content is now connected to the roadmap.`);
  }, [createdBlockId, linkBlockToRoadmapItem]);

  const handleCreateAsBlock = useCallback(() => {
    if (!selectedTemplate || !generatedContent) return;
    
    const { addNode } = useCanvasStore.getState();
    
    // Determine block type based on template category
    const blockTypeMap: Record<string, "ARTICLE" | "CORE_VALUE_PROP" | "FEATURE"> = {
      social: "ARTICLE",
      blog: "ARTICLE",
      announcement: "CORE_VALUE_PROP",
      newsletter: "ARTICLE",
      internal: "FEATURE",
    };
    
    const blockType = blockTypeMap[selectedTemplate.category] || "ARTICLE";
    
    // Determine company based on selected blocks
    const selectedBlockData = selectedBlocks[0];
    const company = selectedBlockData?.company || "SHARED";
    
    // Create the block
    const newNode = addNode({
      type: blockType,
      company,
      title: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
      subtitle: selectedTemplate.description,
      content: generatedContent,
      tags: [selectedTemplate.category, selectedTemplate.id],
      positionX: 400 + Math.random() * 200,
      positionY: 400 + Math.random() * 200,
    });
    
    // If we have selected blocks, create connections to them
    if (selectedBlocks.length > 0 && newNode) {
      const { addEdge } = useCanvasStore.getState();
      const newBlockId = newNode.id;
      selectedBlocks.forEach((block) => {
        addEdge({
          fromBlockId: newBlockId,
          toBlockId: block.id,
          relationshipType: "REFERENCES",
          label: "References",
        });
      });
    }
    
    alert(`✅ Created new ${blockType} block in Architecture!\n\nThe block has been added to the schema and connected to ${selectedBlocks.length} source block(s).`);
  }, [selectedTemplate, generatedContent, selectedBlocks]);

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="px-8 py-4 border-b border-slate-800 bg-slate-900/50">
        <h1 className="text-xl font-bold text-white">Content Studio</h1>
        <p className="text-sm text-slate-400">Create announcements, blogs, social posts & more</p>
      </div>

      {/* Stepper */}
      <div className="px-8 border-b border-slate-800 bg-slate-900/30">
        <StepIndicator currentStep={currentStep} steps={STEPS} />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {currentStep === 0 && (
          <TemplateStep
            selectedTemplate={selectedTemplate}
            onSelect={(t) => setSelectedTemplate(t)}
          />
        )}
        {currentStep === 1 && (
          <BlockSelectionStep
            selectedBlockIds={selectedBlockIds}
            onToggleBlock={toggleBlockSelection}
            onSelectAll={selectAllBlocks}
            onClear={clearSelection}
            allBlocks={allBlocks}
          />
        )}
        {currentStep === 2 && (
          <ParametersStep
            params={params}
            onUpdateParams={(updates) => setParams(prev => ({ ...prev, ...updates }))}
            template={selectedTemplate}
          />
        )}
        {currentStep === 3 && (
          <OutputStep
            content={generatedContent}
            isGenerating={isGenerating}
            isSaving={isSaving}
            onGenerate={generateContent}
            onContentChange={setGeneratedContent}
            onSave={handleSave}
            onConnectToRoadmap={handleConnectToRoadmap}
            onCreateAsBlock={handleCreateAsBlock}
            template={selectedTemplate}
            selectedBlocksCount={selectedBlockIds.size}
          />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="px-8 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
            currentStep === 0
              ? "text-slate-600 cursor-not-allowed"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-4">
          {/* Summary badges */}
          {selectedTemplate && (
            <span className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-sm flex items-center gap-1.5">
              {selectedTemplate.icon} {selectedTemplate.name}
            </span>
          )}
          {selectedBlockIds.size > 0 && (
            <span className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg text-sm">
              {selectedBlockIds.size} blocks
            </span>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={!canProceed() || currentStep === STEPS.length - 1}
          className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
            !canProceed() || currentStep === STEPS.length - 1
              ? "bg-slate-800 text-slate-600 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400 shadow-lg shadow-cyan-500/25"
          }`}
        >
          {currentStep === STEPS.length - 1 ? "Done" : "Next"}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Roadmap Link Modal */}
      <RoadmapLinkModal
        isOpen={showRoadmapModal}
        onClose={() => setShowRoadmapModal(false)}
        blockId={createdBlockId}
        blockTitle={selectedTemplate?.name || "Generated Content"}
        onLink={handleRoadmapLink}
      />
    </div>
  );
}
