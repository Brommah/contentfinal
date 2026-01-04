"use client";

import React, { useState } from "react";
import type { Milestone } from "@/lib/roadmap-types";
import { nanoid } from "nanoid";

interface MilestoneEditorProps {
  milestones: Milestone[];
  onAdd: (milestone: Milestone) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Milestone>) => void;
}

const MILESTONE_ICONS = ["🚀", "📅", "🎯", "⭐", "🏆", "📢", "🔔", "📌"];
const MILESTONE_COLORS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
];

/**
 * MilestoneEditor - Add and manage milestone markers
 */
export default function MilestoneEditor({
  milestones,
  onAdd,
  onRemove,
  onUpdate,
}: MilestoneEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newIcon, setNewIcon] = useState("🚀");
  const [newColor, setNewColor] = useState("#3b82f6");

  const handleAdd = () => {
    if (!newTitle.trim() || !newDate) return;

    const milestone: Milestone = {
      id: nanoid(),
      title: newTitle.trim(),
      date: new Date(newDate),
      icon: newIcon,
      color: newColor,
    };

    onAdd(milestone);
    setNewTitle("");
    setNewDate("");
    setIsAdding(false);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          📌 Milestones
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          {isAdding ? "Cancel" : "+ Add"}
        </button>
      </div>

      {/* Add new milestone form */}
      {isAdding && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Milestone title..."
            className="w-full px-3 py-2 text-sm rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Icon:</span>
            {MILESTONE_ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => setNewIcon(icon)}
                className={`p-1 rounded ${newIcon === icon ? "ring-2 ring-blue-500" : ""}`}
              >
                {icon}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Color:</span>
            {MILESTONE_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className={`w-6 h-6 rounded-full ${newColor === color ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim() || !newDate}
            className="w-full px-3 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            Add Milestone
          </button>
        </div>
      )}

      {/* Existing milestones */}
      <div className="space-y-2">
        {milestones.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No milestones yet</p>
        ) : (
          milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900 group"
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{ backgroundColor: milestone.color }}
              >
                {milestone.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {milestone.title}
                </p>
                <p className="text-xs text-gray-500">
                  {milestone.date.toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => onRemove(milestone.id)}
                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

