"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTour, type TourStep } from "./TourProvider";

interface OnboardingTourProps {
  /** Optional override steps (for standalone use without TourProvider) */
  steps?: TourStep[];
  /** Manual active state (for standalone use) */
  isActive?: boolean;
  /** Callback when tour completes */
  onComplete?: () => void;
  /** Callback when tour is skipped */
  onSkip?: () => void;
}

/**
 * OnboardingTour - Interactive guided tour for new users
 * Supports both TourProvider context and standalone mode
 */
export default function OnboardingTour({
  steps: overrideSteps,
  isActive: overrideIsActive,
  onComplete: overrideOnComplete,
  onSkip: overrideOnSkip,
}: OnboardingTourProps = {}) {
  // Try to use context, fallback to props for standalone mode
  let tourContext: ReturnType<typeof useTour> | null = null;
  try {
    tourContext = useTour();
  } catch {
    // Not wrapped in TourProvider, use standalone mode
  }

  // Determine if we're using context or standalone mode
  const isContextMode = !!tourContext && !overrideSteps;

  // Get steps from context or props
  const steps = useMemo(() => {
    if (overrideSteps) return overrideSteps;
    if (tourContext) return tourContext.getCurrentTourSteps();
    return [];
  }, [overrideSteps, tourContext]);

  // Get current step index
  const currentStepIndex = tourContext?.currentStep ?? 0;

  // Determine if tour is active
  const isActive = overrideIsActive ?? (tourContext?.currentTour !== null);

  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Position tooltip near target element
  const updatePosition = useCallback(() => {
    if (!isActive || !steps[currentStepIndex]) return;

    const step = steps[currentStepIndex];
    const target = document.querySelector(step.target);

    if (!target) {
      // If target not found, position at center
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 200,
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    const tooltipWidth = 400;
    const tooltipHeight = 220;
    const padding = 16;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case "top":
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        break;
    }

    // Keep within viewport
    top = Math.max(padding, Math.min(window.innerHeight - tooltipHeight - padding, top));
    left = Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, left));

    setTooltipPosition({ top, left });
  }, [currentStepIndex, isActive, steps]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition]);

  // Animate on step change
  useEffect(() => {
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [currentStepIndex]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      if (isContextMode && tourContext) {
        tourContext.nextStep();
      }
    } else {
      // Complete tour
      if (isContextMode && tourContext) {
        tourContext.completeTour();
      }
      overrideOnComplete?.();
    }
  }, [currentStepIndex, steps.length, isContextMode, tourContext, overrideOnComplete]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      if (isContextMode && tourContext) {
        tourContext.prevStep();
      }
    }
  }, [currentStepIndex, isContextMode, tourContext]);

  const handleSkip = useCallback(() => {
    if (isContextMode && tourContext) {
      tourContext.skipTour();
    }
    overrideOnSkip?.();
  }, [isContextMode, tourContext, overrideOnSkip]);

  const handleGoToStep = useCallback((idx: number) => {
    if (isContextMode && tourContext) {
      tourContext.goToStep(idx);
    }
  }, [isContextMode, tourContext]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isActive) return;

      switch (e.key) {
        case "ArrowRight":
        case "Enter":
          handleNext();
          break;
        case "ArrowLeft":
          handlePrev();
          break;
        case "Escape":
          handleSkip();
          break;
      }
    },
    [isActive, handleNext, handlePrev, handleSkip]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!mounted || !isActive || steps.length === 0) return null;

  const step = steps[currentStepIndex];
  const targetElement = step?.spotlight ? document.querySelector(step.target) : null;
  const targetRect = targetElement?.getBoundingClientRect();

  // Get current tour info for display
  const currentTourName = tourContext?.registeredTours.find(
    (t) => t.id === tourContext?.currentTour
  )?.name;

  return createPortal(
    <>
      {/* Overlay with spotlight cutout */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && step?.spotlight && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.8)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight pulse ring */}
        {targetRect && step?.spotlight && (
          <div
            className="absolute border-2 border-blue-400/50 rounded-xl animate-pulse pointer-events-none"
            style={{
              left: targetRect.left - 12,
              top: targetRect.top - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className={`
          fixed z-[9999] w-[400px] bg-gradient-to-br from-slate-900 to-slate-950 
          border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden
          transition-all duration-300 ease-out
          ${animating ? "opacity-0 scale-95" : "opacity-100 scale-100"}
        `}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {currentTourName && (
                <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
                  {currentTourName}
                </span>
              )}
              <span className="text-xs font-medium text-slate-500">
                {currentStepIndex + 1} / {steps.length}
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              Skip tour
              <kbd className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">Esc</kbd>
            </button>
          </div>

          {/* Content */}
          <h3 className="text-xl font-bold text-white mb-3">{step?.title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{step?.content}</p>

          {/* Custom action button */}
          {step?.action && (
            <button
              onClick={step.action.onClick}
              className="mt-4 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-sm font-medium rounded-lg transition-colors"
            >
              {step.action.label}
            </button>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* Step dots */}
            <div className="flex gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGoToStep(idx)}
                  className={`
                    h-2 rounded-full transition-all duration-300
                    ${idx === currentStepIndex
                      ? "bg-blue-500 w-6"
                      : idx < currentStepIndex
                      ? "bg-blue-500/50 w-2"
                      : "bg-slate-600 w-2"
                    }
                  `}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/25"
            >
              {currentStepIndex === steps.length - 1 ? "Get Started" : "Next"}
              {currentStepIndex < steps.length - 1 && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="px-6 py-3 bg-slate-800/50 border-t border-slate-700/50 flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">→</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">Enter</kbd>
            Continue
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">Esc</kbd>
            Skip
          </span>
        </div>
      </div>
    </>,
    document.body
  );
}
