"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  shortcut?: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

/**
 * Tooltip - Hover tooltip with optional keyboard shortcut hint
 */
export function Tooltip({
  children,
  content,
  shortcut,
  position = "top",
  delay = 300,
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (position) {
          case "top":
            top = rect.top - 8;
            left = rect.left + rect.width / 2;
            break;
          case "bottom":
            top = rect.bottom + 8;
            left = rect.left + rect.width / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2;
            left = rect.left - 8;
            break;
          case "right":
            top = rect.top + rect.height / 2;
            left = rect.right + 8;
            break;
        }

        setTooltipPos({ top, left });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "-translate-x-1/2 -translate-y-full";
      case "bottom":
        return "-translate-x-1/2";
      case "left":
        return "-translate-x-full -translate-y-1/2";
      case "right":
        return "-translate-y-1/2";
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={className}
      >
        {children}
      </div>

      {mounted &&
        isVisible &&
        createPortal(
          <div
            className={`
              fixed z-[10000] pointer-events-none
              animate-in fade-in zoom-in-95 duration-100
              ${getPositionClasses()}
            `}
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
            }}
          >
            <div className="px-2.5 py-1.5 bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl text-xs text-white font-medium whitespace-nowrap flex items-center gap-2">
              <span>{content}</span>
              {shortcut && (
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-mono border border-slate-700/50">
                  {shortcut}
                </kbd>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/**
 * IconButton - Button with tooltip and optional keyboard shortcut
 */
export function IconButton({
  icon,
  label,
  shortcut,
  onClick,
  disabled = false,
  active = false,
  variant = "default",
  size = "md",
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: "default" | "primary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const variantClasses = {
    default: `
      bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
      text-slate-600 dark:text-slate-300
      hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white
      ${active ? "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" : ""}
    `,
    primary: `
      bg-cyan-500 border border-cyan-500
      text-white
      hover:bg-cyan-400
    `,
    danger: `
      bg-red-500/10 border border-red-500/30
      text-red-500
      hover:bg-red-500/20
    `,
    ghost: `
      bg-transparent border border-transparent
      text-slate-500 dark:text-slate-400
      hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white
    `,
  };

  return (
    <Tooltip content={label} shortcut={shortcut}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          rounded-lg flex items-center justify-center
          transition-all duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:ring-offset-2 focus:ring-offset-slate-900
          ${className}
        `}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

/**
 * ButtonWithShortcut - Regular button with visible shortcut hint
 */
export function ButtonWithShortcut({
  children,
  shortcut,
  onClick,
  disabled = false,
  variant = "default",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-3 py-2 text-sm gap-2",
    lg: "px-4 py-2.5 text-sm gap-2.5",
  };

  const variantClasses = {
    default: `
      bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
      text-slate-700 dark:text-slate-200
      hover:bg-slate-50 dark:hover:bg-slate-700
    `,
    primary: `
      bg-gradient-to-r from-cyan-500 to-blue-500 border border-cyan-500/50
      text-white font-semibold
      hover:from-cyan-400 hover:to-blue-400
      shadow-lg shadow-cyan-500/25
    `,
    secondary: `
      bg-slate-800 border border-slate-700
      text-slate-200
      hover:bg-slate-700
    `,
    ghost: `
      bg-transparent border border-transparent
      text-slate-500 dark:text-slate-400
      hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white
    `,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
      {shortcut && (
        <kbd className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 text-current/60 rounded text-[10px] font-mono opacity-70">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}


