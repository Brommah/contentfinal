"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "rectangle" | "rounded";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Skeleton - Loading placeholder component
 */
export function Skeleton({
  className = "",
  variant = "rectangle",
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = "bg-slate-800";
  const animateClasses = animate ? "animate-pulse" : "";
  
  const variantClasses = {
    text: "h-4 rounded",
    circle: "rounded-full",
    rectangle: "",
    rounded: "rounded-xl",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${animateClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

/**
 * SkeletonText - Multiple lines of skeleton text
 */
export function SkeletonText({
  lines = 3,
  gap = 2,
  className = "",
}: {
  lines?: number;
  gap?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-${gap} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard - Card-shaped skeleton
 */
export function SkeletonCard({
  className = "",
  showHeader = true,
  showContent = true,
  showFooter = false,
}: {
  className?: string;
  showHeader?: boolean;
  showContent?: boolean;
  showFooter?: boolean;
}) {
  return (
    <div className={`bg-slate-900/60 border border-slate-800 rounded-xl p-4 ${className}`}>
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          <Skeleton variant="circle" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="25%" className="h-3" />
          </div>
        </div>
      )}
      {showContent && (
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="85%" />
          <Skeleton variant="text" width="70%" />
        </div>
      )}
      {showFooter && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
          <Skeleton variant="rounded" width={80} height={32} />
          <Skeleton variant="rounded" width={80} height={32} />
        </div>
      )}
    </div>
  );
}

/**
 * SkeletonTable - Table skeleton for data loading
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = "",
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex gap-4 p-4 bg-slate-800/50 border-b border-slate-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1 h-3" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 p-4 border-b border-slate-800 last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              variant="text"
              className="flex-1"
              width={colIdx === 0 ? "80%" : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonGrid - Grid of skeleton cards
 */
export function SkeletonGrid({
  items = 6,
  columns = 3,
  className = "",
}: {
  items?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid gap-4 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * SkeletonBento - Bento grid skeleton for HomePage
 */
export function SkeletonBento({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-4 gap-4 auto-rows-[170px] ${className}`}>
      <Skeleton variant="rounded" className="col-span-2 row-span-2" />
      <Skeleton variant="rounded" className="col-span-2" />
      <Skeleton variant="rounded" className="col-span-1" />
      <Skeleton variant="rounded" className="col-span-1" />
      <Skeleton variant="rounded" className="col-span-2" />
      <Skeleton variant="rounded" className="col-span-1" />
      <Skeleton variant="rounded" className="col-span-1" />
    </div>
  );
}

/**
 * SkeletonBlockEditor - Skeleton for block editor panel
 */
export function SkeletonBlockEditor({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="30%" className="h-3" />
        </div>
      </div>
      {/* Content area */}
      <Skeleton variant="rounded" height={200} className="w-full" />
      {/* Meta fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" width="40%" className="h-3" />
          <Skeleton variant="rounded" height={36} />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" width="40%" className="h-3" />
          <Skeleton variant="rounded" height={36} />
        </div>
      </div>
      {/* Tags */}
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={80} height={24} />
        <Skeleton variant="rounded" width={50} height={24} />
      </div>
    </div>
  );
}

/**
 * SkeletonList - Skeleton for list items
 */
export function SkeletonList({
  items = 5,
  showIcon = true,
  className = "",
}: {
  items?: number;
  showIcon?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
          {showIcon && <Skeleton variant="rounded" width={32} height={32} />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width={`${60 + Math.random() * 30}%`} />
            <Skeleton variant="text" width={`${30 + Math.random() * 20}%`} className="h-3" />
          </div>
          <Skeleton variant="rounded" width={24} height={24} />
        </div>
      ))}
    </div>
  );
}


