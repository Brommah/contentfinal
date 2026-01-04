"use client";

import React, { useState } from "react";
import { useCanvasStore } from "@/lib/store";
import {
  SUGGESTION_CATEGORY_CONFIGS,
  PRIORITY_CONFIGS,
  type Company,
  type ContentSuggestion,
  type SuggestionCategory,
  type SuggestionPriority,
} from "@/lib/types";

interface SuggestionsInboxProps {
  companyFilter: Company | "ALL";
}

/**
 * SuggestionsInbox - Shows team suggestions for Fred's review with submission form
 */
export default function SuggestionsInbox({ companyFilter }: SuggestionsInboxProps) {
  const {
    suggestions,
    addSuggestion,
    approveSuggestion,
    rejectSuggestion,
    updateSuggestion,
  } = useCanvasStore();
  const [showForm, setShowForm] = useState(false);
  const [commentingOnId, setCommentingOnId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  // Filter by company
  const filteredSuggestions = suggestions.filter(
    (s) => companyFilter === "ALL" || s.company === companyFilter
  );

  const pendingSuggestions = filteredSuggestions
    .filter((s) => s.status === "PENDING")
    .sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const recentlyReviewed = filteredSuggestions
    .filter((s) => s.status !== "PENDING")
    .slice(0, 3);

  const handleApprove = (id: string) => {
    approveSuggestion(id, reviewComment || undefined);
    setCommentingOnId(null);
    setReviewComment("");
  };

  const handleReject = (id: string) => {
    if (commentingOnId === id && reviewComment.trim()) {
      rejectSuggestion(id, reviewComment);
      setCommentingOnId(null);
      setReviewComment("");
    } else {
      setCommentingOnId(id);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            💡 Team Suggestions
            {pendingSuggestions.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                {pendingSuggestions.length}
              </span>
            )}
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
          >
            {showForm ? "✕ Close" : "+ Submit Idea"}
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Submission Form */}
        {showForm && (
          <SuggestionForm
            onSubmit={(suggestion) => {
              addSuggestion(suggestion);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Pending Suggestions */}
        {pendingSuggestions.length === 0 && !showForm ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">💡</div>
            <p className="text-slate-400 text-sm">No pending suggestions</p>
            <p className="text-slate-500 text-xs mt-1">
              Team members can submit content ideas for review
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isCommenting={commentingOnId === suggestion.id}
                comment={reviewComment}
                onCommentChange={setReviewComment}
                onApprove={() => handleApprove(suggestion.id)}
                onReject={() => handleReject(suggestion.id)}
                onStartProgress={() =>
                  updateSuggestion(suggestion.id, { status: "IN_PROGRESS" })
                }
                onCancelComment={() => {
                  setCommentingOnId(null);
                  setReviewComment("");
                }}
              />
            ))}
          </div>
        )}

        {/* Recently reviewed */}
        {recentlyReviewed.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <h3 className="text-xs font-medium text-slate-500 mb-2">
              Recently Reviewed
            </h3>
            <div className="space-y-1">
              {recentlyReviewed.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 p-2 rounded bg-slate-700/30 text-sm"
                >
                  <span className="text-lg">
                    {SUGGESTION_CATEGORY_CONFIGS[s.category].icon}
                  </span>
                  <span className="text-slate-300 flex-1 truncate">{s.title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      s.status === "APPROVED"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : s.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {s.status === "APPROVED"
                      ? "✓ Approved"
                      : s.status === "IN_PROGRESS"
                      ? "🔄 In Progress"
                      : "✕ Rejected"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  isCommenting,
  comment,
  onCommentChange,
  onApprove,
  onReject,
  onStartProgress,
  onCancelComment,
}: {
  suggestion: ContentSuggestion;
  isCommenting: boolean;
  comment: string;
  onCommentChange: (comment: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onStartProgress: () => void;
  onCancelComment: () => void;
}) {
  const categoryConfig = SUGGESTION_CATEGORY_CONFIGS[suggestion.category];
  const priorityConfig = PRIORITY_CONFIGS[suggestion.priority];
  const companyColor =
    suggestion.company === "CERE" ? "text-blue-400" : "text-purple-400";

  return (
    <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xl">
          {categoryConfig.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-medium ${companyColor}`}>
              {suggestion.company}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-500">{categoryConfig.label}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: priorityConfig.color + "20", color: priorityConfig.color }}
            >
              {priorityConfig.icon} {priorityConfig.label}
            </span>
          </div>
          <h4 className="text-white font-medium">{suggestion.title}</h4>
          <p className="text-slate-400 text-sm mt-1">{suggestion.description}</p>
          <p className="text-slate-500 text-xs mt-2">
            Submitted by {suggestion.submittedBy} •{" "}
            {new Date(suggestion.submittedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Comment input */}
      {isCommenting && (
        <div className="mb-3">
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Reason for rejection (required)..."
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            rows={2}
            autoFocus
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onApprove}
          className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-medium text-sm hover:bg-emerald-500/30 transition-colors"
        >
          ✅ Approve
        </button>
        <button
          onClick={onStartProgress}
          className="flex-1 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 font-medium text-sm hover:bg-blue-500/30 transition-colors"
        >
          🔄 Start
        </button>
        {isCommenting ? (
          <>
            <button
              onClick={onReject}
              disabled={!comment.trim()}
              className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 font-medium text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              Submit
            </button>
            <button
              onClick={onCancelComment}
              className="px-2 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={onReject}
            className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 font-medium text-sm hover:bg-red-500/30 transition-colors"
          >
            ✕ Reject
          </button>
        )}
      </div>
    </div>
  );
}

function SuggestionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (suggestion: Omit<ContentSuggestion, "id" | "submittedAt" | "status">) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SuggestionCategory>("BLOG_POST");
  const [priority, setPriority] = useState<SuggestionPriority>("MEDIUM");
  const [company, setCompany] = useState<Company>("CERE");
  const [submittedBy, setSubmittedBy] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !submittedBy.trim()) return;

    onSubmit({
      title,
      description,
      category,
      priority,
      company,
      submittedBy,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-5 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
      <h3 className="text-white font-medium mb-4">Submit New Suggestion</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-slate-400 text-xs mb-1">Your Name</label>
          <input
            type="text"
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            placeholder="e.g., Sarah"
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1">Company</label>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value as Company)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="CERE">🔵 CERE</option>
            <option value="CEF">🟣 CEF</option>
            <option value="SHARED">🟢 Shared</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-slate-400 text-xs mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief title for your suggestion"
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-slate-400 text-xs mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your content idea in detail..."
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 resize-none"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-slate-400 text-xs mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as SuggestionCategory)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-emerald-500"
          >
            {Object.entries(SUGGESTION_CATEGORY_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as SuggestionPriority)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-emerald-500"
          >
            {Object.entries(PRIORITY_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors"
        >
          Submit Suggestion
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

