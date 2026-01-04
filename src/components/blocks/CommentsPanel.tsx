"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useCanvasStore } from "@/lib/store";
import type { BlockComment } from "@/lib/types";

interface CommentsPanelProps {
  blockId: string;
  comments: BlockComment[];
  onMention?: (userId: string, userName: string) => void;
}

// Team members for @mentions
const TEAM_MEMBERS = [
  { id: "fred", name: "Fred", role: "CEO", avatar: "👔" },
  { id: "alex", name: "Alex", role: "Design", avatar: "🎨" },
  { id: "jordan", name: "Jordan", role: "Content", avatar: "✍️" },
  { id: "sam", name: "Sam", role: "Dev", avatar: "💻" },
  { id: "taylor", name: "Taylor", role: "Marketing", avatar: "📣" },
];

/**
 * CommentsPanel - Threaded comments with @mentions for block review workflow
 */
export default function CommentsPanel({ blockId, comments, onMention }: CommentsPanelProps) {
  const { addComment, resolveComment, deleteComment, replyToComment } = useCanvasStore();
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("Fred");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Filter team members based on query
  const filteredMembers = TEAM_MEMBERS.filter(
    (m) =>
      m.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Handle input change with @mention detection
  const handleInputChange = (value: string) => {
    setNewComment(value);

    // Check for @ at cursor position
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setShowMentions(true);
      setMentionQuery(atMatch[1]);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionQuery("");
    }
  };

  // Insert mention into comment
  const insertMention = (member: typeof TEAM_MEMBERS[0]) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = newComment.slice(0, cursorPos);
    const textAfterCursor = newComment.slice(cursorPos);
    
    // Remove the partial @query
    const newTextBefore = textBeforeCursor.replace(/@\w*$/, `@${member.name} `);
    setNewComment(newTextBefore + textAfterCursor);
    setShowMentions(false);
    setMentionQuery("");
    
    // Notify about mention
    onMention?.(member.id, member.name);
    
    // Refocus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Handle keyboard navigation in mention list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setMentionIndex((prev) => Math.min(prev + 1, filteredMembers.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setMentionIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        if (filteredMembers[mentionIndex]) {
          e.preventDefault();
          insertMention(filteredMembers[mentionIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowMentions(false);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Extract mentions from comment
    const mentions = [...newComment.matchAll(/@(\w+)/g)].map((m) => m[1]);

    if (replyingTo) {
      replyToComment(blockId, replyingTo, authorName, newComment.trim());
      setReplyingTo(null);
    } else {
      addComment(blockId, authorName, newComment.trim(), mentions);
    }
    
    setNewComment("");
  };

  const unresolvedComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  // Render comment content with highlighted mentions
  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={i}
            className="px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded font-medium"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          Review Comments
        </h3>
        {comments.length > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
            {unresolvedComments.length} open
          </span>
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <select
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500"
          >
            {TEAM_MEMBERS.map((m) => (
              <option key={m.id} value={m.name}>
                {m.avatar} {m.name} ({m.role})
              </option>
            ))}
          </select>
        </div>
        
        {/* Reply indicator */}
        {replyingTo && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400">
            <span>Replying to comment</span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="ml-auto hover:text-blue-300"
            >
              ✕ Cancel
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            ref={inputRef}
            value={newComment}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment... Use @ to mention team members"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
          />

          {/* Mention suggestions */}
          {showMentions && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 w-full mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10">
              {filteredMembers.map((member, idx) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => insertMention(member)}
                  className={`
                    w-full px-3 py-2 flex items-center gap-2 text-left transition-colors
                    ${idx === mentionIndex ? "bg-blue-500/20" : "hover:bg-slate-700"}
                  `}
                >
                  <span className="text-lg">{member.avatar}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{member.name}</div>
                    <div className="text-xs text-slate-400">{member.role}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!newComment.trim()}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {replyingTo ? "Send Reply" : "Send Comment"}
        </button>
      </form>

      {/* Comments list */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {unresolvedComments.length === 0 && resolvedComments.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            <span className="text-2xl block mb-1">💬</span>
            No comments yet
          </div>
        )}

        {/* Unresolved comments */}
        {unresolvedComments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            blockId={blockId}
            onResolve={() => resolveComment(blockId, comment.id)}
            onDelete={() => deleteComment(blockId, comment.id)}
            onReply={() => setReplyingTo(comment.id)}
            formatTime={formatTime}
            renderContent={renderCommentContent}
          />
        ))}

        {/* Resolved comments */}
        {resolvedComments.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
              <svg
                className="w-4 h-4 transform group-open:rotate-90 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {resolvedComments.length} resolved comment{resolvedComments.length > 1 ? "s" : ""}
            </summary>
            <div className="mt-2 space-y-2">
              {resolvedComments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-2 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg opacity-60"
                >
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="line-through">{comment.authorName}</span>
                    <span>·</span>
                    <span>{formatTime(comment.createdAt)}</span>
                    <span className="text-green-500">✓ Resolved</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 line-through">
                    {renderCommentContent(comment.content)}
                  </p>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// Comment thread component with replies
function CommentThread({
  comment,
  blockId,
  onResolve,
  onDelete,
  onReply,
  formatTime,
  renderContent,
}: {
  comment: BlockComment;
  blockId: string;
  onResolve: () => void;
  onDelete: () => void;
  onReply: () => void;
  formatTime: (date: Date) => string;
  renderContent: (content: string) => React.ReactNode;
}) {
  const [showReplies, setShowReplies] = useState(true);
  const replies = comment.replies || [];

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
      {/* Main comment */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
            {comment.authorName.charAt(0)}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {comment.authorName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {formatTime(comment.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onReply}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 transition-colors"
            title="Reply"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={onResolve}
            className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600 dark:text-green-400 transition-colors"
            title="Mark as resolved"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 transition-colors"
            title="Delete comment"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        {renderContent(comment.content)}
      </p>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-3 pl-4 border-l-2 border-amber-300 dark:border-amber-700 space-y-2">
          {showReplies ? (
            replies.map((reply, idx) => (
              <div key={idx} className="py-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {reply.authorName.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {reply.authorName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(reply.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 ml-7">
                  {renderContent(reply.content)}
                </p>
              </div>
            ))
          ) : (
            <button
              onClick={() => setShowReplies(true)}
              className="text-xs text-blue-500 hover:text-blue-400"
            >
              Show {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
