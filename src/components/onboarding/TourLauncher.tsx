"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTour, type TourDefinition } from "./TourProvider";
import type { TabType } from "@/components/dashboard/TabNavigation";

const TAB_LABELS: Record<TabType, string> = {
  home: "Home",
  "ceo-dashboard": "CEO View",
  schema: "Architecture",
  editor: "Building Blocks",
  wireframe: "Website Builder",
  roadmap: "Roadmap",
  analytics: "Analytics",
  "content-creation": "Content Creation",
};

/**
 * TourLauncher - Widget for accessing and restarting tours
 * Shows available tours for the current tab and allows launching them
 */
export default function TourLauncher() {
  const {
    activeTab,
    registeredTours,
    startTour,
    isTourComplete,
    resetTour,
    resetAllTours,
    currentTour,
    showTabSuggestion,
    suggestedTab,
    dismissTabSuggestion,
  } = useTour();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get tours relevant to current tab
  const relevantTours = useMemo(() => {
    return registeredTours.filter(
      (tour) => !tour.tabRestriction || tour.tabRestriction === activeTab
    );
  }, [registeredTours, activeTab]);

  // Get the current tab's specific tour
  const tabTour = useMemo(() => {
    return registeredTours.find((t) => t.tabRestriction === activeTab);
  }, [registeredTours, activeTab]);

  // Check if there are any incomplete tours
  const hasIncompleteTours = relevantTours.some((t) => !isTourComplete(t.id));

  // Handle starting a tour
  const handleStartTour = (tourId: string) => {
    setIsOpen(false);
    startTour(tourId);
  };

  // Handle restart tour
  const handleRestartTour = (tourId: string) => {
    resetTour(tourId);
    setIsOpen(false);
    startTour(tourId);
  };

  // Don't render if in a tour
  if (currentTour) return null;

  return (
    <>
      {/* Tab Suggestion Toast */}
      {mounted && showTabSuggestion && suggestedTab && (
        <TabSuggestionToast
          tabName={TAB_LABELS[suggestedTab]}
          tourName={tabTour?.name || ""}
          onStartTour={() => {
            dismissTabSuggestion();
            if (tabTour) startTour(tabTour.id);
          }}
          onDismiss={dismissTabSuggestion}
        />
      )}

      {/* Tour Launcher Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          data-tour="help-button"
          className={`
            relative p-2 rounded-lg transition-all
            ${isOpen
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-700"
            }
          `}
          title="Tour & Help"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          {/* Indicator dot for incomplete tours */}
          {hasIncompleteTours && !isOpen && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && mounted && (
          <TourMenu
            tours={relevantTours}
            activeTab={activeTab}
            isTourComplete={isTourComplete}
            onStartTour={handleStartTour}
            onRestartTour={handleRestartTour}
            onResetAll={() => {
              resetAllTours();
              setIsOpen(false);
            }}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
    </>
  );
}

/**
 * Tour Menu Dropdown
 */
interface TourMenuProps {
  tours: TourDefinition[];
  activeTab: TabType;
  isTourComplete: (id: string) => boolean;
  onStartTour: (id: string) => void;
  onRestartTour: (id: string) => void;
  onResetAll: () => void;
  onClose: () => void;
}

function TourMenu({
  tours,
  activeTab,
  isTourComplete,
  onStartTour,
  onRestartTour,
  onResetAll,
  onClose,
}: TourMenuProps) {
  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-tour-menu]") && !target.closest("[data-tour='help-button']")) {
        onClose();
      }
    };
    setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);

  // Separate tours into tab-specific and general
  const tabSpecificTours = tours.filter((t) => t.tabRestriction === activeTab);
  const generalTours = tours.filter((t) => !t.tabRestriction);

  return createPortal(
    <div
      data-tour-menu
      className="fixed top-16 right-4 z-[9990] w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600">
        <h3 className="text-sm font-semibold text-white">Tours & Help</h3>
        <p className="text-xs text-white/70 mt-0.5">
          Learn how to use {TAB_LABELS[activeTab]}
        </p>
      </div>

      {/* Tours List */}
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {/* Tab-specific tours */}
        {tabSpecificTours.length > 0 && (
          <div className="mb-2">
            <p className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              This Tab
            </p>
            {tabSpecificTours.map((tour) => (
              <TourMenuItem
                key={tour.id}
                tour={tour}
                isComplete={isTourComplete(tour.id)}
                onStart={() => onStartTour(tour.id)}
                onRestart={() => onRestartTour(tour.id)}
              />
            ))}
          </div>
        )}

        {/* General tours */}
        {generalTours.length > 0 && (
          <div>
            <p className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              General
            </p>
            {generalTours.map((tour) => (
              <TourMenuItem
                key={tour.id}
                tour={tour}
                isComplete={isTourComplete(tour.id)}
                onStart={() => onStartTour(tour.id)}
                onRestart={() => onRestartTour(tour.id)}
              />
            ))}
          </div>
        )}

        {tours.length === 0 && (
          <p className="px-2 py-4 text-sm text-slate-500 text-center">
            No tours available yet
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700/50 flex items-center justify-between">
        <button
          onClick={onResetAll}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Reset all tours
        </button>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px]">?</kbd>
          <span>Shortcuts</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Individual Tour Menu Item
 */
interface TourMenuItemProps {
  tour: TourDefinition;
  isComplete: boolean;
  onStart: () => void;
  onRestart: () => void;
}

function TourMenuItem({ tour, isComplete, onStart, onRestart }: TourMenuItemProps) {
  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
        ${isComplete
          ? "hover:bg-slate-800/50"
          : "bg-blue-500/10 hover:bg-blue-500/20"
        }
      `}
    >
      {/* Icon */}
      <span className="text-xl flex-shrink-0">{tour.icon}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{tour.name}</span>
          {isComplete && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
              Done
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">{tour.description}</p>
      </div>

      {/* Action */}
      {isComplete ? (
        <button
          onClick={onRestart}
          className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
        >
          Replay
        </button>
      ) : (
        <button
          onClick={onStart}
          className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        >
          Start
        </button>
      )}
    </div>
  );
}

/**
 * Tab Suggestion Toast - Shows when visiting a new tab for the first time
 */
interface TabSuggestionToastProps {
  tabName: string;
  tourName: string;
  onStartTour: () => void;
  onDismiss: () => void;
}

function TabSuggestionToast({
  tabName,
  tourName,
  onStartTour,
  onDismiss,
}: TabSuggestionToastProps) {
  useEffect(() => {
    // Auto-dismiss after 10 seconds
    const timer = setTimeout(onDismiss, 10000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9980] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl px-5 py-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg">
          🎓
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="text-sm font-medium text-white">
            New to {tabName}?
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Take a quick tour to learn the basics
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Maybe later
          </button>
          <button
            onClick={onStartTour}
            className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Start Tour
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}

