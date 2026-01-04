"use client";

import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "compact" | "card";
}

/**
 * EmptyState - Consistent empty state component with CTAs
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = "",
  variant = "default",
}: EmptyStateProps) {
  const defaultIcon = (
    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11v4M12 11l-3 3M12 11l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-4 p-4 text-center ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-500">
          {icon || (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm text-slate-400">{title}</p>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="px-3 py-1.5 text-xs font-medium bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`p-6 bg-slate-900/50 border border-dashed border-slate-700 rounded-xl text-center ${className}`}>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800/70 text-slate-500 mb-4">
          {icon || defaultIcon}
        </div>
        <h4 className="text-base font-semibold text-white mb-1">{title}</h4>
        {description && <p className="text-sm text-slate-400 max-w-xs mx-auto">{description}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-lg transition-colors"
          >
            {action.icon}
            {action.label}
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-6 shadow-xl">
        {icon || defaultIcon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">{description}</p>
      )}
      <div className="flex items-center gap-3">
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
          >
            {action.icon || (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" />
              </svg>
            )}
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

// Preset empty states for common scenarios
export function NoBlocksEmptyState({ onCreateBlock }: { onCreateBlock: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <path d="M14 17h6m-3-3v6" strokeLinecap="round" />
        </svg>
      }
      title="No content blocks yet"
      description="Get started by creating your first content block. Blocks are the building units of your content architecture."
      action={{
        label: "Create First Block",
        onClick: onCreateBlock,
      }}
    />
  );
}

export function NoResultsEmptyState({ searchQuery, onClearFilters }: { searchQuery?: string; onClearFilters: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          <path d="M8 11h6" strokeLinecap="round" />
        </svg>
      }
      title={searchQuery ? `No results for "${searchQuery}"` : "No results found"}
      description="Try adjusting your filters or search query to find what you're looking for."
      action={{
        label: "Clear Filters",
        onClick: onClearFilters,
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
          </svg>
        ),
      }}
    />
  );
}

export function NoFavoritesEmptyState({ onExplore }: { onExplore: () => void }) {
  return (
    <EmptyState
      variant="card"
      icon={
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      }
      title="No favorites yet"
      description="Star blocks to access them quickly from here."
      action={{
        label: "Explore Blocks",
        onClick: onExplore,
      }}
    />
  );
}

export function NoReviewsEmptyState() {
  return (
    <EmptyState
      variant="card"
      icon={
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      }
      title="All caught up! 🎉"
      description="No pending reviews at the moment. Great job keeping the queue clear!"
    />
  );
}

export function NoConnectionsEmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <EmptyState
      variant="compact"
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 7h3a5 5 0 010 10h-3m-6 0H6a5 5 0 010-10h3" />
          <path d="M8 12h8" strokeLinecap="round" />
        </svg>
      }
      title="No connections yet"
      description="Link related content blocks together."
      action={{
        label: "Add Connection",
        onClick: onConnect,
      }}
    />
  );
}


