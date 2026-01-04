"use client";

import React from "react";
import type { Cursor, User, Presence } from "@/lib/collaboration";

interface CursorOverlayProps {
  cursors: Cursor[];
  presence: Presence[];
}

/**
 * CursorOverlay - Renders other users' cursors on the canvas
 */
export default function CursorOverlay({ cursors, presence }: CursorOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {cursors.map((cursor) => {
        const user = presence.find((p) => p.user.id === cursor.userId)?.user;
        if (!user) return null;

        return (
          <div
            key={cursor.userId}
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: "translate(-2px, -2px)",
            }}
          >
            {/* Cursor arrow */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
            >
              <path
                d="M5.65376 12.4564L8.40856 20.1817C8.55874 20.5825 9.06563 20.6928 9.36478 20.3936L11.8492 17.9091C12.1005 17.6578 12.4883 17.5982 12.8051 17.7621L16.3798 19.6147C16.7849 19.824 17.2733 19.5981 17.3817 19.1553L20.0321 7.96992C20.1545 7.47011 19.6543 7.05585 19.1855 7.27193L6.17859 13.2044C5.65943 13.4433 5.52891 14.1229 5.92538 14.5277L8.2139 16.8668"
                fill={user.color}
              />
              <path
                d="M5.65376 12.4564L8.40856 20.1817C8.55874 20.5825 9.06563 20.6928 9.36478 20.3936L11.8492 17.9091C12.1005 17.6578 12.4883 17.5982 12.8051 17.7621L16.3798 19.6147C16.7849 19.824 17.2733 19.5981 17.3817 19.1553L20.0321 7.96992C20.1545 7.47011 19.6543 7.05585 19.1855 7.27193L6.17859 13.2044C5.65943 13.4433 5.52891 14.1229 5.92538 14.5277L8.2139 16.8668"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Name label */}
            <div
              className="absolute left-4 top-4 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}


