"use client";

import React, { useState } from "react";
import EditableText from "../EditableText";

interface CTASectionProps {
  accent: string;
  variant?: string;
}

/**
 * CTASection - Editable call to action banner
 * Supports variants: default (banner), centered, split
 */
export default function CTASection({ accent, variant = "default" }: CTASectionProps) {
  const [headline, setHeadline] = useState("Ready to Get Started?");
  const [subtext, setSubtext] = useState("Join thousands of companies building with our platform");
  const [primaryBtn, setPrimaryBtn] = useState("Start Free Trial");
  const [secondaryBtn, setSecondaryBtn] = useState("Contact Sales");

  // Centered variant
  if (variant === "centered") {
    return (
      <div className={`p-12 bg-gradient-to-b from-${accent}-500/20 to-transparent text-center`}>
        <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-${accent}-500/30 flex items-center justify-center`}>
          <span className="text-3xl">🚀</span>
        </div>
        <EditableText
          value={headline}
          onChange={setHeadline}
          placeholder="CTA Headline"
          className="text-2xl font-bold text-white mb-3 block"
          as="h2"
        />
        <EditableText
          value={subtext}
          onChange={setSubtext}
          placeholder="Supporting text for your CTA"
          className="text-base text-gray-400 mb-6 max-w-lg mx-auto block"
          as="p"
        />
        <button className={`px-8 py-3 rounded-xl bg-${accent}-500 text-white font-semibold hover:bg-${accent}-600 transition-colors`}>
          <EditableText
            value={primaryBtn}
            onChange={setPrimaryBtn}
            placeholder="Button text"
            className="text-white"
            as="span"
          />
        </button>
      </div>
    );
  }

  // Split variant
  if (variant === "split") {
    return (
      <div className={`flex items-center gap-8 p-8 bg-gradient-to-r from-${accent}-500/10 to-transparent`}>
        <div className="flex-1">
          <EditableText
            value={headline}
            onChange={setHeadline}
            placeholder="CTA Headline"
            className="text-xl font-bold text-white mb-2 block"
            as="h2"
          />
          <EditableText
            value={subtext}
            onChange={setSubtext}
            placeholder="Supporting text"
            className="text-sm text-gray-400 block"
            as="p"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className={`px-6 py-2.5 rounded-lg bg-${accent}-500 text-white text-sm font-medium`}>
            <EditableText
              value={primaryBtn}
              onChange={setPrimaryBtn}
              placeholder="Button"
              className="text-white"
              as="span"
            />
          </button>
          <button className="px-6 py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm font-medium">
            <EditableText
              value={secondaryBtn}
              onChange={setSecondaryBtn}
              placeholder="Button"
              className="text-gray-300"
              as="span"
            />
          </button>
        </div>
      </div>
    );
  }

  // Default (banner) variant
  return (
    <div className={`p-8 bg-gradient-to-r from-${accent}-500/20 to-${accent}-600/10 text-center`}>
      <EditableText
        value={headline}
        onChange={setHeadline}
        placeholder="CTA Headline"
        className="text-lg font-bold text-white mb-2 block"
        as="h2"
      />
      <EditableText
        value={subtext}
        onChange={setSubtext}
        placeholder="Supporting text for your CTA"
        className="text-sm text-gray-400 mb-4 max-w-md mx-auto block"
        as="p"
      />
      <div className="flex items-center justify-center gap-3">
        <button className={`px-6 py-2.5 rounded-lg bg-${accent}-500 text-white text-sm font-medium hover:bg-${accent}-600 transition-colors`}>
          <EditableText
            value={primaryBtn}
            onChange={setPrimaryBtn}
            placeholder="Button text"
            className="text-white"
            as="span"
          />
        </button>
        <button className="px-6 py-2.5 rounded-lg border border-gray-600 text-gray-300 text-sm font-medium hover:border-gray-500 transition-colors">
          <EditableText
            value={secondaryBtn}
            onChange={setSecondaryBtn}
            placeholder="Button text"
            className="text-gray-300"
            as="span"
          />
        </button>
      </div>
    </div>
  );
}
