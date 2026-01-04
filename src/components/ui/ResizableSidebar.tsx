"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

export type SidebarPosition = "left" | "right";

interface ResizableSidebarProps {
  children: React.ReactNode;
  position: SidebarPosition;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  storageKey?: string;
}

/**
 * ResizableSidebar - A draggable sidebar that can be resized
 * Persists width to localStorage if storageKey is provided
 */
export default function ResizableSidebar({
  children,
  position,
  defaultWidth = 320,
  minWidth = 240,
  maxWidth = 600,
  className = "",
  storageKey,
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load saved width from localStorage
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`sidebar-width-${storageKey}`);
      if (saved) {
        const parsedWidth = parseInt(saved, 10);
        if (!isNaN(parsedWidth) && parsedWidth >= minWidth && parsedWidth <= maxWidth) {
          setWidth(parsedWidth);
        }
      }
    }
  }, [storageKey, minWidth, maxWidth]);

  // Save width to localStorage
  const saveWidth = useCallback(
    (newWidth: number) => {
      if (storageKey) {
        localStorage.setItem(`sidebar-width-${storageKey}`, String(newWidth));
      }
    },
    [storageKey]
  );

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Handle mouse move during resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const rect = sidebarRef.current.getBoundingClientRect();
      let newWidth: number;

      if (position === "left") {
        newWidth = e.clientX - rect.left;
      } else {
        newWidth = rect.right - e.clientX;
      }

      // Clamp to min/max
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(newWidth);
    },
    [isResizing, position, minWidth, maxWidth]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      saveWidth(width);
    }
  }, [isResizing, width, saveWidth]);

  // Add/remove global event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const resizeHandle = (
    <div
      onMouseDown={handleMouseDown}
      className={`
        absolute top-0 bottom-0 w-1.5 z-20
        cursor-col-resize
        transition-colors duration-150
        hover:bg-blue-500/50
        ${isResizing ? "bg-blue-500" : "bg-transparent"}
        ${position === "left" ? "right-0" : "left-0"}
      `}
      style={{
        // Extend hit area for easier grabbing
        padding: "0 4px",
        margin: position === "left" ? "0 -4px 0 0" : "0 0 0 -4px",
      }}
    >
      {/* Visual indicator on hover */}
      <div
        className={`
          absolute top-1/2 -translate-y-1/2 w-1 h-12 rounded-full
          transition-opacity duration-150
          ${isResizing ? "opacity-100 bg-blue-500" : "opacity-0"}
          ${position === "left" ? "right-0" : "left-0"}
        `}
      />
    </div>
  );

  return (
    <div
      ref={sidebarRef}
      className={`relative flex-shrink-0 z-30 ${className}`}
      style={{ width }}
    >
      {children}
      {resizeHandle}
      
      {/* Width indicator during resize */}
      {isResizing && (
        <div
          className={`
            absolute top-2 px-2 py-1 
            bg-blue-600 text-white text-xs font-mono rounded shadow-lg
            ${position === "left" ? "right-2" : "left-2"}
          `}
        >
          {Math.round(width)}px
        </div>
      )}
    </div>
  );
}


