"use client";

import React, { useState, useMemo } from "react";
import { useCanvasStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  timestamp: Date;
  isResolved: boolean;
}

interface ReviewCommentsPanelProps {
  blockId: string;
}

/**
 * ReviewCommentsPanel - Inline comment threads for block review discussions
 */
export default function ReviewCommentsPanel({ blockId }: ReviewCommentsPanelProps) {
  const { blockComments = {}, addBlockComment, resolveBlockComment } = useCanvasStore();
  const [newComment, setNewComment] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const comments = useMemo((): Comment[] => {
    const blockCommentsArray = blockComments[blockId] || [];
    return showResolved
      ? blockCommentsArray
      : blockCommentsArray.filter((c: Comment) => !c.isResolved);
  }, [blockComments, blockId, showResolved]);

  const unresolvedCount = useMemo(() => {
    const blockCommentsArray = blockComments[blockId] || [];
    return blockCommentsArray.filter((c: Comment) => !c.isResolved).length;
  }, [blockComments, blockId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addBlockComment?.(blockId, {
      id: `comment-${Date.now()}`,
      author: "You",
      authorAvatar: "👤",
      content: newComment.trim(),
      timestamp: new Date(),
      isResolved: false,
    });

    setNewComment("");
  };

  const handleResolve = (commentId: string) => {
    resolveBlockComment?.(blockId, commentId);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <span className="text-base">💬</span>
          Review Comments
          {unresolvedCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full">
              {unresolvedCount}
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="text-[10px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {showResolved ? "Hide resolved" : "Show all"}
        </button>
      </div>

      {/* Comments list */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <div className="text-2xl mb-2">💬</div>
            <p className="text-xs">No comments yet</p>
            <p className="text-[10px] text-gray-400 mt-1">
              Start a discussion about this block
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg border transition-colors ${
                comment.isResolved
                  ? "bg-gray-100/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/30 opacity-60"
                  : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">{comment.authorAvatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {comment.author}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                    </span>
                    {comment.isResolved && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] rounded">
                        ✓ Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  {!comment.isResolved && (
                    <button
                      onClick={() => handleResolve(comment.id)}
                      className="mt-2 text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      ✓ Mark as resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-500">
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px]">⌘</kbd>
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px] ml-0.5">↵</kbd>
            <span className="ml-1">to send</span>
          </p>
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Comment
          </button>
        </div>
      </form>
    </div>
  );
}

