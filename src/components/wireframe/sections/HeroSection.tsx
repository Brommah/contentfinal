"use client";

import React from "react";
import type { BlockData, Company } from "@/lib/types";
import { useCanvasStore } from "@/lib/store";
import EditableText from "../EditableText";

interface HeroSectionProps {
  blocks: BlockData[];
  company: Company;
  accent: string;
  variant?: string;
}

/**
 * HeroSection - Main hero section with editable headline and CTA
 * Supports variants: default, centered, split, full-width
 */
export default function HeroSection({ blocks, company, accent, variant = "default" }: HeroSectionProps) {
  const { updateNode } = useCanvasStore();

  // Find company block for main title
  const companyBlock = blocks.find((b) => b.type === "COMPANY");
  // Find value props for subtitle
  const valueProps = blocks.filter((b) => b.type === "CORE_VALUE_PROP");
  const primaryVP = valueProps[0];

  const mainTitle = companyBlock?.title || (company === "CERE" ? "CERE Network" : "CEF.AI");
  const subtitle = companyBlock?.subtitle || primaryVP?.title || "Your headline here";
  const description = companyBlock?.content || primaryVP?.subtitle || "Supporting description text";

  const handleTitleChange = (value: string) => {
    if (companyBlock) {
      updateNode(companyBlock.id, { title: value });
    }
  };

  const handleSubtitleChange = (value: string) => {
    if (companyBlock) {
      updateNode(companyBlock.id, { subtitle: value });
    } else if (primaryVP) {
      updateNode(primaryVP.id, { title: value });
    }
  };

  const handleDescriptionChange = (value: string) => {
    if (companyBlock) {
      updateNode(companyBlock.id, { content: value });
    } else if (primaryVP) {
      updateNode(primaryVP.id, { subtitle: value });
    }
  };

  // Render based on variant
  if (variant === "split") {
    return (
      <div className="flex items-center gap-8 p-8">
        {/* Left side - Content */}
        <div className="flex-1">
          <EditableText
            value={mainTitle}
            onChange={handleTitleChange}
            placeholder="Company Name"
            className="text-3xl font-bold text-white mb-3 block"
            as="h1"
          />
          <EditableText
            value={subtitle}
            onChange={handleSubtitleChange}
            placeholder="Your tagline here"
            className={`text-xl text-${accent}-400 font-medium mb-3 block`}
            as="p"
          />
          <EditableText
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Supporting description text"
            className="text-sm text-gray-400 mb-6 block"
            as="p"
            multiline
          />
          <div className="flex items-center gap-3">
            <button className={`px-5 py-2.5 rounded-lg bg-${accent}-500 text-white text-sm font-medium`}>
              Get Started
            </button>
            <button className="px-5 py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm font-medium">
              Learn More
            </button>
          </div>
        </div>
        {/* Right side - Image placeholder */}
        <div className="flex-1">
          <div className="aspect-video rounded-xl bg-gray-700/50 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Hero Image / Video</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "full-width") {
    return (
      <div className="relative">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br from-${accent}-900/20 via-gray-900 to-gray-900`} />
        <div className="relative p-12 text-center">
          <EditableText
            value={mainTitle}
            onChange={handleTitleChange}
            placeholder="Company Name"
            className="text-4xl font-bold text-white mb-4 block"
            as="h1"
          />
          <EditableText
            value={subtitle}
            onChange={handleSubtitleChange}
            placeholder="Your tagline here"
            className={`text-2xl text-${accent}-400 font-medium mb-4 block max-w-2xl mx-auto`}
            as="p"
          />
          <EditableText
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Supporting description text"
            className="text-base text-gray-400 max-w-xl mx-auto mb-8 block"
            as="p"
            multiline
          />
          <div className="flex items-center justify-center gap-4">
            <button className={`px-8 py-3 rounded-lg bg-${accent}-500 text-white font-semibold text-base`}>
              Get Started Free
            </button>
            <button className="px-8 py-3 rounded-lg border-2 border-gray-600 text-gray-300 font-semibold text-base">
              Watch Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default / Centered variant
  return (
    <div className="p-8 text-center">
      {/* Logo placeholder */}
      <div className={`w-12 h-12 mx-auto mb-6 rounded-xl bg-${accent}-500/20 flex items-center justify-center`}>
        <span className={`text-2xl font-bold text-${accent}-400`}>
          {company === "CERE" ? "C" : "F"}
        </span>
      </div>

      {/* Main headline - Editable */}
      <EditableText
        value={mainTitle}
        onChange={handleTitleChange}
        placeholder="Company Name"
        className="text-2xl font-bold text-white mb-3 block"
        as="h1"
      />

      {/* Subtitle / Value Prop - Editable */}
      <EditableText
        value={subtitle}
        onChange={handleSubtitleChange}
        placeholder="Your tagline here"
        className={`text-lg text-${accent}-400 font-medium mb-2 block`}
        as="p"
      />

      {/* Description - Editable */}
      <EditableText
        value={description}
        onChange={handleDescriptionChange}
        placeholder="Supporting description text for your hero section"
        className="text-sm text-gray-400 max-w-md mx-auto mb-6 block"
        as="p"
        multiline
      />

      {/* CTA Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button className={`px-5 py-2 rounded-lg bg-${accent}-500 text-white text-sm font-medium hover:bg-${accent}-600 transition-colors`}>
          Get Started
        </button>
        <button className="px-5 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm font-medium hover:border-gray-500 transition-colors">
          Learn More
        </button>
      </div>

      {/* Trust badges placeholder */}
      <div className="mt-8 flex items-center justify-center gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-6 w-16 bg-gray-700/30 rounded" />
        ))}
      </div>
    </div>
  );
}
