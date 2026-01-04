"use client";

import React, { useState, useEffect } from "react";
import type { Presence, User } from "@/lib/collaboration";

interface PresenceIndicatorProps {
  presence: Presence[];
  currentUser: User;
  maxDisplay?: number;
}

/**
 * PresenceIndicator - Shows avatars of connected users
 */
export default function PresenceIndicator({
  presence,
  currentUser,
  maxDisplay = 5,
}: PresenceIndicatorProps) {
  const [mounted, setMounted] = useState(false);
  const displayedUsers = presence.slice(0, maxDisplay);
  const remainingCount = presence.length - maxDisplay;

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
        <span className="text-xs text-slate-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {/* Current user (always first) */}
        <div
          className="relative w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-medium text-white"
          style={{ backgroundColor: currentUser.color }}
          title={`${currentUser.name} (you)`}
        >
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(currentUser.name)
          )}
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
        </div>

        {/* Other users */}
        {displayedUsers.map((p) => (
          <div
            key={p.user.id}
            className="relative w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-medium text-white transition-transform hover:scale-110 hover:z-10"
            style={{ backgroundColor: p.user.color }}
            title={p.user.name}
          >
            {p.user.avatar ? (
              <img
                src={p.user.avatar}
                alt={p.user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(p.user.name)
            )}
            {/* Activity indicator */}
            {p.activeBlockId && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-900 animate-pulse" />
            )}
          </div>
        ))}

        {/* Overflow indicator */}
        {remainingCount > 0 && (
          <div
            className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-medium text-white"
            title={`${remainingCount} more`}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Connected count */}
      <span className="text-xs text-slate-400">
        {presence.length + 1} online
      </span>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

