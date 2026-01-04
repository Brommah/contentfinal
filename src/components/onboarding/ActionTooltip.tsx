"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useTour } from "./TourProvider";

interface ActionTooltipProps {
  /** Unique action ID for tracking */
  actionId: string;
  /** Target element selector */
  target: string;
  /** Tooltip title */
  title: string;
  /** Tooltip content */
  content: string;
  /** Position relative to target */
  position?: "top" | "bottom" | "left" | "right";
  /** Auto-dismiss after N milliseconds (0 = no auto-dismiss) */
  autoDismissMs?: number;
  /** Show only once per session (uses localStorage) */
  showOnce?: boolean;
  /** Trigger event that shows the tooltip */
  trigger?: "mount" | "hover" | "focus";
  /** Callback when dismissed */
  onDismiss?: () => void;
}

/**
 * ActionTooltip - Contextual first-time hints for user actions
 * Shows a subtle tooltip near an element to guide users
 */
export default function ActionTooltip({
  actionId,
  target,
  title,
  content,
  position = "bottom",
  autoDismissMs = 5000,
  showOnce = true,
  trigger = "mount",
  onDismiss,
}: ActionTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Try to use tour context, but gracefully handle if not available
  let tourContext: ReturnType<typeof useTour> | null = null;
  try {
    tourContext = useTour();
  } catch {
    // Not wrapped in TourProvider
  }

  const isActionSeen = tourContext?.isActionSeen(actionId) ?? false;
  const markActionSeen = tourContext?.markActionSeen;

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Position tooltip near target element
  const updatePosition = useCallback(() => {
    const targetEl = document.querySelector(target);
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 100;
    const padding = 12;

    let top = 0;
    let left = 0;

    switch (position) {
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
  }, [target, position]);

  // Show tooltip based on trigger
  const show = useCallback(() => {
    if (showOnce && isActionSeen) return;
    
    const targetEl = document.querySelector(target);
    if (!targetEl) return;

    updatePosition();
    setIsVisible(true);

    // Auto-dismiss
    if (autoDismissMs > 0) {
      timeoutRef.current = setTimeout(() => {
        dismiss();
      }, autoDismissMs);
    }
  }, [showOnce, isActionSeen, target, updatePosition, autoDismissMs]);

  // Dismiss tooltip
  const dismiss = useCallback(() => {
    setIsVisible(false);
    if (showOnce && markActionSeen) {
      markActionSeen(actionId);
    }
    onDismiss?.();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [showOnce, markActionSeen, actionId, onDismiss]);

  // Set up trigger listeners
  useEffect(() => {
    if (!mounted || (showOnce && isActionSeen)) return;

    const targetEl = document.querySelector(target);
    if (!targetEl) return;

    if (trigger === "mount") {
      // Small delay to let the page render
      const timer = setTimeout(show, 500);
      return () => clearTimeout(timer);
    }

    if (trigger === "hover") {
      const handleMouseEnter = () => show();
      const handleMouseLeave = () => dismiss();
      targetEl.addEventListener("mouseenter", handleMouseEnter);
      targetEl.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        targetEl.removeEventListener("mouseenter", handleMouseEnter);
        targetEl.removeEventListener("mouseleave", handleMouseLeave);
      };
    }

    if (trigger === "focus") {
      const handleFocus = () => show();
      const handleBlur = () => dismiss();
      targetEl.addEventListener("focus", handleFocus);
      targetEl.addEventListener("blur", handleBlur);
      return () => {
        targetEl.removeEventListener("focus", handleFocus);
        targetEl.removeEventListener("blur", handleBlur);
      };
    }
  }, [mounted, showOnce, isActionSeen, target, trigger, show, dismiss]);

  // Update position on resize/scroll
  useEffect(() => {
    if (!isVisible) return;

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isVisible, updatePosition]);

  if (!mounted || !isVisible) return null;

  // Get arrow position
  const arrowPosition = {
    top: position === "bottom" ? "-8px" : position === "top" ? "auto" : "50%",
    bottom: position === "top" ? "-8px" : "auto",
    left: position === "right" ? "-8px" : position === "left" ? "auto" : "50%",
    right: position === "left" ? "-8px" : "auto",
    transform:
      position === "top" || position === "bottom"
        ? "translateX(-50%) rotate(45deg)"
        : "translateY(-50%) rotate(45deg)",
  };

  return createPortal(
    <div
      className="fixed z-[9995] w-[280px] animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
      }}
    >
      {/* Tooltip card */}
      <div className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-4">
        {/* Arrow */}
        <div
          className="absolute w-4 h-4 bg-slate-800 border-l border-t border-slate-700"
          style={arrowPosition}
        />

        {/* Content */}
        <div className="relative">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white">{title}</h4>
            <button
              onClick={dismiss}
              className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{content}</p>

          {/* Don't show again */}
          {showOnce && (
            <button
              onClick={dismiss}
              className="mt-2 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Got it, don't show again
            </button>
          )}
        </div>

        {/* Pulse indicator on target */}
        <PulseIndicator target={target} />
      </div>
    </div>,
    document.body
  );
}

/**
 * PulseIndicator - Shows a pulse animation on the target element
 */
function PulseIndicator({ target }: { target: string }) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const el = document.querySelector(target);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width + 8,
        height: rect.height + 8,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [target]);

  return createPortal(
    <div
      className="fixed pointer-events-none z-[9994] border-2 border-blue-400/50 rounded-lg animate-pulse"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
      }}
    />,
    document.body
  );
}

/**
 * Hook to show action tooltip programmatically
 */
export function useActionTooltip() {
  const [tooltips, setTooltips] = useState<Array<ActionTooltipProps & { key: string }>>([]);

  const showTooltip = useCallback((props: ActionTooltipProps) => {
    const key = `${props.actionId}-${Date.now()}`;
    setTooltips((prev) => [...prev, { ...props, key }]);
  }, []);

  const dismissTooltip = useCallback((key: string) => {
    setTooltips((prev) => prev.filter((t) => t.key !== key));
  }, []);

  const TooltipContainer = () => (
    <>
      {tooltips.map(({ key, ...tooltipProps }) => (
        <ActionTooltip
          key={key}
          {...tooltipProps}
          onDismiss={() => {
            dismissTooltip(key);
            tooltipProps.onDismiss?.();
          }}
        />
      ))}
    </>
  );

  return { showTooltip, TooltipContainer };
}

