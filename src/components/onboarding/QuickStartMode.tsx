"use client";

import React from "react";

interface QuickStartModeProps {
  isActive: boolean;
  onToggle: () => void;
  onAction: (action: string) => void;
}

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  description: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "add-value-prop",
    icon: "💎",
    label: "Add Value Prop",
    description: "Define a core value proposition",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "add-pain-point",
    icon: "🔥",
    label: "Add Pain Point",
    description: "Document a customer problem",
    color: "from-red-500 to-pink-500",
  },
  {
    id: "add-solution",
    icon: "✅",
    label: "Add Solution",
    description: "Create a solution for pain points",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "add-feature",
    icon: "⚡",
    label: "Add Feature",
    description: "Document a product feature",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "submit-review",
    icon: "📤",
    label: "Submit for Review",
    description: "Send content to CEO for approval",
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "view-dashboard",
    icon: "📊",
    label: "View Dashboard",
    description: "See content health and status",
    color: "from-blue-500 to-cyan-500",
  },
];

/**
 * QuickStartMode - Simplified interface for quick actions
 */
export default function QuickStartMode({ isActive, onToggle, onAction }: QuickStartModeProps) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-950/95 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-3xl px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            What would you like to do?
          </h1>
          <p className="text-slate-400 text-lg">
            Quick actions to get things done faster
          </p>
        </div>

        {/* Quick actions grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              className="group relative p-6 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
              
              <div className="relative">
                <span className="text-3xl mb-3 block">{action.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {action.label}
                </h3>
                <p className="text-sm text-slate-400">
                  {action.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Exit button */}
        <div className="text-center">
          <button
            onClick={onToggle}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Switch to Full Mode
          </button>
          <p className="text-slate-500 text-sm mt-3">
            Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400 text-xs">⌘ /</kbd> to toggle quick start mode
          </p>
        </div>
      </div>
    </div>
  );
}

export { QUICK_ACTIONS };


