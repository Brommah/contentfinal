"use client";

import React, { useState, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import type { Milestone, RoadmapItem } from "@/lib/roadmap-types";
import { MILESTONE_STATUS_CONFIGS, STATUS_CONFIGS } from "@/lib/roadmap-types";
import { nanoid } from "nanoid";

const MILESTONE_ICONS = ["🚀", "📅", "🎯", "⭐", "🏆", "📢", "🔔", "📌", "🎉", "📦"];
const MILESTONE_COLORS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

/**
 * MilestoneEditor - Full milestone management with item linking
 */
export default function MilestoneEditor() {
  const {
    milestones,
    roadmapItems,
    selectedMilestoneId,
    addMilestone,
    updateMilestone,
    removeMilestone,
    selectMilestone,
    linkItemToMilestone,
    unlinkItemFromMilestone,
    getMilestoneProgress,
  } = useCanvasStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showItemPicker, setShowItemPicker] = useState(false);

  // Form state for new/editing milestone
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    icon: "🚀",
    color: "#3b82f6",
  });

  const selectedMilestone = useMemo(
    () => milestones.find((m) => m.id === selectedMilestoneId),
    [milestones, selectedMilestoneId]
  );

  const linkedItems = useMemo(() => {
    if (!selectedMilestone) return [];
    return roadmapItems.filter((item) =>
      selectedMilestone.linkedItemIds.includes(item.id)
    );
  }, [selectedMilestone, roadmapItems]);

  const unlinkedItems = useMemo(() => {
    if (!selectedMilestone) return roadmapItems;
    return roadmapItems.filter(
      (item) => !selectedMilestone.linkedItemIds.includes(item.id)
    );
  }, [selectedMilestone, roadmapItems]);

  const handleAdd = () => {
    if (!formData.title.trim() || !formData.date) return;

    addMilestone({
      title: formData.title.trim(),
      description: formData.description.trim(),
      date: new Date(formData.date),
      icon: formData.icon,
      color: formData.color,
      linkedItemIds: [],
      status: "ON_TRACK",
    });

    resetForm();
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (!editingId || !formData.title.trim() || !formData.date) return;

    updateMilestone(editingId, {
      title: formData.title.trim(),
      description: formData.description.trim(),
      date: new Date(formData.date),
      icon: formData.icon,
      color: formData.color,
    });

    resetForm();
    setEditingId(null);
  };

  const startEditing = (milestone: Milestone) => {
    setFormData({
      title: milestone.title,
      description: milestone.description || "",
      date: milestone.date.toISOString().split("T")[0],
      icon: milestone.icon,
      color: milestone.color,
    });
    setEditingId(milestone.id);
    setIsAdding(false);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      icon: "🚀",
      color: "#3b82f6",
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Remove this milestone? Linked items will be unlinked.")) {
      removeMilestone(id);
      if (selectedMilestoneId === id) {
        selectMilestone(null);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = (date: Date) => {
    const now = new Date();
    const target = new Date(date);
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            📌 Milestones
          </h2>
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
              resetForm();
            }}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            {isAdding ? "Cancel" : "+ Add"}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Milestone name..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What's included in this milestone..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Delivery Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon
              </label>
              <div className="flex flex-wrap gap-1">
                {MILESTONE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                      formData.icon === icon
                        ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-1">
                {MILESTONE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color ? "ring-2 ring-offset-2 ring-blue-500" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={!formData.title.trim() || !formData.date}
              className="flex-1 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editingId ? "Save Changes" : "Create Milestone"}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Milestones List */}
      <div className="flex-1 overflow-y-auto">
        {milestones.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📌</div>
            <p>No milestones yet</p>
            <p className="text-sm mt-1">Create milestones to track key deliveries</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {milestones.map((milestone) => {
              const progress = getMilestoneProgress(milestone.id);
              const daysRemaining = getDaysRemaining(milestone.date);
              const isSelected = selectedMilestoneId === milestone.id;
              const statusConfig = milestone.status
                ? MILESTONE_STATUS_CONFIGS[milestone.status]
                : MILESTONE_STATUS_CONFIGS.ON_TRACK;

              return (
                <div
                  key={milestone.id}
                  className={`rounded-xl border transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {/* Milestone Header */}
                  <button
                    onClick={() => selectMilestone(isSelected ? null : milestone.id)}
                    className="w-full p-3 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0"
                        style={{ backgroundColor: milestone.color }}
                      >
                        {milestone.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {milestone.title}
                          </h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${statusConfig.color}20`,
                              color: statusConfig.color,
                            }}
                          >
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>📅 {formatDate(milestone.date)}</span>
                          <span
                            className={
                              daysRemaining < 0
                                ? "text-red-500"
                                : daysRemaining < 7
                                ? "text-amber-500"
                                : ""
                            }
                          >
                            {daysRemaining < 0
                              ? `${Math.abs(daysRemaining)}d overdue`
                              : daysRemaining === 0
                              ? "Due today"
                              : `${daysRemaining}d remaining`}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        {progress.total > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">
                                {progress.completed}/{progress.total} items complete
                              </span>
                              <span className="font-medium" style={{ color: milestone.color }}>
                                {progress.percentage}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${progress.percentage}%`,
                                  backgroundColor: milestone.color,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expand/Collapse Indicator */}
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isSelected ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isSelected && (
                    <div className="px-3 pb-3 space-y-4 border-t border-gray-200 dark:border-gray-700 mt-2 pt-3">
                      {/* Description */}
                      {milestone.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {milestone.description}
                        </p>
                      )}

                      {/* Status Selector */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">
                          Status
                        </label>
                        <div className="flex gap-1">
                          {(Object.keys(MILESTONE_STATUS_CONFIGS) as Array<keyof typeof MILESTONE_STATUS_CONFIGS>).map(
                            (status) => (
                              <button
                                key={status}
                                onClick={() => updateMilestone(milestone.id, { status })}
                                className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                                  milestone.status === status
                                    ? "ring-2 ring-offset-1"
                                    : "opacity-60 hover:opacity-100"
                                }`}
                                style={{
                                  backgroundColor: `${MILESTONE_STATUS_CONFIGS[status].color}20`,
                                  color: MILESTONE_STATUS_CONFIGS[status].color,
                                  ...(milestone.status === status && {
                                    ringColor: MILESTONE_STATUS_CONFIGS[status].color,
                                  }),
                                }}
                              >
                                {MILESTONE_STATUS_CONFIGS[status].icon} {MILESTONE_STATUS_CONFIGS[status].label}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Linked Items */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-500">
                            Linked Deliverables ({linkedItems.length})
                          </label>
                          <button
                            onClick={() => setShowItemPicker(!showItemPicker)}
                            className="text-xs text-blue-500 hover:text-blue-600"
                          >
                            {showItemPicker ? "Done" : "+ Add Items"}
                          </button>
                        </div>

                        {/* Item Picker */}
                        {showItemPicker && (
                          <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg max-h-40 overflow-y-auto">
                            {unlinkedItems.length === 0 ? (
                              <p className="text-xs text-gray-500 text-center py-2">
                                All items are linked
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {unlinkedItems.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => linkItemToMilestone(milestone.id, item.id)}
                                    className="w-full flex items-center gap-2 p-2 text-left text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    <span className="text-xs">
                                      {STATUS_CONFIGS[item.status].icon}
                                    </span>
                                    <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
                                      {item.title}
                                    </span>
                                    <span className="text-xs text-gray-400">{item.company}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Linked Items List */}
                        {linkedItems.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">
                            No items linked to this milestone
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {linkedItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg group"
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: STATUS_CONFIGS[item.status].color }}
                                />
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                                  {item.title}
                                </span>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-500">
                                  {item.company}
                                </span>
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${STATUS_CONFIGS[item.status].color}20`,
                                    color: STATUS_CONFIGS[item.status].color,
                                  }}
                                >
                                  {STATUS_CONFIGS[item.status].label}
                                </span>
                                <button
                                  onClick={() => unlinkItemFromMilestone(milestone.id, item.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => startEditing(milestone)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(milestone.id)}
                          className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
