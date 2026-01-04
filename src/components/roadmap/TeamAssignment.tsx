"use client";

import React, { useState } from "react";
import type { TeamMember } from "@/lib/roadmap-types";
import { DEFAULT_TEAM } from "@/lib/roadmap-types";

interface TeamAssignmentProps {
  assigneeId?: string;
  onAssign: (memberId: string | undefined) => void;
  size?: "sm" | "md";
}

/**
 * TeamAssignment - Avatar pill for assigning team members
 */
export default function TeamAssignment({
  assigneeId,
  onAssign,
  size = "md",
}: TeamAssignmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const assignee = DEFAULT_TEAM.find((t) => t.id === assigneeId);

  const sizeClasses = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${sizeClasses} rounded-full flex items-center justify-center font-bold
          transition-all hover:ring-2 hover:ring-blue-400 hover:ring-offset-1
          ${assignee ? "text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}
        `}
        style={assignee ? { backgroundColor: assignee.color } : undefined}
        title={assignee ? `${assignee.name} (${assignee.role})` : "Assign team member"}
      >
        {assignee ? assignee.avatar : "+"}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 uppercase">Assign to</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {/* Unassign option */}
              {assignee && (
                <button
                  onClick={() => {
                    onAssign(undefined);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500">
                    ×
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Unassign</span>
                </button>
              )}

              {/* Team members */}
              {DEFAULT_TEAM.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    onAssign(member.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left
                    ${assigneeId === member.id ? "bg-blue-50 dark:bg-blue-900/30" : ""}
                  `}
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{member.role}</p>
                  </div>
                  {assigneeId === member.id && (
                    <span className="text-blue-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * TeamFilter - Filter items by team member
 */
export function TeamFilter({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {DEFAULT_TEAM.map((member) => (
        <button
          key={member.id}
          onClick={() => onToggle(member.id)}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white
            transition-all
            ${selectedIds.includes(member.id) ? "ring-2 ring-offset-2 ring-blue-500" : "opacity-50 hover:opacity-100"}
          `}
          style={{ backgroundColor: member.color }}
          title={member.name}
        >
          {member.avatar}
        </button>
      ))}
    </div>
  );
}

